package org.mgechev.plainvm.entryhost.endpoints.pojos;

import java.net.InetAddress;

public class VirtualMachine {
    public boolean is_running;
    public double cpu;
    public String name;
    public int remote_port;
    public String os;
    public InetAddress remote_address;
    public String id;
    public double vram;
    public double ram;
    public boolean remoting_enabled;
    
    public boolean equals(VirtualMachine vm) {
        return vm.is_running == is_running && vm.cpu == cpu &&
                vm.name.equals(name) && vm.remote_port == remote_port &&
                vm.os.equals(os) && vm.remote_address.equals(remote_address) &&
                vm.id.equals(id) && vm.vram == vram && vm.ram == ram &&
                vm.remoting_enabled == remoting_enabled;
    }
}