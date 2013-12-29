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
        this.endPointPojo = new EndPoint(address.getHostName());
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
            endPointPojo.updateVms(message.data);
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
            this.gson = new Gson();
        }

        public List<VirtualMachine> readVmsArray(JsonReader reader) throws IOException {
            List<VirtualMachine> vms = new ArrayList<VirtualMachine>();
            
            reader.beginArray();
            while (reader.hasNext()) {
                vms.add(readVm(reader));
            }
            reader.endArray();
            return vms;
        }
        
        public VirtualMachine readVm(JsonReader reader) throws IOException {
            VirtualMachine vm = new VirtualMachine();
            reader.beginObject();
            while (reader.hasNext()) {
                String name = reader.nextName();
                if (name.equals("is_running")) {
                    vm.is_running = reader.nextBoolean();
                } else if (name.equals("cpu")) {
                    vm.cpu = reader.nextDouble();
                } else if (name.equals("name")) {
                    vm.name = reader.nextString();
                } else if (name.equals("os")) {
                    vm.os = reader.nextString();
                } else if (name.equals("id")) {
                    vm.id = reader.nextString();
                } else if (name.equals("vram")) {
                    vm.vram = reader.nextDouble();
                } else if (name.equals("ram")) {
                    vm.ram = reader.nextDouble();
                } else if (name.equals("remote_port")) {
                    vm.remote_port = reader.nextInt();
                } else if (name.equals("remote_address")) {
                    String host = reader.nextString();
                    try {
                        vm.remote_address = InetAddress.getByName(host);
                    } catch (UnknownHostException e) {
                        log.error("Error while reading the remote address of the virtual machine " + host);
                    }
                } else if (name.equals("remoting_enabled")) {
                    vm.remoting_enabled = reader.nextBoolean();
                }
            }
            reader.endObject();
            return vm;
        }
        
        public void run() {
            log.info("Start reading from the given input stream");
            try {
                EndPointData data = new EndPointData();
                while (socket.isBound()) {
                    this.reader = new JsonReader(new InputStreamReader(stream, "UTF-8"));
                    reader.beginObject();
                    while (reader.hasNext()) {
                        String name = reader.nextName();
                        if (name.equals("type")) {
                            data.type = reader.nextString();
                        } else if (name.equals("data")) {
                            data.data = readVmsArray(reader);
                        }
                    }   
                    reader.endObject();
                    handleMessage(data);
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
