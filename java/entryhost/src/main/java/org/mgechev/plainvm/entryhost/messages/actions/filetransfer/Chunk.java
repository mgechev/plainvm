package org.mgechev.plainvm.entryhost.messages.actions.filetransfer;

public class Chunk {
    public String chunk;
    public int id;
    public String filename;
    public String endpoint;
    public boolean force;
}
