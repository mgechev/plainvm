package org.mgechev.plainvm.entryhost.messages;

import java.util.List;

import org.mgechev.plainvm.entryhost.endpoints.pojos.VirtualMachine;

public class EndPointData {
    public String type;
    public List<VirtualMachine> data;
    public boolean isResponse;
}
