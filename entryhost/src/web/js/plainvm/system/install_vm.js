/**
 * The module which is responsible for the system communication
 * for the virtual machine creation.
 */
plainvm.register('system.install_vm', (function () {

    var sandbox,
        installData,
        transferers = [],

        /**
         * The object used for prototype of all
         * instances which will be used for file transfer.
         *
         * @private
         */
        FileTransfer = {

            //Size of the chunks which should be send
            CHUNK_SIZE: 10008,

            //The file which should be transfered
            file: undefined,

            //Size of the file
            size: undefined,

            //End point where the file should be delivered
            destination: undefined,

            //Current chunk
            current: 0,

            /**
             * Initialize the instance with specific options
             *
             * @public
             * @param {object} data The configuration used
             * @param {function} send The method which will be used for sending chunks
             */
            init: function (data, send) {
                this.file = data.file;
                this.filename = data.filename;
                this.size = data.file.size;
                this.destination = data.destination;
                this.current = 0;
                this.sendChunk = this.sendChunk || send;
            },

            /**
             * Sends next chunk.
             *
             * @public
             * @param {function} callback A callback which should be called when the chunk is loaded
             * @return {number} The chunk sequence number
             */
            nextChunk: function (callback) {
                var currentStart = this.current * this.CHUNK_SIZE,
                    currentEnd = currentStart + this.CHUNK_SIZE;
                if (this.size < currentStart) {
                    return -1;
                }
                var blob = this.file.slice(currentStart, currentEnd),
                    self = this,
                    fileReader = new FileReader(); 
                fileReader.onload = function (e) {
                    self._chunkLoaded(e, callback);
                };
                fileReader.readAsDataURL(blob);
                return this.current;
            },

            /**
             * Callback called when a chunk is loaded
             *
             * @private
             * @param {object} e The event object
             */
            _chunkLoaded: function (e, callback) {
                var chunk = e.target.result;
                sendChunk({
                    data: chunk.substr(13, chunk.length),
                    filename: this.filename,
                    id: this.current,
                    destination: this.destination
                });
                if (typeof callback === 'function') {
                    callback();
                }
                this.current += 1;
            },

            /**
             * The default method used for sending chunks.
             * It's implementation is dummy because it should be override.
             *
             * @public
             */
            sendChunk: function (config) {
                console.log('Sending...');
            }
        };

    /**
     * Initializes the install module
     *
     * @public
     */
    function init(sndbx) {
        sandbox = sndbx;
        sandbox.subscribe('ui-install-wizard-first-section', function (data) {
            installData = {};
            $.extend(installData, data);
        });
        sandbox.subscribe('ui-install-wizard-second-section', function (data) {
            $.extend(installData, data);
            console.log(installData);
        });
        sandbox.subscribe('ui-install-wizard-finish-section', function (data) {
            $.extend(installData, data);
            installVm();
        });
        sandbox.subscribe('response-iso-chunk', function (d) {
            var t = transferers[d.filename],
                progress;

            setInfo('Chunk #' + d.id + ' is successfully saved');
            clearTimeout(t.active[d.id]);

            progress = (t.transfer.CHUNK_SIZE * d.id * 100) / t.transfer.size;
            if (progress <= 95) {
                sandbox.publish('system-vm-install-progress', progress);
            }
            if (t.transfer.CHUNK_SIZE * t.transfer.current >= t.transfer.size) {
                transferFinished(d.filename);
            } else {
                nextChunk(d.filename);
            }
        });
        sandbox.subscribe('create-vm-success', function (d) {
            var name = d.name;
            setInfo(name + ' was successfully created.');
            sandbox.publish('system-vm-install-progress', 100);
            sandbox.publish('system-install-finished');
        });
        sandbox.subscribe('create-vm-fail', function (d) {
            var name = d.name,
                cause = d.cause;
            setInfo('Error while creating ' + name + '. ' + cause);
            sandbox.publish('system-install-finished');
        });
    }

    /**
     * Publish event which updates the install info text
     *
     * @private
     * @param {string} t Text which should be displaied
     */
    function setInfo(t) {
        sandbox.publish('system-install-info', t);
    }

    /**
     * Callback which will be called when the wizad's finish button is pressed
     *
     * @private
     */
    function installVm() {
        var data = {},
            transfer = Object.create(FileTransfer),
            current;
        $.extend(data, installData);
        data.filename = data.os;
        data.destination = data.endpoint;
        transfer.init(data, sendChunk);
        transferers[data.os] = { transfer: transfer, active: [] };
        nextChunk(data.os);
    }

    /**
     * Sends new chunk and sets a timeout which will trigger new call of this
     * method for sending the same chunk. This timeout should be cleared
     * when response by the endpoint is received.
     *
     * @private
     * @param {string} filename The name of the file
     */
    function nextChunk(filename) {
        var transfer = transferers[filename].transfer;
        transfer.nextChunk(function () {
            var current = transfer.current;
            transferers[filename].active[current] = setTimeout(function () {
                setInfo('Chunk #' + current + ' timeouted. Retrying...');
                transfer.current = current;
                nextChunk(filename);
            }, 4000);
        });
    }

    /**
     * Function called when the transfer finish. It resets the
     * variables used by the current transfer.
     *
     * @private
     * @param {string} filename File name
     */
    function transferFinished(filename) {
        setInfo('Transfer finished. Creation of the VM started Virtual Machine');
        var active = transferers[filename].active;
        for (var a in active) {
            clearTimeout(active[a]);
        }
        delete transferers[filename];
        finalizeVMCreation();
    }

    /**
     * Sends the final data required for the virtual machine creation.
     *
     * @private
     */
    function finalizeVMCreation() {
        sandbox.publish('system-create-vm', {
            type: 'system-create-vm',
            data: {
                hdds: installData.hdds,
                ram: installData.ram,
                name: installData.name,
                os: installData.os,
                endpoint: installData.endpoint
            },
            needResponse: true
        });
    }

    /**
     * Sends new chunk
     *
     * @private
     * @param {object} config A configuration object
     */
    function sendChunk(config) {
        var data = {
            chunk: config.data,
            filename: config.filename,
            id: config.id,
            endpoint: config.destination,
            force: true,
            'need-response': true
        };
        sandbox.publish('system-send-frame', {
            type: 'system-iso-chunk', 
            data: data,
            needResponse: true
        });
        setInfo('Sending chunk #' + config.id + '.');
    }

    return {
        init: init
    };
}()));


