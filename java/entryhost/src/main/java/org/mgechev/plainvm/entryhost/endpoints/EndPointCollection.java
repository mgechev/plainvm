package org.mgechev.plainvm.entryhost.endpoints;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.util.HashMap;

import org.apache.log4j.Logger;
import org.mgechev.plainvm.entryhost.messages.Action;
import org.mgechev.plainvm.entryhost.messages.EndPointData;

public enum EndPointCollection {

    INSTANCE;
    private HashMap<InetSocketAddress, EndPoint> endpoints = new HashMap<InetSocketAddress, EndPoint>();
    private Logger log = Logger.getLogger(getClass());
    
    public void connectEndPoint(InetSocketAddress address) {
        EndPoint endPoint = new EndPoint(address);
        try {
            endPoint.connect();
        } catch (UnknownHostException e) {
            log.error("Unknown host " + address.getHostName());
        } catch (IOException e) {
            log.error("IO error from the End Point");
        }
        endpoints.put(address, endPoint);
    }
    
    public void handleAction(Action action) {
        
    }
    
    public void messageReceived(EndPointData data) {
        
    }

}
