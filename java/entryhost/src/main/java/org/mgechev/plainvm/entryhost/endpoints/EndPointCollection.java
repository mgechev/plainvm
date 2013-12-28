package org.mgechev.plainvm.entryhost.endpoints;

import java.net.Inet4Address;
import java.util.HashMap;

import org.mgechev.plainvm.entryhost.messages.Action;

public enum EndPointCollection {

    INSTANCE;
    private HashMap<String, EndPoint> endpoints;
    
    public void connectEndPoint(Inet4Address address) {

    }
    
    public void handleAction(Action action) {
        
    }

}
