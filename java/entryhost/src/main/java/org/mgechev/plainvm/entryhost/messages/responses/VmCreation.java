package org.mgechev.plainvm.entryhost.messages.responses;

import org.mgechev.plainvm.entryhost.messages.EndPointMessage;
import org.mgechev.plainvm.entryhost.messages.createvm.CreateVm;

import com.google.gson.JsonObject;

public class VmCreation extends EndPointMessage {
    
    public CreateVm data;
    
    public VmCreation(JsonObject obj) {
        this.type = obj.get("type").getAsString();
        this.uid = obj.get("uid").getAsString();
        this.isResponse = true;
        data = new CreateVm();
        data.name = obj.getAsJsonObject("data").get("name").getAsString();
    }
}
