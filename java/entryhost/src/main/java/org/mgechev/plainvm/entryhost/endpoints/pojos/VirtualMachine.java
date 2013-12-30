package org.mgechev.plainvm.entryhost.endpoints.pojos;

import java.net.InetAddress;
import java.net.UnknownHostException;

import com.google.gson.JsonObject;
import com.google.gson.internal.LinkedTreeMap;

public class VirtualMachine extends VmData {
    public boolean is_running;
    public double cpu;
    public String name;
    public int remote_port;
    public String os;
    public InetAddress remote_address;
    public double vram;
    public double ram;
    public boolean remoting_enabled;
    
    //Currently I'm not checking whether the endpoints are equal
    public String endpoint;
    
    public VirtualMachine() {
        
    }
    
    public VirtualMachine(LinkedTreeMap<Object, Object> currentVm) {
        is_running = Boolean.parseBoolean(currentVm.get("is_running").toString());
        cpu = Double.parseDouble(currentVm.get("cpu").toString());
        name = currentVm.get("name").toString();
        remote_port = (int) Double.parseDouble(currentVm.get("remote_port").toString());
        os = currentVm.get("os").toString();
        try {
            remote_address = InetAddress.getByName(currentVm.get("remote_address").toString());
        } catch (UnknownHostException e) {
            
        }
        id = currentVm.get("id").toString();
        vram = Double.parseDouble(currentVm.get("vram").toString());
        ram = Double.parseDouble(currentVm.get("ram").toString());
        remoting_enabled = Boolean.parseBoolean(currentVm.get("remoting_enabled").toString());
        endpoint = currentVm.get("endpoint").toString();
        //Optional parameter
        try {
            endpoint = currentVm.get("endpoint").toString();    
        } catch (NullPointerException e) {
            
        }
    }
    
    public VirtualMachine(JsonObject currentVm) {
        is_running = currentVm.get("is_running").getAsBoolean();
        cpu = currentVm.get("cpu").getAsDouble();
        name = currentVm.get("name").getAsString();
        remote_port = currentVm.get("remote_port").getAsInt();
        os = currentVm.get("os").getAsString();
        try {
            remote_address = InetAddress.getByName(currentVm.get("remote_address").getAsString());
        } catch (UnknownHostException e) {
            
        }
        id = currentVm.get("id").getAsString();
        vram = currentVm.get("vram").getAsDouble();
        ram = currentVm.get("ram").getAsDouble();
        remoting_enabled = currentVm.get("remoting_enabled").getAsBoolean();
        //Optional parameter
        try {
            endpoint = currentVm.get("endpoint").getAsString();
        } catch (NullPointerException e) {
            
        }
        
    }
    
    public boolean equals(VirtualMachine vm) {
        if (vm == null) return false;
        return vm.is_running == is_running && vm.cpu == cpu &&
                vm.name.equals(name) && vm.remote_port == remote_port &&
                ((vm.remote_address == null && vm.remote_address == null) || vm.remote_address.equals(remote_address)) &&
                vm.os.equals(os) && 
                vm.id.equals(id) && vm.vram == vram && vm.ram == ram &&
                vm.remoting_enabled == remoting_enabled;
    }
}