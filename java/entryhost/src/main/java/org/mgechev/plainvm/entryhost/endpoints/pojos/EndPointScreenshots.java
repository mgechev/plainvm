package org.mgechev.plainvm.entryhost.endpoints.pojos;

import org.mgechev.plainvm.entryhost.endpoints.pojos.virtualmachine.VirtualMachineScreenshot;
import org.mgechev.plainvm.entryhost.endpoints.pojos.virtualmachine.VmData;

public class EndPointScreenshots extends EndPointData {
    
    public EndPointScreenshots(String host) {
        super(host);
    }

    void updateVm(VmData virtualMachine) {
        VirtualMachineScreenshot currentVm = (VirtualMachineScreenshot)getVmById(virtualMachine.id);
        VirtualMachineScreenshot vm = (VirtualMachineScreenshot)virtualMachine;
        currentVm.pic = vm.pic;
    }
}
