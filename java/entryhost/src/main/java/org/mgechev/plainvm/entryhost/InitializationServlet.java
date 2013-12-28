package org.mgechev.plainvm.entryhost;

import javax.servlet.http.HttpServlet;

import org.apache.log4j.Logger;

public class InitializationServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private Logger log = Logger.getLogger(getClass());

    @Override
    public void init(){
        //read configuration and connect to end points
        log.info("Initializing the entry host, connecting to end points.");
    }
}
