package org.mgechev.plainvm.entryhost;

import java.net.InetSocketAddress;

import javax.servlet.http.HttpServlet;

import org.apache.log4j.BasicConfigurator;
import org.apache.log4j.Logger;
import org.mgechev.plainvm.entryhost.endpoints.EndPointCollection;

public class InitializationServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private Logger log = Logger.getLogger(getClass());
    
    private int port = 5000;
    private String[] clients = { "127.0.0.1" };

    @Override
    public void init(){
        BasicConfigurator.configure();
        for (String client : clients) {
            InetSocketAddress address = null;
            address = InetSocketAddress.createUnresolved(client, port);
            EndPointCollection.INSTANCE.connectEndPoint(address);
        }
        log.info("Initializing the entry host, connecting to end points.");
    }
}
