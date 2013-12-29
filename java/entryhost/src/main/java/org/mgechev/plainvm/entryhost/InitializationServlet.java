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
    public void init() {
        BasicConfigurator.configure();
        for (String client : clients) {
            EndPointCollection.INSTANCE.connectEndPoint(client, port);
        }
        EndPointCollection.INSTANCE.startPolling();
        log.info("Initializing the entry host, connecting to end points.");
    }
}
