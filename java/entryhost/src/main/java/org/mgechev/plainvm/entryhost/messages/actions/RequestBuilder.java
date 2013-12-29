package org.mgechev.plainvm.entryhost.messages.actions;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.UUID;

import org.mgechev.plainvm.entryhost.endpoints.EndPointCollection;
import org.mgechev.plainvm.entryhost.endpoints.pojos.VirtualMachine;
import org.mgechev.plainvm.entryhost.messages.actions.changestate.Action;

import com.google.gson.Gson;
import com.google.gson.internal.LinkedTreeMap;

public class RequestBuilder {

    private Gson gson;
    private ClientRequest request;
    private String message;
    private String host;
    
    public RequestBuilder(String message) {
        gson = new Gson();
        request = gson.fromJson(message, ClientRequest.class);
        this.message = message;
    }
    
    public RequestBuilder(ClientRequest request) {
        this.request = request;
        this.message = gson.toJson(request);
    }
    
    public ClientRequest build() {
        if (request.type.equals("change-vm-state")) {
            return buildChangeStateRequest();
        } else {//if (request.type.equals("machine-edited")) {
            return buildEditVmRequest();
        }
    }
    
    private ClientRequest buildChangeStateRequest() {
        ClientRequest changeStateRequest = new ClientRequest();
        changeStateRequest.type = request.type;
        LinkedTreeMap<String, String> actionMap = (LinkedTreeMap<String, String>)request.data;
        Action action = new Action();
        action.action = actionMap.get("action");
        this.host = action.endpoint = actionMap.get("endpoint");
        action.vm = actionMap.get("vm");
        changeStateRequest.data = action;
        return changeStateRequest;
    }
    
    private ClientRequest buildEditVmRequest() {
        ClientRequest editRequest = new ClientRequest();
        editRequest.type = request.type;
        LinkedTreeMap<String, String> changeMap = (LinkedTreeMap<String, String>)request.data;
        VirtualMachine vm = new VirtualMachine();
        vm.is_running = Boolean.parseBoolean(changeMap.get("is_running"));
        vm.cpu = Double.parseDouble(changeMap.get("cpu"));
        vm.name = changeMap.get("name");
        vm.remote_port = Integer.parseInt(changeMap.get("remote_port"));
        vm.os = changeMap.get("os");
        try {
            vm.remote_address = InetAddress.getByName(changeMap.get("remote_address"));
        } catch (UnknownHostException e) {
            
        }
        vm.id = changeMap.get("id");
        vm.vram = Double.parseDouble(changeMap.get("vram"));
        vm.ram = Double.parseDouble(changeMap.get("ram"));
        vm.remoting_enabled = Boolean.parseBoolean(changeMap.get("remoting_enabled"));
        vm.endpoint = changeMap.get("endpoint");
        editRequest.data = vm;
        return editRequest;
    }
    
    public String getTarget() {
        return host;
    }
    
}
