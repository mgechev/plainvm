package org.mgechev.plainvm.entryhost.endpoints;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.List;

import org.apache.log4j.Logger;
import org.mgechev.plainvm.entryhost.clients.ClientCollection;
import org.mgechev.plainvm.entryhost.endpoints.pojos.EndPoint;
import org.mgechev.plainvm.entryhost.endpoints.pojos.EndPointScreenshots;
import org.mgechev.plainvm.entryhost.endpoints.pojos.VirtualMachine;
import org.mgechev.plainvm.entryhost.endpoints.pojos.VirtualMachineScreenshot;
import org.mgechev.plainvm.entryhost.messages.actions.ClientRequest;
import org.mgechev.plainvm.entryhost.messages.responses.ScreenshotUpdate;
import org.mgechev.plainvm.entryhost.messages.responses.Update;
import org.mgechev.plainvm.entryhost.messages.EndPointData;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonIOException;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonSyntaxException;
import com.google.gson.stream.JsonReader;

public class EndPointProxy extends Thread {

    private InetSocketAddress address;
    private Socket socket;
    private Thread reader;
    private Gson gson;
    private Logger log = Logger.getLogger(getClass());
    private EndPoint endPointPojo;
    private EndPointScreenshots endPointScreenshotsPojo;
    private boolean initialized;
    
    public EndPointProxy(InetSocketAddress address) {
        this.address = address;
        this.gson = new Gson();
        this.endPointPojo = new EndPoint(address.getHostName());
        this.initialized = false;
    }
    
    public EndPoint getEndPointPojo() {
        return endPointPojo;
    }
    
    public void connect() throws UnknownHostException, IOException {
        socket = new Socket(address.getHostName(), address.getPort());
        socket.setKeepAlive(true);
        startReading();
    }
    
    public void sendMessage(ClientRequest message) throws IOException {
        OutputStream os = socket.getOutputStream();
        os.write(gson.toJson(message).getBytes());
        os.flush();
    }
    
    public void pollForUpdate() throws IOException {
        ClientRequest action = new ClientRequest();
        action.needResponse = false;
        action.type = "update";
        sendMessage(action);
    }
    
    private void startReading() {
        try {
            reader = new Thread(new SocketReader(socket.getInputStream()));
            reader.start();
        } catch (IOException e) {
            log.error("Error while reading from the socket");
        }
    }
    
//    private void destroyEndPoint() {
//        reader = null;
//        try {
//            socket.close();
//        } catch (IOException e) {
//            log.error("Error while closing the socket");
//        }
//    }
    
    public void handleUpdate(JsonObject data) {
        Update result = new Update(data);
        endPointPojo.updateVms(result.data);
        ClientCollection.INSTANCE.sendUpdate(endPointPojo);
    }
    
    public void handleScreenshotUpdate(JsonObject data) {
        ScreenshotUpdate result = new ScreenshotUpdate(data);
        endPointScreenshotsPojo.updateVms(result.data);
        ClientCollection.INSTANCE.sendScreenshotUpdate(endPointScreenshotsPojo);
    }
    
    private class SocketReader implements Runnable {
        private InputStream stream;
        private JsonReader reader;
        
        public SocketReader(InputStream stream) {
            this.stream = stream;
        }
        
        public void run() {
            log.info("Start reading from the given input stream");
            try {
                while (socket.isBound()) {
                    this.reader = new JsonReader(new InputStreamReader(stream, "UTF-8"));
                    JsonParser parser = new JsonParser();
                    JsonElement root = parser.parse(reader);
                    JsonObject obj = root.getAsJsonObject();
                    String type = obj.get("type").getAsString();
                    if (type.equals("update")) {
                        handleUpdate(obj);
                    } else if (type.equals("screenshot-update")) {
                        handleScreenshotUpdate(obj);
                    }
                    initialized = true;
                }
            } catch (JsonIOException e) {
                //destroyEndPoint();
                log.error("Json IO exception while reading from the socket");
            } catch (JsonSyntaxException e) {
                //destroyEndPoint();
                log.error("Json syntax exception while reading from the socket");
            } catch (IOException e) {
                //destroyEndPoint();
                log.error("Error while reading from the socket");
            }
        }
    }
    
}
