package org.mgechev.plainvm.entryhost.messages.actions;

import org.mgechev.plainvm.entryhost.endpoints.pojos.VirtualMachine;
import org.mgechev.plainvm.entryhost.messages.actions.changestate.Action;

import com.google.gson.Gson;
import com.google.gson.internal.LinkedTreeMap;

public class RequestBuilder {

    private Gson gson;
    private ClientRequest request;
    private String host;
    
    public RequestBuilder(String message) {
        gson = new Gson();
        request = gson.fromJson(message, ClientRequest.class);
    }
    
    public RequestBuilder(ClientRequest request) {
        this.request = request;
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
        VirtualMachine vm = new VirtualMachine(changeMap);
        this.host = vm.endpoint;
        editRequest.data = vm;
        return editRequest;
    }
    
    public String getTarget() {
        return host;
    }
    
}
