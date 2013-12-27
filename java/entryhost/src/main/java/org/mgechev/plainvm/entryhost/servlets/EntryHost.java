package org.mgechev.plainvm.entryhost.servlets;

import java.util.LinkedList;

import javax.websocket.CloseReason;
import javax.websocket.EndpointConfig;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

@ServerEndpoint(value="/plainvm/entryhost")
public class EntryHost {

    @SuppressWarnings("unused")
    private static final long serialVersionUID = 1L;
    private static LinkedList<Session> clients = new LinkedList<Session>();
    
    public EntryHost() {
        
    }
    
    @OnOpen
    public void onOpen(Session client, EndpointConfig conf) {
        clients.add(client);
    }
    
    @OnClose
    public void onClose(Session client, CloseReason reason) {
        clients.remove(client);
    }
    
    @OnMessage
    public void onMessage(Session session, String message) {
        System.out.println(message);
    }
    
    @OnError
    public void onError(Session session, Throwable error) throws Throwable {
        System.out.println("Error");
    }
}
