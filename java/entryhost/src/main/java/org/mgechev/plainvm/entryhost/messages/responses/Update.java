package org.mgechev.plainvm.entryhost.messages.responses;

import java.util.ArrayList;
import java.util.List;

import org.mgechev.plainvm.entryhost.endpoints.pojos.VirtualMachine;
import org.mgechev.plainvm.entryhost.endpoints.pojos.VmData;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

public class Update {
    public String type;
    public List<VmData> data;
    
    public Update(JsonObject update) {
        type = update.get("type").toString();
        data = new ArrayList<VmData>();
        JsonArray dataArray = update.getAsJsonArray("data");
        for (JsonElement el : dataArray) {
            JsonObject currentVm = el.getAsJsonObject();
            VirtualMachine vm = new VirtualMachine(currentVm);
            data.add(vm);
        }
    }
}
