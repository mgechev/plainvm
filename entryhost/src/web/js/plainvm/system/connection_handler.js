/**
 * Module for websocket communication with the plainvm server.
 */
plainvm.register('system.connection_handler', (function () {

    var schema = 'ws://',
        ws,
        sandbox;

    /**
     * Initializing the module.
     *
     * @public
     */
    function init(sndbx) {
        sandbox = sndbx;
        connect();
        sandbox.subscribe('system-send-command', function (command) {
            if (!isValidCommand(command)) {
                console.log('Invalid command ' + command);
            } else {
                sendData(command);
            }
        });
    }

    /**
     * Connects to the server
     *
     * @private
     */
    function connect() {
        var connectionUrl = schema + sandbox.getEntryHost();
        ws = new WebSocket(connectionUrl);
        console.log('Connecting to ' + connectionUrl);
        addWebSocketHandlers();
    }

    /**
     * Checking whether a given command has a valid format.
     *
     * @private
     * @param {string} command A string which is the actual command.
     * @return {boolean} true/false depending on the whether the command is valid.
     * */
    function isValidCommand(command) {
        try {
            command = JSON.parse(command);
        } catch (e) {
            return false;
        }
        if (!command || !command.type) {
            return false;
        }
        return true;
    }

    /**
     * Adds handlers to the WebSocket object.
     *
     * @private
     */
    function addWebSocketHandlers() {
        ws.onconnect = function () {
            console.log('Connection established!');
        };
        ws.onmessage = function (e) {
            var data = JSON.parse(e.data);
            sandbox.publish('system-frame-received', data);
            console.log('Message received');
        };
        ws.onerror = function (error) {
            console.log('Error occured in the connection-handler.');
            console.log(error);
        };
        ws.onclose = function () {
            setTimeout(function () {
                connect();
            }, 500);
            console.log('Connection closed!');
        };
    }

    /**
     * Sends a websocket frame to the plainvm server.
     *
     * @private
     * @param {string} data The message to be send.
     * @return {boolean} true/false depending on the result of the close operation.
     */
    function sendData(data) {
        return ws.send(data);
    }

    return {
        init: init
    };

}()));
