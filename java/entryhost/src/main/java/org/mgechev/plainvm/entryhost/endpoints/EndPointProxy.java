package org.mgechev.plainvm.entryhost.endpoints;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.UnknownHostException;
import java.util.ArrayList;

import org.apache.log4j.Logger;
import org.mgechev.plainvm.entryhost.endpoints.pojos.EndPoint;
import org.mgechev.plainvm.entryhost.endpoints.pojos.VirtualMachine;
import org.mgechev.plainvm.entryhost.messages.Action;
import org.mgechev.plainvm.entryhost.messages.EndPointData;

import com.google.gson.Gson;
import com.google.gson.JsonIOException;
import com.google.gson.JsonSyntaxException;
import com.google.gson.stream.JsonReader;

public class EndPointProxy extends Thread {

    private InetSocketAddress address;
    private Socket socket;
    private Thread reader;
    private Gson gson;
    private Logger log = Logger.getLogger(getClass());
    private EndPoint endPointPojo;
    
    public EndPointProxy(InetSocketAddress address) {
        this.address = address;
        this.gson = new Gson();
    }
    
    public EndPoint getEndPointPojo() {
        return endPointPojo;
    }
    
    public void connect() throws UnknownHostException, IOException {
        socket = new Socket(address.getHostName(), address.getPort());
        socket.setKeepAlive(true);
        startReading();
    }
    
    public void writeMessage(Action message) throws IOException {
        OutputStream os = socket.getOutputStream();
        os.write(gson.toJson(message).getBytes());
        os.flush();
    }
    
    public void pollForUpdate() throws IOException {
        Action action = new Action();
        action.needResponse = false;
        action.type = "update";
        writeMessage(action);
    }
    
    private void startReading() {
        try {
            reader = new Thread(new SocketReader(socket.getInputStream()));
            reader.start();
        } catch (IOException e) {
            log.error("Error while reading from the socket");
        }
    }
    
    private void destroyEndPoint() {
        reader = null;
        try {
            socket.close();
        } catch (IOException e) {
            log.error("Error while closing the socket");
        }
    }
    
    private void handleMessage(EndPointData message) {
        if (message.type.equals("update")) {
            endPointPojo = new EndPoint((ArrayList<Object>)message.data);
        } else {
            EndPointCollection.INSTANCE.messageReceived(message);
        }
    }
    
    private class SocketReader implements Runnable {
        private InputStream stream;
        private JsonReader reader;
        private Gson gson;
        
        public SocketReader(InputStream stream) {
            this.stream = stream;
            this.reader = new JsonReader(new InputStreamReader(stream));
            this.gson = new Gson();
        }

        public void run() {
            log.info("Start reading from the given input stream");
            try {
                while (stream.available() >= 0) {
                    while (reader.hasNext()) {
                        EndPointData data = gson.fromJson(reader, EndPointData.class);
                        handleMessage(data);
                    }   
                }
            } catch (JsonIOException e) {
                destroyEndPoint();
                log.error("Json IO exception while reading from the socket");
            } catch (JsonSyntaxException e) {
                destroyEndPoint();
                log.error("Json syntax exception while reading from the socket");
            } catch (IOException e) {
                destroyEndPoint();
                log.error("Error while reading from the socket");
            }
        }
    }
    
}
