package org.mgechev.plainvm.entryhost.messages.actions;

import org.mgechev.plainvm.entryhost.endpoints.pojos.virtualmachine.VirtualMachine;
import org.mgechev.plainvm.entryhost.messages.actions.changestate.Action;
import org.mgechev.plainvm.entryhost.messages.actions.filetransfer.Chunk;
import org.mgechev.plainvm.entryhost.messages.actions.filetransfer.SendChunkRequest;

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
        } else if (request.type.equals("machine-edited")) {
            return buildEditVmRequest();
        } else if (request.type.equals("system-iso-chunk")) {
            return buildIsoChunkRequest();
        }
        return null;
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
    
    private ClientRequest buildIsoChunkRequest() {
        ClientRequest isoRequest = new ClientRequest();
        LinkedTreeMap<Object, Object> actionMap = (LinkedTreeMap<Object, Object>)request.data;
        isoRequest.needResponse = request.needResponse;
        isoRequest.type = request.type;
        Chunk chunk = new Chunk();
        chunk.chunk = actionMap.get("chunk").toString();
        this.host = chunk.endpoint = actionMap.get("endpoint").toString();
        chunk.filename = actionMap.get("filename").toString();
        chunk.force = Boolean.parseBoolean(actionMap.get("force").toString());
        chunk.id = (int)Double.parseDouble(actionMap.get("id").toString());
        isoRequest.data = chunk;
        return isoRequest;
    }
    
    public String getTarget() {
        return host;
    }
    
}
