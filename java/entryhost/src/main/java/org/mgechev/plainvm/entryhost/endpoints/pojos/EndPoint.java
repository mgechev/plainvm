package org.mgechev.plainvm.entryhost.endpoints.pojos;

import java.util.ArrayList;

import org.apache.log4j.Logger;

import com.google.gson.internal.LinkedTreeMap;

public class EndPoint {
    public ArrayList<VirtualMachine> vms;
    private Logger log = Logger.getLogger(getClass());
    
    @SuppressWarnings("unchecked")
    public EndPoint(ArrayList<Object> vms) {
        try {
            for (Object vm : vms) {
                this.vms.add(new VirtualMachine((LinkedTreeMap<Object, Object>)vm));
            }
        } catch (RuntimeException e) {
            log.error("Error while parsing the virtual machines of the end point");
        }
    }
}
