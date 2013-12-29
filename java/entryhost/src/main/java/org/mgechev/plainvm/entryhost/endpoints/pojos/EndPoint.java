package org.mgechev.plainvm.entryhost.endpoints.pojos;

import java.util.ArrayList;
import java.util.List;

public class EndPoint {
    public List<VirtualMachine> vms;
    public String host;
    
    public EndPoint(String host) {
        this.host = host;
    }
    
    public List<VirtualMachine> updateVms(List<VirtualMachine> vms) {
        if (this.vms == null) {
            this.vms = vms;
            return vms;
        } else {
            ArrayList<VirtualMachine> changed = new ArrayList<VirtualMachine>();
            for (VirtualMachine vm : vms) {
                VirtualMachine currentVm = getVmById(vm.id);
                if (!currentVm.equals(vm)) {
                    changed.add(vm);
                    updateVm(vm);
                }
            }
            return changed;
        }
    }
    
    private void updateVm(VirtualMachine vm) {
        VirtualMachine currentVm = getVmById(vm.id);
        currentVm.cpu = vm.cpu;
        currentVm.is_running = vm.is_running;
        currentVm.name = vm.name;
        currentVm.os = vm.os;
        currentVm.ram = vm.ram;
        currentVm.remote_address = vm.remote_address;
        currentVm.remote_port = vm.remote_port;
        currentVm.vram = vm.vram;
    }
    
    private VirtualMachine getVmById(String id) {
        for (VirtualMachine vm : vms) {
            if (vm.id.equals(id)) {
                return vm;
            }
        }
        return null;
    }
}
