package org.mgechev.plainvm.entryhost.endpoints;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.apache.log4j.Logger;
import org.mgechev.plainvm.entryhost.clients.ClientCollection;
import org.mgechev.plainvm.entryhost.endpoints.pojos.EndPoint;
import org.mgechev.plainvm.entryhost.endpoints.pojos.EndPointScreenshots;
import org.mgechev.plainvm.entryhost.messages.actions.ClientRequest;
import org.mgechev.plainvm.entryhost.messages.EndPointData;

public enum EndPointCollection {

    INSTANCE;
    private HashMap<String, EndPointProxy> endpoints = new HashMap<String, EndPointProxy>();
    private Logger log = Logger.getLogger(getClass());
    private Thread poller;
    
    public void connectEndPoint(String host, int port) {
        InetSocketAddress address = InetSocketAddress.createUnresolved(host, port);
        EndPointProxy endPoint = new EndPointProxy(address);
        try {
            endPoint.connect();
        } catch (UnknownHostException e) {
            log.error("Unknown host " + address.getHostName());
        } catch (IOException e) {
            log.error("IO error from the End Point");
        }
        endpoints.put(host, endPoint);
    }
    
    public void startPolling() {
        poller = new Thread(new Poller());
        poller.start();
    }
    
    public List<org.mgechev.plainvm.entryhost.endpoints.pojos.EndPointData> getEndPoints() {
        ArrayList<org.mgechev.plainvm.entryhost.endpoints.pojos.EndPointData> endpoints = new ArrayList<org.mgechev.plainvm.entryhost.endpoints.pojos.EndPointData>();
        for (EndPointProxy proxy : this.endpoints.values()) {
            endpoints.add(proxy.getEndPointPojo());
        }
        return endpoints;
    }
    
    public void handleAction(String address, ClientRequest action) {
        log.info("Sending action to end point ");
        try {
            endpoints.get(address).sendMessage(action);
        } catch (IOException e) {
            log.error("Error while sending request to " + address);
        }
    }
    
    public void updateEndPoint(org.mgechev.plainvm.entryhost.endpoints.pojos.EndPointData data) {
        if (data instanceof EndPoint) {
            ClientCollection.INSTANCE.sendUpdate("system-update", data);
        } else if (data instanceof EndPointScreenshots) {
            ClientCollection.INSTANCE.sendUpdate("system-screenshot-update", data);
        }
    }
    
    public void messageReceived(EndPointData data) {
        
    }
    
    private class Poller implements Runnable {
        public void run() {
            while (true) {
                try {
                    Thread.sleep(10000);
                    for (EndPointProxy endpoint : endpoints.values()) {
                        endpoint.pollForUpdate();
                    }
                } catch (InterruptedException e) {
                    log.error("Error while sleeping - thread interrupted");
                } catch (IOException e) {
                    log.error("Error while polling");
                }
            }
        }
    }

}
