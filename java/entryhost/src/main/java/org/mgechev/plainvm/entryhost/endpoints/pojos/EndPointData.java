package org.mgechev.plainvm.entryhost.endpoints.pojos;

import java.util.ArrayList;
import java.util.List;

import org.mgechev.plainvm.entryhost.endpoints.pojos.virtualmachine.VmData;

public abstract class EndPointData {
    
    public List<VmData> vms;
    public String host;
    
    public EndPointData(String host) {
        this.host = host;
    }
    
    abstract void updateVm(VmData vm);
    
    public List<VmData> updateVms(List<VmData> vms) {
        if (this.vms == null) {
            this.vms = vms;
            return vms;
        } else {
            ArrayList<VmData> changed = new ArrayList<VmData>();
            ArrayList<VmData> newVms = new ArrayList<VmData>();
            for (VmData vm : vms) {
                VmData currentVm = getVmById(vm.id);
                if (currentVm == null) {
                    newVms.add(currentVm);
                    changed.add(vm);
                } else if (!currentVm.equals(vm)) {
                    changed.add(vm);
                    updateVm(vm);
                }
            }
            vms.addAll(newVms);
            return changed;
        }
    }
    
    protected VmData getVmById(String id) {
        for (VmData vm : vms) {
            if (vm.id.equals(id)) {
                return vm;
            }
        }
        return null;
    }
}
