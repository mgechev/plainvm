package org.mgechev.plainvm.entryhost.messages;

import java.util.List;

import org.mgechev.plainvm.entryhost.endpoints.pojos.virtualmachine.VmData;

public class EndPointData {
    public String type;
    public List<VmData> data;
    public boolean isResponse;
}
