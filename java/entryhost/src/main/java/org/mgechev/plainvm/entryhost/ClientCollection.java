package org.mgechev.plainvm.entryhost;

import java.util.HashMap;
import java.util.UUID;

public enum ClientCollection {
    INSTANCE;
    private HashMap<UUID, Client> clients;
    
    public void registerClient(UUID uid, Client client) {
        clients.put(uid, client);
    }

    public void removeClient(UUID uid) {
        clients.remove(uid);
    }
    
    public void sendMessage(UUID uid, String message) {
        clients.get(uid).sendMessage(message);
    }
    
    public void sendMessage(String message) {
        for (Client client : clients.values()) {
            client.sendMessage(message);
        }
    }
}
