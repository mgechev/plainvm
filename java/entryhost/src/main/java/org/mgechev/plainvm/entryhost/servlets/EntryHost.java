package org.mgechev.plainvm.entryhost.servlets;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.websocket.server.ServerEndpoint;

@ServerEndpoint(value="websocket/endpoint")
public class EntryHost extends HttpServlet {

    private static final long serialVersionUID = 1L;

    protected void doGet(HttpServletRequest req, HttpServletResponse res) 
            throws ServletException, IOException {
        PrintWriter writer = res.getWriter();
        res.setContentType("text/plain");
        writer.println("Hello, World!");
    }
    
}
