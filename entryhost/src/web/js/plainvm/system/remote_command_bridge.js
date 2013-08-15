/**
 * This module translates the data from different published events
 * into "plainvm readable" data i.e. data which will be understood
 * by the plainvm back-end.  Additional plus of this module is that it's
 * deciding which published message will be delivered to the server and
 * the other modules are not coupled with the message format.
 */
plainvm.register('system.remote_command_bridge', (function () {

    var sandbox;

    /**
     * Initializing the module.
     *
     * @public
     * @param {object} sndbx The sandbox.
     */
    function init(sndbx) {
        sandbox = sndbx;
        sandbox.subscribe('system-frame-received', function (data) {
            sandbox.publish(data.type, data.data);
        });
        sandbox.subscribe('system-send-frame', function (data) {
            publishCommand(data.type, data.data, data.needResponse);
        });
        sandbox.subscribe('system-create-vm', function (data) {
            publishCommand(data.type, data.data, data.needResponse);
        });
    }

    /**
     * Publising specific command. In the beginning of the method
     * the specified command is also being validated.
     *
     * @private
     * @param {string} type The type of the command
     * @param {object} data The data which will be send.
     * @param {boolean} needResponse Defines whether this request expects a response
     */
    function publishCommand(type, data, needResponse) {
        var command = {};
        command.type = type;
        if (data) {
            command.data = data;
        }
        if (needResponse) {
            command['need-response'] = true;
        }
        sandbox.publish('system-send-command', JSON.stringify(command));
    }

    return {
        init: init
    };

}()));


