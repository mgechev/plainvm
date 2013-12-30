package org.mgechev.plainvm.entryhost.endpoints.pojos;

import com.google.gson.JsonObject;

public class VirtualMachineScreenshot extends VmData {
    public String pic;
    
    public VirtualMachineScreenshot(JsonObject currentScreenshot) {
        id = currentScreenshot.get("id").toString();
        pic = currentScreenshot.get("pic").toString();
    }
    
    public boolean equals(VirtualMachineScreenshot vm) {
        if (vm == null) return false;
        return vm.id == id && vm.pic == pic;
    }
}
