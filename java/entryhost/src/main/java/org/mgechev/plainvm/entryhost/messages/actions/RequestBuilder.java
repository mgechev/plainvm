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
        LinkedTreeMap<Object, Object> actionMap = (LinkedTreeMap<Object, Object>)request.data;
        Action action = new Action();
        action.action = actionMap.get("action").toString();
        this.host = action.endpoint = actionMap.get("endpoint").toString();
        action.vm = actionMap.get("vm").toString();
        changeStateRequest.data = action;
        return changeStateRequest;
    }
    
    private ClientRequest buildEditVmRequest() {
        ClientRequest editRequest = new ClientRequest();
        editRequest.type = request.type;
        LinkedTreeMap<Object, Object> changeMap = (LinkedTreeMap<Object, Object>)request.data;
        VirtualMachine vm = new VirtualMachine();
        vm.is_running = Boolean.parseBoolean(changeMap.get("is_running").toString());
        vm.cpu = Double.parseDouble(changeMap.get("cpu").toString());
        vm.name = changeMap.get("name").toString();
        vm.remote_port = (int) Double.parseDouble(changeMap.get("remote_port").toString());
        vm.os = changeMap.get("os").toString();
        try {
            vm.remote_address = InetAddress.getByName(changeMap.get("remote_address").toString());
        } catch (UnknownHostException e) {
            
        }
        vm.id = changeMap.get("id").toString();
        vm.vram = Double.parseDouble(changeMap.get("vram").toString());
        vm.ram = Double.parseDouble(changeMap.get("ram").toString());
        vm.remoting_enabled = Boolean.parseBoolean(changeMap.get("remoting_enabled").toString());
        this.host = vm.endpoint = changeMap.get("endpoint").toString();
        editRequest.data = vm;
        return editRequest;
    }
    
    public String getTarget() {
        return host;
    }
    
}
