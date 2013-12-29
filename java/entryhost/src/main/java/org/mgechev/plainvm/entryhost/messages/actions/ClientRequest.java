package org.mgechev.plainvm.entryhost.messages.actions;

import java.util.UUID;

public class ClientRequest {
    public boolean needResponse;
    public String type;
    public Object data;
    public UUID uid;
}
