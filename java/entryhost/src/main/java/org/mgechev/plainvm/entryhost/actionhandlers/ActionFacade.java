package org.mgechev.plainvm.entryhost.actionhandlers;

import java.util.HashMap;
import java.util.UUID;

import org.mgechev.plainvm.entryhost.endpoints.EndPointCollection;
import org.mgechev.plainvm.entryhost.messages.Action;

public class ActionFacade {
    
    private HashMap<UUID, UUID> clientResponse;
    
    public ActionFacade() {
        clientResponse = new HashMap<UUID, UUID>();
    }
    
    public void handleAction(UUID client, Action action) {
        if (action.needResponse) {
            UUID uid = UUID.randomUUID();
            synchronized (clientResponse) {
                clientResponse.put(uid, client);   
            }
        }
        EndPointCollection.INSTANCE.handleAction(action);
    }
    
}
