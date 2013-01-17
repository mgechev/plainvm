/**
 * Creates the core of plainvm. This self-invoking function
 * defines the core methods of the "sandbox" plus the publish/subscribe 
 * implementation used by all client modules.
 *
 * @author Minko Gechev (@mgechev)
 * @return {object} The public interface of the core.
 *
 */
var plainvm = (function () {
    
    var modules = {},
        vms = {},
        screenshots = {},
        VM_SERVER = window.location.hostname,
        VM_SERVER_PORT = parseInt(window.location.port, 10),
        REMOTING_PORT = 8080,
        currentTheme = 'fresh';

    /* * * * * * * * * *  Initializing the modules' sandbox * * * * * * * * * */

    /**
     * Publish subscribe implementation which is providing communication
     * and decoupling between the modules.
     *
     * @return {object} Public interface of the publish/subscribe
     */
    var pubSub = (function () {
        var topics = {};

        /**
         * This method is subscribing a module to an event with given callback.
         *
         * @public
         * @param {string} event The event name.
         * @param {function} callback The callback which will be called when the event occure.
         */
        function subscribe(event, callback) {
            var subs = topics[event];
            if (subs === undefined) {
                subs = [];
            }
            subs.push(callback);
            topics[event] = subs;
        }

        /**
         * Method which is publishing different events with specified arguments.
         *
         * @public
         * @param {string} event Event name.
         * @param {array} args Arguments array.
         * @return {boolean} true/false depending on whether any callback is called.
         */
        function publish(event, args) {
            var callbacks = topics[event];
            if (callbacks !== undefined) {
                for (var i = 0; i < callbacks.length; i += 1) {
                    callbacks[i].call(null, args);
                }
                return true;
            } 
            console.log('No subscribtions for ' + event);
            return false;
        }
        return {
            publish: publish,
            subscribe: subscribe
        };
    }());

    /**
     * Returns the current VM server.
     *
     * @public
     * @return {string} the server hostname.
     */
    function getVMServer() {
        return VM_SERVER;
    }

    /**
     * Returns the VM server port. 
     *
     * @public
     * @return {number}
     */
    function getVMServerPort() {
        return VM_SERVER_PORT;
    }

    /**
     * Returns the remoting port.
     *
     * @public
     * @return {number}
     */
    function getRemotingPort() {
        return REMOTING_PORT;
    }

    /**
     * This method is used for getting a specific VM by it's id.
     *
     * @public
     * @return {object} specific VM
     */
    function getVmByUid(id) {
        return vms[id] || null;
    }

    /**
     * Gets all VMs.
     *
     * @public
     * @return {object} array of all VMs.
     */
    function getVms() {
        return vms;
    }

    /**
     * Gets all virtual machines as an array
     *
     * @public
     * @return {array} array of all VMs
     */
    function getVmsArray(vms) {
        var result = [];
        for (var uid in vms) {
            result.push(vms[uid]);
        }
        return result;
    }

    /**
     * Gets the current UI theme. Usually (currently) a jQWidget's theme.
     *
     * @public
     * @return {string} string containing the theme name.
     */
    function getTheme() {
        return currentTheme;
    }
    
    /**
     * Sets the current theme. The method notifies with "ui-theme-changed" event.
     *
     * @public
     * @param {string} theme The theme name.
     */
    function setTheme(theme) {
        if (theme) {
            currentTheme = theme;
            pubSub.publish('ui-theme-changed', theme);
        }
    }

    /**
     * Gets virtual machine screenshot by it's uid.
     *
     * @public
     * @param {string} uid Virtual machine's unique id.
     * @returns {string} Base64 encoded image.
     */
    function getScreenshotById(uid) {
        if (screenshots && screenshots[uid]) {
            return screenshots[uid].pic;
        }
        return null;
    }

    /**
     * The method puts specific operating system into two (currently) groups - linux/win.
     *
     * @public
     * @param {string} name Operating system.
     * @return {string} operating system type.
     */
    function getVMOs(name) {
        name = name.toLowerCase();
        if (/(linux|ubuntu|fedora|debian|mandriva|gentoo)/.test(name)) {
            return 'linux';
        } else if (/(windows)/.test(name)) {
            return 'win';
        } else {
            return undefined;
        }
    }
 
    var sandbox = pubSub;
    sandbox.getVMServer = getVMServer;
    sandbox.getVMServerPort = getVMServerPort;
    sandbox.getVmByUid = getVmByUid;
    sandbox.getVms = getVms;
    sandbox.getTheme = getTheme;
    sandbox.getVMOs = getVMOs;
    sandbox.getVmsArray = getVmsArray;
    sandbox.getScreenshotById = getScreenshotById;
    sandbox.getRemotingPort = getRemotingPort;
//    sandbox.setTheme = setTheme;


    /* * * * * * * * * End of the sandbox initialization * * * * * * * * */


    /* * * * * *  Initializing the static methods of plainvm * * * * * * */

    /**
     * Registering a module. This method is only putting the module into the hashmap
     * containig all modules.
     *
     * @static
     * @public
     * @param {string} name Module name.
     * @param {object} module The module.
     */
    function register(name, module) {
        if (modules[name] !== undefined) {
            console.log('Module "' + name + '" already exists!');
        }
        modules[name] = module;
    }

    /**
     * Starting a specific module. This module is calling the init method of the specified module.
     *
     * @static
     * @public
     * @param {string} name The module name
     * @return {boolean} true/false depending on whether the init method have been called.
     */
    function start(name) {
        var module = modules[name];
        if (module === undefined) {
            console.log('Module "' + name + '" does not exists!');
            return false;
        }
        if (typeof module.init === 'function') {
            module.init(sandbox);
            return true;
        } else {
            console.log('Cannot init the module "' + name + '" because there\'s not init method');
            return false;
        }
    }

    /**
     * Unregister removes initialized module. It's also calling it's detach method.
     *
     * @static
     * @public
     * @param {string} name The module's name
     * @return {boolean} true/false depends whether the detach module have been called.
     */
    function unregister(name) {
        var module = modules[name],
            result = false;
        if (module !== undefined) {
            if (typeof module.detach === 'function') {
                module.detach();
                result = true;
            } else {
                console.log('Cannot detach "' + name + '" detach method is missing');
            }
            delete modules[name];
            return result;
        }
        console.log('Cannot remove module "' + name + '" because it\'s not registered');
        return false; 
    }

    /**
     * Initializing the core. The method is attaching few event listeners (using
     * the pub/sub implementation above) required for initializing and keeping consistent
     * different properties.
     *
     * @static
     * @public
     */
    function init() {
        var parseHosts = function (hosts) {
            if (hosts) {
                var host,
                    vm,
                    vmsArray,
                    vmHostUid,
                    vms = {};
                for (var i = 0; i < hosts.length; i += 1) {
                    host = hosts[i][0];
                    vmHostUid = host.replace(/\./g, '-');
                    vmsArray = hosts[i][1];
                    for (var j = 0; j < vmsArray.length; j += 1) {
                        vm = vmsArray[j];
                        vm.uid = vm.id + '-' + vmHostUid;
                        vm.endpoint = host;
                        vms[vm.uid] = vm;
                    }
                }
            }
            return vms;
        };

        pubSub.subscribe('system-startup-init', function (hosts) {
            vms = parseHosts(hosts);
            pubSub.publish('ui-startup-init', getVmsArray(vms));
        });

        pubSub.subscribe('system-update', function (hosts) {
            var updatedVms = parseHosts(hosts);
            for (var uid in updatedVms) {
                vms[uid] = updatedVms[uid];
            }
            pubSub.publish('ui-update-vms', getVmsArray(updatedVms));
        });

        pubSub.subscribe('system-screenshot-update', function (data) {
            var screens = parseHosts(data);
            for (var uid in screens) {
                screenshots[uid] = screens[uid];
            }
            pubSub.publish('ui-screenshot-update', getVmsArray(screenshots));
        });
    }

    /* * * * * * * * * * * The initialization of the static method is finished  * * * * * * * * * */

    return {
        init: init,
        register: register,
        start: start,
        unregister: unregister
    };

}());

plainvm.init();

/**
 * Module which is responsible for the preloading of the application.
 * It's attaching to the "loading-coplete" event and only if this event
 * is being fired the preloader will be hide.
 */
plainvm.register('ui.preloader', function () {

    var loadingScreen = $('<div class="plainvm-preloader"></div>'),
        loadingLabel = $('<span class="plainvm-preloader-label"><div class="plainvm-preloader-icon"></div>Loading...</span>');

    /**
     * Initializing the module.
     *
     * @public
     * @param {object} sandbox The sandbox
     */
    function init(sandbox) {
        if (!$.isReady) {
            $(document).ready(function () {
                show();
            });
        }

        sandbox.subscribe('system-loading-completed', function () {
            hide();
        });
    }

    /**
     * Showing the preloader page.
     *
     * @public
     */
    function show() {
        $(document.body).append(loadingScreen);
        loadingScreen.empty();
        loadingScreen.append(loadingLabel);
        loadingLabel.css('left', (loadingScreen.width() - loadingLabel.width()) / 2);
        loadingLabel.css('top', (loadingScreen.height() - loadingLabel.height()) / 2);
    }

    /**
     * Hiding the preloading screen.
     *
     * @public
     */
    function hide() {
        loadingScreen.fadeOut(300, function () {
            loadingScreen.remove();
        });
    }

    /**
     * Public interface
     */
    return {
        init: init,
        hide: hide,
        show: show
    };
}());


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
        var connectionUrl = schema + sandbox.getVMServer() + ':' + sandbox.getVMServerPort();
        ws = new WebSocket(connectionUrl);
        console.log('Connecting to ' + connectionUrl);
        addWebSocketHandlers();
        sandbox.subscribe('system-send-command', function (command) {
            if (!isValidCommand(command)) {
                console.log('Invalid command ' + command);
            } else {
                sendData(command);
            }
        });
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
            sandbox.publish('system-response-received', data);
            console.log('Message received');
        };
        ws.onerror = function (error) {
            console.log('Error occured in the connection-handler.');
        };
        ws.onclose = function () {
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

/**
 * Manages the list of VMs in the left side of the screen
 */
plainvm.register('ui.vms-list', (function () {

    var sandbox,
        machineTemplate,
        selectedMachine,
        listContainer;

    /**
     * Initializing the module.
     *
     * @public
     * @param {object} sndbx The sandbox.
     */
    function init(sndbx) {
        machineTemplate = $('#vms-list-template').html();
        listContainer = $('#plainvm-vms');
        sandbox = sndbx;

        initVMItemMenu();
        subscribeToSystemEvents();
        addEventHandlers();
    }

    /**
     * Adding event handlers to the DOM elements.
     *
     * @private
     */
    function addEventHandlers() {
        $('.plainvm-vms').on('click', '.plainvm-vm-item', function () {
            selectVM(this.id);
        });
        $('.plainvm-vms').on('mouseenter', '.plainvm-vm-item', function () {
            if (this.id !== selectedMachine) {
                $(this).addClass('plainvm-vm-item-hover');
            }
        });
        $('.plainvm-vms').on('mouseleave', '.plainvm-vm-item', function () {
            $(this).removeClass('plainvm-vm-item-hover');
        });
        $(document).on('keydown', function (e) {
            var handled = false,
                id,
                keyCode = e.keyCode;
            if (keyCode === 38) {
                id = getIdByDiv($('#' + selectedMachine).prev());
                handled = true;
            } else if (keyCode === 40) {
                id = getIdByDiv($('#' + selectedMachine).next());
                handled = true;
            }
            if (id !== undefined)
                selectVM(id);
            if (handled)
                e.preventDefault();
        });
    }

    /**
     * Gets VM id by it's div list item
     *
     * @private
     * @param {object} div Div which is the actual list item corresponding to the vm
     * @return {string} Returns the VM id or undefined if the div is not of type .plainvm-vm-item
     */
    function getIdByDiv(div) {
        if (!div.is('.plainvm-vm-item')) {
            return undefined;
        }
        return div.attr('id');
    }

    /**
     * Subscribing to system events which other modules may publish.
     *
     * @private
     */
    function subscribeToSystemEvents() {

        sandbox.subscribe('ui-startup-init', function (data) {
            if (data) {
                data.sort(function (a, b) {
                    if (a.endpoint > b.endpoint) {
                        return 1;
                    } else if (a.endpoint < b.endpoint) {
                        return -1;
                    }
                    return 0;
                });
                renderMachines(data);
                selectVM(data[0].uid);
                addTooltipToAll();
                sandbox.publish('system-loading-completed');
            }
        });

        sandbox.subscribe('ui-update-vms', function (data) {
            data = data || [];
            for (var i = 0; i < data.length; i += 1) {
                var vmItem = $(renderMachine(data[i])),
                    selector = '#' + data[i].uid,
                    oldElem = $(selector);
                if (!oldElem[0]) {
                    vmItem.insertAfter($('.plainvm-vm-item').last());
                } else {
                    vmItem.insertBefore(oldElem);
                    oldElem.remove();
                    addTooltipsTo(selector);
                    if (selectedMachine === data[i].uid) {
                        selectVM(data[i].uid);
                    }
                }
            }
        });
    }

    /**
     * Initializing the menu which each VM in the list has.
     *
     * @private
     */
    function initVMItemMenu() {
        $('.plainvm-vms').on('click', '.plainvm-vm-menu-icon', function (e) {
            var type = $(this).data('type'),
                vmId = this.parentNode.parentNode.id,
                vm,
                params = {},
                eventType;
            if (isButtonDisabled(vmId, this.className)) return;
            if (type === 'menu') {
                sandbox.publish('ui-show-menu-clicked', vmId);
            } else {
                eventType = 'change-vm-state';
                vm = sandbox.getVmByUid(vmId)
                params.vm = vm.id;
                params.endpoint = vm.endpoint;
                switch (type) {
                    case 'start':
                        params.action = 'start';
                        break;
                    case 'poweroff':
                        params.action = 'poweroff';
                        break;
                    case 'shutdown':
                        params.action = 'shutdown';
                        break;
                    default:
                        console.log('Unknown VM operation');
                        break;
                }
                sandbox.publish(eventType, params);
            }
            e.stopImmediatePropagation();
        });
        $('.plainvm-vms').on('mousedown', '.plainvm-vm-menu-icon', function (e) {
            var id = this.parentNode.parentNode.id;
            if (isButtonDisabled(id, this.className)) {
                $(this).addClass('plainvm-vm-menu-icon-mousedown-disabled');
            } else {
                $(this).addClass('plainvm-vm-menu-icon-mousedown');
            }
        });
        $(document.body).bind('mouseup', function (e) {
            $('.plainvm-vm-menu-icon').removeClass('plainvm-vm-menu-icon-mousedown');
            $('.plainvm-vm-menu-icon').removeClass('plainvm-vm-menu-icon-mousedown-disabled');
        });
        $('.plainvm-vms').on('mouseenter', '.plainvm-vm-menu-icon', function (e) {
            $(this).addClass('plainvm-vm-menu-icon-hover');
        });
        $('.plainvm-vms').on('mouseleave', '.plainvm-vm-menu-icon', function (e) {
            $(this).removeClass('plainvm-vm-menu-icon-hover');
        });
    }

    function isButtonDisabled(id, className) {
        var isRunning = sandbox.getVmByUid(id).is_running;
        return  (isRunning &&
                (className.indexOf('plainvm-vm-menu-icon-menu') >= 0 ||
                 className.indexOf('plainvm-vm-menu-icon-start') >= 0)) ||

                (!isRunning &&
                (className.indexOf('plainvm-vm-menu-icon-poweroff') >= 0 ||
                 className.indexOf('plainvm-vm-menu-icon-shutdown') >= 0));
    }

    /**
     * Adds tooltips to the menu buttons.
     *
     * @private
     * @param {string} machine The machine selector all empty string if we want to add tooptips to all machines.
     */
    function addTooltips(machine) {
        var theme = sandbox.getTheme();
        machine = machine || '';
        $(machine + '.plainvm-vm-menu-icon-menu').jqxTooltip({ 
            content: 'Menu', 
            position: 'mouse', 
            theme: theme
        });
        $(machine + '.plainvm-vm-menu-icon-start').jqxTooltip({ 
            content: 'Start', 
            position: 'mouse', 
            theme: theme 
        });
        $(machine + '.plainvm-vm-menu-icon-shutdown').jqxTooltip({ 
            content: 'Shutdown', 
            position: 'mouse', 
            theme: theme 
        });
        $(machine + '.plainvm-vm-menu-icon-poweroff').jqxTooltip({ 
            content: 'Poweroff', 
            position: 'mouse', 
            theme: theme 
        });
    }

    /**
     * Adding tooltip to a specific machine's menu
     *
     * @private
     * @param {string} machine Selector of the machine.
     */
    function addTooltipsTo(machine) {
        if (machine) {
            addTooltips(machine + ' ');
        }
    }

    /**
     * Adds tooltips to all machines' menus
     *
     * @private
     */
    function addTooltipToAll() {
        addTooltips();
    }

    /**
     * Callback for the event - click on a vm item.
     *
     * @private
     * @param {string} vmId Id of the virtual machine
     */
    function selectVM(vmId) {
       $('.plainvm-vm-item').removeClass('plainvm-vm-item-selected');
       $('#' + vmId).addClass('plainvm-vm-item-selected'); 
       sandbox.publish('ui-vm-selected', vmId);
       selectedMachine = vmId;
    }

    /**
     * Renders all machines.
     *
     * @private
     * @param {array} machines An array with the ids of all machines.
     */
    function renderMachines(machines) {
        var html = '';
        for (var i = 0; i < machines.length; i += 1) {
            html += renderMachine(machines[i]);
        }
        listContainer.html(html);
    }

    /**
     * Render a specific vm item.
     *
     * @private
     * @param {string} machine The vm id.
     */
    function renderMachine(machine) {
        var machineCopy = {};
        $.extend(machineCopy, machine);
        machineCopy.abr = sandbox.getVMOs(machineCopy.os);
        var html = Mustache.to_html(machineTemplate, machineCopy);
        return html;
    }

   return {
        init: init
    };
}()));

/**
 * A module which is showing the VM details (like RAM, CPU, etc.)
 */
plainvm.register('ui.vm_details', (function () {
    
    var template, 
        container,
        sandbox;

    /**
     * Initializing a specific module.
     *
     * @public
     * @param {object} sndbx The sandbox.
     */
    function init(sndbx) {
        template = $('#vm-details-template').html();
        sandbox = sndbx;
        container = $('#plainvm-vm-state');
        sandbox.subscribe('ui-vm-selected', function (id) {
            renderVmInfo(id);
        });
    }

    /**
     * Renders the data for a specific machine.
     *
     * @private
     * @param {string} id The id of the machine.
     */
    function renderVmInfo(id) {
        var vm = sandbox.getVmByUid(id);
        container.html(Mustache.to_html(template, vm));
    }

    return {
        init: init
    };
}()));

plainvm.register('ui.vm_status_pic', (function () {

    var sandbox,
        selectedMachine,
        screenContainer,
        NOT_RUNNING_PIC = 'css/images/not-running.png',
        activeTooltip = false;

    /**
     * Initializing the module.
     *
     * @public
     * @param {object} sndbox The sandbox.
     */
    function init(sndbx) {
        sandbox = sndbx;
        screenContainer = $('#plainvm-machine-screenshot');

        subscribeToSystemEvents();
        addEventHandlers();
    }

    /**
     * Subscribes to events which other modules may fire.
     *
     * @private
     */
    function subscribeToSystemEvents() {

        sandbox.subscribe('ui-vm-selected', function (data) {
            selectedMachine = data;
            updateMachineStatus();
        });

        sandbox.subscribe('ui-screenshot-update', function (data) {
            if (data) {
                updateMachineStatus();
            }
        });

    }

    /**
     * Adds DOM event handlers. The idea for these event handlers is to stop the
     * screenshot polling once the user "blurs" the current window.
     *
     * @private
     */
    function addEventHandlers() {

    }

    /**
     * Updates the machine's status picture. Depending on whether the
     * machine is powered on or off different kind pic is going to be shown.
     *
     * @private
     */
    function updateMachineStatus() {
        var pic = sandbox.getScreenshotById(selectedMachine);
        if (pic) {
            screenContainer.css('background-image', 'url(' + pic + ')');
            if (!activeTooltip) {
                screenContainer.jqxTooltip({ 
                    content: 'Click to control the machine',
                    position: 'mouse',
                    theme: sandbox.getTheme()
                });
                activeTooltip = true;
            }
        } else {
            if (!screenContainer[0].style.backgroundImage || 
                screenContainer[0].style.backgroundImage.indexOf(NOT_RUNNING_PIC) < 0) {
                screenContainer.css('background-image', 'url(' + NOT_RUNNING_PIC + ')');
            }
            if (activeTooltip) {
                screenContainer.jqxTooltip('destroy');
                activeTooltip = false;
            }
            
        }
    }

    return {
        init: init
    };

}()));

/**
 * Shows the virtual machine's settings editing dialog.
 */
plainvm.register('ui.vm_settings', (function () {

    var sandbox,
        validator,
        currentVm,
        template;

    /**
     * Initializing the current module.
     *
     * @public
     * @param {object} sndbx The sandbox.
     */
    function init(sndbx) {
        template = $('#vm-edit-template').html();
        sandbox = sndbx;
        sandbox.subscribe('ui-show-menu-clicked', function (id) {
            renderMenu(id);
        });
    }

    /**
     * Renders the menu which is used for editing the machine settings.
     *
     * @private
     * @param {string} vmId The machine id.
     */
    function renderMenu(vmId) {
        currentVm = sandbox.getVmByUid(vmId);
        if (!currentVm.is_running) {
            initSettingsMenu();
            initValidation();
        }
    }

    /**
     * Initializes the form validation.
     *
     * @private
     */
    function initValidation() {
        validator = $('#plainvm-edit-vm-form');
        validator.jqxValidator({
            rules: [
                { 
                    input: '#address-input', 
                    message: 'Invalid IP address', 
                    action: 'keyup,keydown', 
                    rule: function (input) {
                        return (/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/).test(input.val());
                    }
                },
                {
                    input: '#machine-name', 
                    message: 'Invalid name', 
                    action: 'keyup, keydown', 
                    rule: function (input) {
                        return (/^[a-zA-Z]{2,}[\sa-zA-Z0-9._-]{1,}$/).test(input.val());
                    }
                }
            ]
        });
    }

    /**
     * Initializes the whole form (with all widgets).
     *
     * @private
     */
    function initSettingsMenu() {
        var dialog = $(Mustache.to_html(template, currentVm)),
            theme = sandbox.getTheme();
        dialog.jqxWindow({ 
            theme: theme,
            isModal: true,
            width: 400, 
            height: 300,
            animationType: 'fade', 
            draggable: false, 
            resizable: false,
            autoOpen: false,
            showCloseButton: false
        });
        dialog.jqxWindow('open');
        dialog.bind('closed', function () {
            dialog.remove();
        });
        $('#cpu-slider').jqxSlider({ 
            value: parseInt(currentVm.cpu, 10), 
            min: 1, 
            max: 100, 
            width: 150, 
            showTicks: false, 
            mode: 'fixed',
            theme: theme
        });
        $('#ram-slider').jqxSlider({ 
            value: parseInt(currentVm.ram, 10), 
            min: 1, 
            max: 4096, 
            width: 150, 
            showTicks: false, 
            mode: 'fixed',
            theme: theme 
        });
        $('#video-slider').jqxSlider({ 
            value: parseInt(currentVm.vram, 10),
            min: 1,
            max: 128,
            width: 150,
            showTicks: false,
            mode: 'fixed',
            theme: theme
        });
        $('#port-input').jqxNumberInput({
            decimal: parseInt(currentVm.vrde_port, 10),
            max: 65535,
            min: 200,
            width: 150,
            inputMode: 'simple',
            spinButtons: true,
            decimalDigits: 0,
            spinMode: 'advance',
            theme: theme,
            height: '25px'
        });
        $('#save-changes').jqxButton({ theme: theme, width: 60 });
        $('#cancel-changes').jqxButton({ theme: theme, width: 60 });
        $('#cancel-changes').click(function () {
            dialog.jqxWindow('close');
        });
        $('#save-changes').click(function () {
            if (isInputValid()) {
                saveChanges();
                dialog.jqxWindow('close');
            }
        });
    }

    /**
     * Validates the form.
     *
     * @private
     * @return {boolean} true/false depeinding on whether the form is valid.
     */
    function isInputValid() {
        return validator && validator[0] && validator.jqxValidator('validate');
    }

    /**
     * Saving the form results. This method could only be called on valid results.
     *
     * @private
     */
    function saveChanges() {
        currentVm.cpu = $('#cpu-slider').jqxSlider('value');
        currentVm.ram = $('#ram-slider').jqxSlider('value');
        currentVm.vrde_port = parseInt($('#port-input').jqxNumberInput('decimal'), 10);
        currentVm.vrde_address = $('#address-input').val();
        currentVm.name = $('#machine-name').val();
        currentVm.vram = $('#video-slider').jqxSlider('value');
        sandbox.publish('ui-update-vms', [currentVm]);
        sandbox.publish('machine-edited', currentVm);
    }

    return {
        init: init
    };
}()));

/**
 * Virtual machine remoting. This module is responsible for the virtual machines realtime control.
 */
plainvm.register('ui.vm_control', (function () {

    var selectedMachine,
        template,
        clickTimeout,
        sandbox;

    /**
     * Initializing the module.
     *
     * @public
     * @param {object} sndbx The sandbox.
     */
    function init(sndbx) {
        sandbox = sndbx;
        template = $('#vm-remoting-template').html();
        addEventHandlers();
        clickTimeout = [];
    }

    /**
     * Adds event handlers.
     *
     * @private
     */
    function addEventHandlers() {
        $('#plainvm-machine-screenshot').click(function () {
            if (!selectedMachine.is_running) return;
            clickTimeout.push(setTimeout(function () {
                logout(function () {
                    startRemoting();
                });
            }, 400));
        });
        $('#plainvm-machine-screenshot').dblclick(function () {
            if (!selectedMachine.is_running) return;
            while (clickTimeout.length) 
                clearTimeout(clickTimeout.pop());
            logout(function () {
                window.open(getRemotingUrl());
            });
        });
        sandbox.subscribe('ui-vm-selected', function (machine) {
            selectedMachine = sandbox.getVmByUid(machine);
        });
    }

    /**
     * Logouts from Guacamole
     *
     * @private
     * @param {function} callback A callback to be invoked after the logout is proceed
     */
    function logout(callback) {
        var iframe = $('<iframe/>');
        iframe.css('visibility', 'hidden');
        $(document.body).append(iframe);
        iframe.load(function () {
            if (typeof callback === 'function') {
                callback();
            }
        });
        iframe.attr('src', getLogoutUrl());
    }

    /**
     * Starting the remoting for the selected virtual machine.
     *
     * @private
     */
    function startRemoting() {
        if (selectedMachine && selectedMachine.is_running) {
            var dialogObject = $(Mustache.to_html(template, getTemplateObject(selectedMachine)));
            $(document.body).append(dialogObject);
            dialogObject.jqxWindow({ 
                width: 810, 
                height: 640, 
                maxWidth: 900, 
                maxHeight: 700, 
                autoOpen: false, 
                isModal: true,
                animationType: 'fade',
                showAnimationDuration: 1000,
                hideAnimationDuration: 500,
                modalOpacity: 0.9,
                resizable: false,
                draggable: false
            });
            dialogObject.jqxWindow('open');
            dialogObject.find('iframe').focus();
            dialogObject.bind('closed', function () {
                var frame = dialogObject.find('iframe');
                dialogObject.remove();
            });
        }
    }

    /**
     * Gets the object which will populate the template
     *
     * @param {object} machine The virtual machine which should be controlled
     * @return {object} An object which can populate the template
     */
    function getTemplateObject(machine) {
        var result = {};
        $.extend(result, machine);
        result.remotingUrl = getRemotingUrl();
        return result;
    }

    /**
     * Gets the URL of the logout
     *
     * @private
     * @return {string} The url of Guacamole's logout page
     */
    function getLogoutUrl() {
        return 'http://' + selectedMachine.endpoint + ':' + sandbox.getRemotingPort() + '/guacamole/logout';
    }

    /**
     * Gets the remoting URL
     *
     * @private
     * @return {string} The url of Guacamole's index page
     */
    function getRemotingUrl() {
        return 'http://' + selectedMachine.endpoint + ':' + sandbox.getRemotingPort() + 
                '/guacamole/index.xhtml?autologin=1&username=' + selectedMachine.id;
    }

    return {
        init: init
    };
}()));

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
        sandbox.subscribe('machine-edited', function (machine) {
            publishCommand('machine-edited', machine);
        });
        sandbox.subscribe('change-vm-state', function (data) {
            publishCommand('change-vm-state', data);
        });
        sandbox.subscribe('system-response-received', function (data) {
            sandbox.publish(data.type, data.data);
        });
    }

    /**
     * Publising specific command. In the beginning of the method
     * the specified command is also being validated.
     *
     * @private
     * @param {string} type The type of the command
     * @param {object} data The data which will be send.
     */
    function publishCommand(type, data) {
        var command = {};
        command.type = type;
        if (data) {
            command.data = data;
        }
        sandbox.publish('system-send-command', JSON.stringify(command));
    }

    return {
        init: init
    };

}()));

/**
 * Shows different chart statistics of the machines.
 */
plainvm.register('ui.vm-statistics', (function () {

    var container,
        CHART_SIZE_RATIO = 0.305,
        DONUT_INNER_RADIUS_RATIO = 0.03,
        DONUT_RADIUS_RATIO = 0.1,
        charts = [],
        sandbox;

    /**
     * Initializing the module.
     *
     * @public
     * @param {object} sndbx The sandbox.
     */
    function init(sndbx) {
        sandbox = sndbx;
        sandbox.subscribe('system-loading-completed', function () {
            container = $('#plainvm-vm-statistics');
        });
        sandbox.subscribe('ui-statistics-opened', function () {
            destroyCharts();
            initCharts();
        });
    }

    /**
     * Initializes all charts and keeps references for their parent DOM objects.
     *
     * @private
     */
    function initCharts() {
        charts.push(initOSChart());
        charts.push(initRAMChart());
        charts.push(initVRAMChart());
    }

    /**
     * Initializes the chat which is illustrating the operating system usage.
     * Currently it's putting the OSs in two groups - linux, win.
     *
     * @private
     * @return {object} the jQuery DOM object which is the actual chart.
     */
    function initOSChart() {
        var vms = sandbox.getVms(),
            osChart = $('<div class="plainvm-chart" style="float: right;" id="plainvm-os-chart"></div>');
        osChart.width(container.width() * CHART_SIZE_RATIO);
        osChart.height(container.width() * CHART_SIZE_RATIO);
        osChart.appendTo(container);
        osChart.jqxChart({
            title: 'Operating systems',
            enableAnimations: true,
            showLegend: true,
            source: getOSSource(vms),
            colorScheme: 'scheme05',
            seriesGroups: [{
                type: 'pie',
                showLabels: false,
                series: [{
                        dataField: 'count',
                        displayText: 'os',
                        initialAngle: 15,
                        radius: container.width() * DONUT_RADIUS_RATIO,
                        centerOffset: 0
                }]
            }]
        });
        return osChart;
    }

    /**
     * Initializes the RAM chart. This shows the RAM usage by the different machines.
     *
     * @private
     * @return {object} the jQuery DOM object which is the actual chart.
     */
   function initRAMChart() {
        var vms = sandbox.getVms(),
            ramChart = $('<div class="plainvm-chart" style="float: right;" id="plainvm-ram-chart"></div>'),
            source = getRAMSource(vms),
            max = 0;
        for (var i = 0; i < source.length; i += 1) {
            if (max < source[i].ram) {
                max = source[i].ram;
            }
        }
        ramChart.width(container.width() * CHART_SIZE_RATIO);
        ramChart.height(container.width() * CHART_SIZE_RATIO);
        ramChart.appendTo(container);
        ramChart.jqxChart({
            title: 'RAM usage',
            enableAnimations: true,
            showLegend: true,
            source: source,
            colorScheme: 'scheme05',
            categoryAxis: {
                dataField: 'name',
                showGridLines: true,
                flip: false
            },
            seriesGroups: [{
                type: 'column',
                orientation: 'horizontal',
                valueAxis: {
                    flip: true,
                    unitInterval: Math.round(max / 10),
                    maxValue: max,
                    displayValueAxis: true,
                    description: ''
                },
                series: [{
                    dataField: 'ram',
                    displayText: 'RAM usage',
                    formatFunction: function (val) {
                        return val + ' MB';
                    }
                }]
            }]
        });
        return ramChart;
    }


    /**
     * Chart which shows the video RAM usage by machine.
     *
     * @private
     * @return {object} the jQuery DOM object which is the actual chart.
     */
   function initVRAMChart() {
        var vms = sandbox.getVms(),
            vramChart = $('<div class="plainvm-chart" style="float: right;" id="plainvm-vram-chart"></div>'),
            source = getVRAMSource(vms),
            max = 0;
        for (var i = 0; i < source.length; i += 1) {
            if (max < source[i].vram) {
                max = source[i].vram;
            }
        }
        vramChart.width(container.width() * CHART_SIZE_RATIO);
        vramChart.height(container.width() * CHART_SIZE_RATIO);
        vramChart.appendTo(container);
        vramChart.jqxChart({
            title: 'Video memory',
            enableAnimations: true,
            showLegend: true,
            source: source,
            colorScheme: 'scheme05',
            categoryAxis: {
                dataField: 'name',
                showGridLines: true,
                flip: false
            },
            seriesGroups: [{
                type: 'column',
                orientation: 'horizontal',
                valueAxis: {
                    flip: true,
                    unitInterval: Math.round(max / 5),
                    maxValue: max,
                    displayValueAxis: true,
                    description: ''
                },
                series: [{
                    dataField: 'vram',
                    displayText: 'VRAM usage',
                    formatFunction: function (val) {
                        return val + ' MB';
                    }
                  }
                ]
            }]
        });
        return vramChart;
    }

    /**
     * Translates the VRAM usage by the different machines into format which is readable by the chart API.
     *
     * @private
     * @param {object} vms Map with all vms (key is the machine id).
     * @return {object} vms Readable result.
     */
    function getVRAMSource(vms) {
        var result = [],
            vm;
        for (var prop in vms) {
            vm = vms[prop];
            result.push({ name: vm.name, vram: parseInt(vm.vram, 10) });
        }
        return result;
    }

    /**
     * Gets the different machine types.
     *
     * @private
     * @param {object} vms Map with all vms (key is the machine id).
     * @return {object} readable result.
     */
    function getOSSource(vms) {
        var result = [],
            osCount = {},
            os,
            vm;
        for (var prop in vms) {
            vm = vms[prop];
            os = sandbox.getVMOs(vm.os);
            if (!osCount[os]) {
                osCount[os] = 1;
            } else {
                osCount[os] += 1;
            }
        }
        for (var osProp in osCount) {
            result.push({ os: osProp, count: osCount[osProp] });
        }
        return result;    
    }

    /**
     * Translates the result into readable one for the chart API.
     *
     * @private
     * @param {object} vms Actually hash with keys the machine's ids and values the vms.
     * @return {object} readable result
     */ 
    function getRAMSource(vms) {
        var result = [],
            vm;
        for (var prop in vms) {
            vm = vms[prop];
            result.push({ name: vm.name, ram: parseInt(vm.ram, 10) });
        }
        return result;
    }

    /**
     * Destroying all charts.
     * 
     * @private
     */
    function destroyCharts() {
        for (var i = 0; i < charts.length; i += 1) {
            charts[i].jqxChart('destroy');
            charts[i].remove();
        }
        charts = [];
    }

    return {
        init: init
    };
}()));

/**
 * The content of the plainvm home page. This module defines a tab control which allows switching
 * between different structures.
 */
plainvm.register('layout.main_content_structure', (function () {

    var sandbox,
        tabs;

    /**
     * Initializes the module
     *
     * @public
     * @param {object} sndbx The sandbox.
     */
    function init(sndbx) {
        sandbox = sndbx;
        $(window).load(function () {
            tabs = $('#plainvm-tabs');
            tabs.jqxTabs({ theme: sandbox.getTheme(), selectedItem: 2 });
            tabs.bind('selected', function (e) {
                switch(e.args.item) {
                    case 0:
                        sandbox.publish('ui-home-opened');
                        break;
                    case 1:
                        sandbox.publish('ui-statistics-opened');
                        break;
                    case 2:
                        sandbox.publish('ui-installation-wizard-opened');
                        break;
                    default:
                        console.log('Unknown tab section');
                        break;
                }
            });
        });
    }

    return {
        init: init
    };
}()));

/**
 * The content of the install page. This module defines a tab control which
 * is the actual installation wizard
 */
plainvm.register('layout.install_wizard', (function () {
    var OPERATING_SYSTEMS = [
            'Windows 3.1',
            'Windows 95',
            'Windows 98',
            'Windows ME',
            'Windows NT 4',
            'Windows 2000',
            'Windows XP',
            'Windows XP (64)',
            'Windows 2003',
            'Windows 2003 (64 bit)',
            'Windows Vista',
            'Windows Vista (64 bit)',
            'Windows 2008',
            'Windows 2008 (64 bit)',
            'Windows 7',
            'Windows 7 (64 bit)',
            'Windows 8',
            'Windows 8 (64 bit)',
            'Linux 2.2',
            'Linux 2.4',
            'Linux 2.4 (64 bit)',
            'Linux 2.6',
            'Linux 2.6 (64 bit)',
            'Arch Linux',
            'Arch Linux (64 bit)',
            'Debian',
            'Debian (64 bit)',
            'openSUSE',
            'openSUSE (64 bit)',
            'Fedora',
            'Fedora (64 bit)',
            'Gentoo',
            'Gentoo (64 bit)',
            'Mandriva',
            'Mandriva (64 bit)',
            'Red Hat',
            'Red Hat (64 bit)',
            'Turbolinux',
            'Turbolinux (64 bit)',
            'Ubuntu',
            'Ubuntu (64 bit)',
            'Xandros',
            'Xandros (64 bit)',
            'Oracle',
            'Oracle (64 bit)',
            'Other Linux'
        ],
        sandbox,
        tabs;

    function init(sndbx) {
        sandbox = sndbx;
        $(window).load(function () {
            tabs = $('#plainvm-vm-installation');
            tabs.jqxTabs({ 
                theme: sandbox.getTheme(), 
                width: '600',
                height: '400',
                selectedItem: 2
            });
            $('#plainvm-install-wizard-vm-os').jqxComboBox({
                theme: sandbox.getTheme(),
                source: OPERATING_SYSTEMS,
                width: 200,
                height: 25
            });
            $('#plainvm-install-wizard-first-next').jqxButton({
                theme: sandbox.getTheme(),
                width: 60,
                height: 30
            });
            $('#plainvm-install-wizard-ram-slider').jqxSlider({
                min: 50,
                max: 2048,
                value: 256,
                step: 50,
                ticksFrequency: 100,
                mode: 'fixed',
                width: 280,
                theme: sandbox.getTheme()
            });
            $('#plainvm-install-wizard-hdd-slider').jqxSlider({
                min: 2000,
                max: 50000,
                step: 500,
                value: 10000,
                ticksFrequency: 2000,
                mode: 'fixed',
                width: 280,
                theme: sandbox.getTheme()
            });
            $('#plainvm-install-wizard-second-next').jqxButton({
                theme: sandbox.getTheme(),
                width: 60,
                height: 30
            });
            $('#plainvm-install-wizard-finish').jqxButton({
                theme: sandbox.getTheme(),
                width: 60,
                height: 30
            });
        });
    }

    return {
        init: init
    };


}()));

/**
 * Initializes the right side panel of the index page. It's a docking containing the
 * vm current status picture and data about the machine parameters.
 */
plainvm.register('layout.index_side_panel_structure', (function () {

    var sandbox,
        docking;

    /**
     * Initializes the module.
     * 
     * @public
     * @param {object} sndbx The sandbox.
     */
    function init(sndbx) {
        sandbox = sndbx;
        $(window).load(function () {
            docking = $('#plainvm-info-container');
            docking.jqxDocking({ width: '100%', theme: sandbox.getTheme(), mode: 'docked'  });
            docking.jqxDocking('hideAllCloseButtons');
        });
    }

    return {
        init: init
    };

}()));


plainvm.start('ui.preloader');

$(window).load(function () {
    plainvm.start('ui.vm-statistics');
    plainvm.start('system.remote_command_bridge');
    plainvm.start('ui.vm_status_pic');
    plainvm.start('ui.vms-list');
    plainvm.start('ui.vm_control');
    plainvm.start('ui.vm_details');
    plainvm.start('ui.vm_settings');
    plainvm.start('system.connection_handler');
});

plainvm.start('layout.index_side_panel_structure');
plainvm.start('layout.main_content_structure');
plainvm.start('layout.install_wizard');
