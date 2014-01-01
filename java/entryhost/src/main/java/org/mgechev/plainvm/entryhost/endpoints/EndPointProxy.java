package org.mgechev.plainvm.entryhost.endpoints;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.UnknownHostException;
import java.util.List;

import org.apache.log4j.Logger;
import org.mgechev.plainvm.entryhost.endpoints.pojos.EndPoint;
import org.mgechev.plainvm.entryhost.endpoints.pojos.EndPointScreenshots;
import org.mgechev.plainvm.entryhost.endpoints.pojos.virtualmachine.VmData;
import org.mgechev.plainvm.entryhost.messages.actions.ClientRequest;
import org.mgechev.plainvm.entryhost.messages.responses.IsoResponse;
import org.mgechev.plainvm.entryhost.messages.responses.ScreenshotUpdate;
import org.mgechev.plainvm.entryhost.messages.responses.Update;
import org.mgechev.plainvm.entryhost.messages.responses.VmCreation;

import com.google.gson.Gson;
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

    public EndPointProxy(InetSocketAddress address) {
        this.address = address;
        this.gson = new Gson();
        this.endPointPojo = new EndPoint(address.getHostName());
        this.endPointScreenshotsPojo = new EndPointScreenshots(
                address.getHostName());
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

    public void pollForScreenshotUpdate() throws IOException {
        ClientRequest action = new ClientRequest();
        action.needResponse = false;
        action.type = "screenshot-update";
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

    public void handleUpdate(JsonObject data) {
        Update result = new Update(data);
        List<VmData> changed = endPointPojo.updateVms(result.data);
        if (changed.size() > 0) {
            result.data = changed;
            EndPointCollection.INSTANCE.updateEndPoint(address.getHostName(), result);
        }
    }

    public void handleScreenshotUpdate(JsonObject data) {
        ScreenshotUpdate result = new ScreenshotUpdate(data);
        List<VmData> changed = endPointScreenshotsPojo.updateVms(result.data);
        if (changed.size() > 0) {
            result.data = changed;
            EndPointCollection.INSTANCE.updateEndPoint(address.getHostName(), result);
        }
    }

    public void handleIsoResponse(JsonObject data) {
        IsoResponse result = new IsoResponse(data);
        EndPointCollection.INSTANCE.updateEndPoint(address.getHostName(), result);
    }
    
    public void handleVmCreationResponse(JsonObject obj) {
        VmCreation result = new VmCreation(obj);
        EndPointCollection.INSTANCE.updateEndPoint(address.getHostName(), result);
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
                read();
            } catch (JsonIOException e) {
                log.error("Json IO exception while reading from the socket");
            } catch (JsonSyntaxException e) {
                log.error("Json syntax exception while reading from the socket");
            } catch (IOException e) {
                log.error("Error while reading from the socket");
            } catch (IllegalStateException e) {
                log.error("Json syntax exception while reading from the socket");
            }
        }
        
        private void read() throws UnsupportedEncodingException {
            while (socket.isBound()) {
                this.reader = new JsonReader(new InputStreamReader(stream,
                        "UTF-8"));
                JsonParser parser = new JsonParser();
                JsonElement root = parser.parse(reader);
                JsonObject obj = root.getAsJsonObject();
                String type = obj.get("type").getAsString();
                if (type.equals("update")) {
                    handleUpdate(obj);
                } else if (type.equals("screenshot-update")) {
                    handleScreenshotUpdate(obj);
                } else if (type.equals("response-iso-chunk")) {
                    handleIsoResponse(obj);
                } else if (type.equals("create-vm-success")) {
                    handleVmCreationResponse(obj);
                } else if (type.equals("create-vm-fail")) {
                    handleVmCreationResponse(obj);
                }
            }
        }
    }

}
