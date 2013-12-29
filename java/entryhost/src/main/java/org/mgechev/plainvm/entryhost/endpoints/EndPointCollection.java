package org.mgechev.plainvm.entryhost.endpoints;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.apache.log4j.Logger;
import org.mgechev.plainvm.entryhost.endpoints.pojos.EndPoint;
import org.mgechev.plainvm.entryhost.messages.Action;
import org.mgechev.plainvm.entryhost.messages.EndPointData;

public enum EndPointCollection {

    INSTANCE;
    private HashMap<InetSocketAddress, EndPointProxy> endpoints = new HashMap<InetSocketAddress, EndPointProxy>();
    private Logger log = Logger.getLogger(getClass());
    private Thread poller;
    
    public void connectEndPoint(InetSocketAddress address) {
        EndPointProxy endPoint = new EndPointProxy(address);
        try {
            endPoint.connect();
        } catch (UnknownHostException e) {
            log.error("Unknown host " + address.getHostName());
        } catch (IOException e) {
            log.error("IO error from the End Point");
        }
        endpoints.put(address, endPoint);
    }
    
    public void startPolling() {
        poller = new Thread(new Poller());
        poller.start();
    }
    
    public List<EndPoint> getEndPoints() {
        ArrayList<EndPoint> endpoints = new ArrayList<EndPoint>();
        for (EndPointProxy proxy : this.endpoints.values()) {
            endpoints.add(proxy.getEndPointPojo());
        }
        return endpoints;
    }
    
    public void handleAction(Action action) {
        
    }
    
    public void messageReceived(EndPointData data) {
        
    }
    
    private class Poller implements Runnable {
        public void run() {
            while (true) {
                try {
                    Thread.sleep(5000);
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
