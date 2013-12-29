package org.mgechev.plainvm.entryhost.messages.actions.filetransfer;

import org.mgechev.plainvm.entryhost.messages.actions.ClientRequest;

public class SendChunkRequest extends ClientRequest {
    public Chunk data; 
}
