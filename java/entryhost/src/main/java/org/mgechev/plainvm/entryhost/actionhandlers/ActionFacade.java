package org.mgechev.plainvm.entryhost.actionhandlers;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.UUID;

import org.mgechev.plainvm.entryhost.clients.ClientCollection;
import org.mgechev.plainvm.entryhost.endpoints.EndPointCollection;
import org.mgechev.plainvm.entryhost.endpoints.pojos.EndPoint;
import org.mgechev.plainvm.entryhost.endpoints.pojos.EndPointData;
import org.mgechev.plainvm.entryhost.endpoints.pojos.EndPointScreenshots;
import org.mgechev.plainvm.entryhost.messages.ClientData;
import org.mgechev.plainvm.entryhost.messages.EndPointMessage;
import org.mgechev.plainvm.entryhost.messages.actions.ClientRequest;
import org.mgechev.plainvm.entryhost.messages.actions.RequestBuilder;
import org.mgechev.plainvm.entryhost.messages.responses.ScreenshotUpdate;
import org.mgechev.plainvm.entryhost.messages.responses.Update;

public class ActionFacade {
    
    private HashMap<UUID, UUID> clientResponse;
    
    public ActionFacade() {
        clientResponse = new HashMap<UUID, UUID>();
    }
    
    public void handleAction(UUID client, String message) {
        RequestBuilder builder = new RequestBuilder(message);
        ClientRequest clientRequest = builder.build();
        if (clientRequest.needResponse) {
            UUID uid = UUID.randomUUID();
            clientRequest.uid = uid;
            synchronized (clientResponse) {
                clientResponse.put(uid, client);
            }
        }

        EndPointCollection.INSTANCE.handleAction(builder.getTarget(), clientRequest);
    }
    
    public void handleResponse(String hostname, EndPointMessage message) {
        if (message.isResponse) {
            UUID uid = UUID.fromString(message.uid);
            synchronized (clientResponse) {
                UUID client = clientResponse.remove(uid);
                ClientCollection.INSTANCE.sendMessage(client, message);
            }
        } else {
            ClientData data = new ClientData();
            data.type = "system-" + message.type;
            ArrayList<EndPointData> endpoints = new ArrayList<EndPointData>();
            EndPointData endpoint = getEndPointData(hostname, message);
            endpoints.add(endpoint);
            data.data = endpoints;
            ClientCollection.INSTANCE.broadcastMessage(data);
        }
    }
    
    private EndPointData getEndPointData(String hostname, EndPointMessage message) {
        if (message instanceof ScreenshotUpdate) {
            EndPoint result = new EndPoint(hostname);
            result.vms = ((ScreenshotUpdate)message).data;
            return result;
        } else if (message instanceof Update) {
            EndPointScreenshots result = new EndPointScreenshots(hostname);
            result.vms = ((Update)message).data;
            return result;
        }
        return null;
    }
    
}
