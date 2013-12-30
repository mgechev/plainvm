package org.mgechev.plainvm.entryhost.endpoints.pojos;

public class EndPoint extends EndPointData {
    public String host;
    
    public EndPoint(String host) {
        this.host = host;
    }
    
    void updateVm(VmData virtualMachine) {
        VirtualMachine currentVm = (VirtualMachine)getVmById(virtualMachine.id);
        VirtualMachine vm = (VirtualMachine)virtualMachine;
        currentVm.cpu = vm.cpu;
        currentVm.is_running = vm.is_running;
        currentVm.name = vm.name;
        currentVm.os = vm.os;
        currentVm.ram = vm.ram;
        currentVm.remote_address = vm.remote_address;
        currentVm.remote_port = vm.remote_port;
        currentVm.vram = vm.vram;
    }
    
}
