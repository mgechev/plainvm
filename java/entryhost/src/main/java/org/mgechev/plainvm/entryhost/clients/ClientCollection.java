package org.mgechev.plainvm.entryhost.clients;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.UUID;

import org.mgechev.plainvm.entryhost.actionhandlers.ActionFacade;
import org.mgechev.plainvm.entryhost.endpoints.EndPointCollection;
import org.mgechev.plainvm.entryhost.endpoints.pojos.EndPoint;
import org.mgechev.plainvm.entryhost.endpoints.pojos.EndPointScreenshots;
import org.mgechev.plainvm.entryhost.messages.actions.ClientRequest;
import org.mgechev.plainvm.entryhost.messages.ClientData;

import com.google.gson.Gson;

public enum ClientCollection {
    INSTANCE;
    private HashMap<UUID, Client> clients = new HashMap<UUID, Client>();
    private ActionFacade actionFacade = new ActionFacade();
    private Gson gson = new Gson();
    
    public void registerClient(UUID uid, Client client) {
        synchronized (clients) {
            clients.put(uid, client);
            client.sendMessage(gson.toJson(getInitMessage()));
        }
    }
    
    public ClientData getInitMessage() {
        ClientData message = new ClientData();
        message.type = "system-startup-init";
        message.data = EndPointCollection.INSTANCE.getEndPoints();
        return message;
    }

    public void removeClient(UUID uid) {
        synchronized (clients) {
            clients.remove(uid);   
        }
    }
    
    public void sendUpdate(EndPoint endpoint) {
        ClientData message = new ClientData();
        message.type = "system-update";
        ArrayList<EndPoint> endpoints = new ArrayList<EndPoint>();
        endpoints.add(endpoint);
        message.data = endpoints;
        broadcastMessage(message);
    }
    
    public void sendScreenshotUpdate(EndPointScreenshots screenshots) {
        
    }
    
    public void receiveMessage(UUID uid, String message) {
        actionFacade.handleAction(uid, message);
    }
    
    public void sendMessage(UUID uid, String message) {
        clients.get(uid).sendMessage(message);
    }
    
    public void broadcastMessage(ClientData data) {
        String message = gson.toJson(data);
        for (Client client : clients.values()) {
            client.sendMessage(message);
        }
    }
    
    public void sendMessage(String message) {
        for (Client client : clients.values()) {
            client.sendMessage(message);
        }
    }
}
