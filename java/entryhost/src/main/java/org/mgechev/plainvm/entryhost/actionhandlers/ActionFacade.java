package org.mgechev.plainvm.entryhost.actionhandlers;

import java.util.HashMap;
import java.util.UUID;

import org.mgechev.plainvm.entryhost.endpoints.EndPointCollection;
import org.mgechev.plainvm.entryhost.messages.actions.ClientRequest;
import org.mgechev.plainvm.entryhost.messages.actions.RequestBuilder;

import com.google.gson.Gson;

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
    
}
