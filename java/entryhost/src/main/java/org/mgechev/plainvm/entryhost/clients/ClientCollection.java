package org.mgechev.plainvm.entryhost.clients;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.UUID;

import org.mgechev.plainvm.entryhost.actionhandlers.ActionFacade;
import org.mgechev.plainvm.entryhost.endpoints.EndPointCollection;
import org.mgechev.plainvm.entryhost.endpoints.pojos.EndPointData;
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
    
    public void sendUpdate(String type, EndPointData endpoint) {
        ClientData message = new ClientData();
        message.type = type;
        ArrayList<EndPointData> endpoints = new ArrayList<EndPointData>();
        endpoints.add(endpoint);
        message.data = endpoints;
        broadcastMessage(message);
    }
    
    public ActionFacade getActionHandler() {
        return this.actionFacade;
    }
    
    public void receiveMessage(UUID uid, String message) {
        actionFacade.handleAction(uid, message);
    }
    
    public void sendMessage(UUID uid, Object message) {
        clients.get(uid).sendMessage(gson.toJson(message, message.getClass()));
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
