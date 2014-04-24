package org.mgechev.plainvm.entryhost.clients;

import java.nio.charset.CoderMalfunctionError;
import java.util.UUID;

import javax.websocket.CloseReason;
import javax.websocket.EndpointConfig;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

import org.apache.log4j.Logger;

@ServerEndpoint(value="/plainvm/entryhost")
public class Client {

    @SuppressWarnings("unused")
    private static final long serialVersionUID = 1L;
    private UUID uid;
    private Session session;
    private Logger log = Logger.getLogger(Client.class);
    
    public Client() {
        uid = UUID.randomUUID();
    }
    
    @OnOpen
    public void onOpen(Session client, EndpointConfig conf) {
        session = client;
        ClientCollection.INSTANCE.registerClient(uid, this);
    }
    
    @OnClose
    public void onClose(Session client, CloseReason reason) {
        ClientCollection.INSTANCE.removeClient(uid);
    }
     
    @OnMessage
    public void onMessage(Session session, String message) {
        ClientCollection.INSTANCE.receiveMessage(uid, message);
    }
    
    @OnError
    public void onError(Session session, Throwable error) throws Throwable {
        System.out.println("Error");
    }
    
    public void sendMessage(String message) {
        try {
            session.getAsyncRemote().sendText(message);
            log.info("Sending message to the client " + message);
        } catch (CoderMalfunctionError e) {
            
        }
    }
}