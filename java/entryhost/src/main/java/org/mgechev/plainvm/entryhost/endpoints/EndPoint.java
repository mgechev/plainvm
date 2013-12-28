package org.mgechev.plainvm.entryhost.endpoints;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.UnknownHostException;

import org.apache.log4j.Logger;
import org.mgechev.plainvm.entryhost.messages.EndPointData;

import com.google.gson.Gson;
import com.google.gson.JsonIOException;
import com.google.gson.JsonSyntaxException;
import com.google.gson.stream.JsonReader;

public class EndPoint extends Thread {

    private InetSocketAddress address;
    private Socket socket;
    private Thread reader;
    private Logger log = Logger.getLogger(getClass());
    
    public EndPoint(InetSocketAddress address) {
        this.address = address;
    }
    
    public void connect() throws UnknownHostException, IOException {
        socket = new Socket(address.getHostName(), address.getPort());
        socket.setKeepAlive(true);
        startReading();
    }
    
    public void writeMessage(String message) throws IOException {
        OutputStream os = socket.getOutputStream();
        os.write(message.getBytes());
        os.flush();
    }
    
    private void startReading() {
        try {
            reader = new Thread(new SocketReader(socket.getInputStream()));
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
            try {
                while (stream.available() >= 0) {
                    while (reader.hasNext()) {
                        EndPointData data = gson.fromJson(reader, EndPointData.class);
                        EndPointCollection.INSTANCE.messageReceived(data);
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
