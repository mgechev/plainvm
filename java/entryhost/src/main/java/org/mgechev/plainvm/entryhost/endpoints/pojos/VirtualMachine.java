package org.mgechev.plainvm.entryhost.endpoints.pojos;

import java.net.InetAddress;
import java.net.UnknownHostException;

import org.apache.log4j.Logger;

import com.google.gson.internal.LinkedTreeMap;

public class VirtualMachine {
    private Logger log = Logger.getLogger(getClass());
    public boolean is_running;
    public double cpu;
    public String name;
    public Integer remote_port;
    public String os;
    public InetAddress remoting_address;
    public String id;
    public double vram;
    public double ram;

    public VirtualMachine(LinkedTreeMap<Object, Object> vm) {
        try {
            is_running = Boolean.parseBoolean(vm.get("is_running").toString());
            cpu = Double.parseDouble(vm.get("cpu").toString());
            name = vm.get("name").toString();
            remote_port = Integer.parseInt(vm.get("remote_port").toString());
            os = vm.get("os").toString();
            remoting_address = InetAddress.getByName(vm.get("remoting_address").toString());
            id = vm.get("id").toString();
            vram = Double.parseDouble(vm.get("vram").toString());
            ram = Double.parseDouble(vm.get("ram").toString());
        } catch (UnknownHostException e) {
            log.error("Error while parsing the inet address");
        } catch (RuntimeException e) {
            log.error("Error while parsing the virtual machine");
        }
    }
}