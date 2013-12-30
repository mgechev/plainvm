package org.mgechev.plainvm.entryhost.endpoints.pojos.virtualmachine;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

public class VirtualMachineScreenshot extends VmData {
    public String pic;
    
    public VirtualMachineScreenshot(JsonObject currentScreenshot) {
        id = currentScreenshot.get("id").getAsString();
        JsonElement el = currentScreenshot.get("pic");
        if (!el.isJsonNull()) {
            pic = el.getAsString();
        }
    }
    
    public boolean equals(VirtualMachineScreenshot vm) {
        if (vm == null) return false;
        return vm.id == id && vm.pic == pic;
    }
}
