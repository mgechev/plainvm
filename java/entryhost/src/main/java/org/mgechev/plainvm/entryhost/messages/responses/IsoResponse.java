package org.mgechev.plainvm.entryhost.messages.responses;

import org.mgechev.plainvm.entryhost.messages.EndPointMessage;
import org.mgechev.plainvm.entryhost.messages.actions.filetransfer.Chunk;

import com.google.gson.JsonObject;

public class IsoResponse extends EndPointMessage {

    public Chunk data;
    
    public IsoResponse(JsonObject data) {
        this.type = data.get("type").getAsString();
        this.uid = data.get("uid").getAsString();
        this.isResponse = true;
        JsonObject responseData = data.getAsJsonObject("data");
        this.data = new Chunk();
        this.data.filename = responseData.get("filename").getAsString();
        this.data.id = responseData.get("id").getAsInt();
    }
    
}
