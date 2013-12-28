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
        endpoints = [],
        firstConnectionEstablished = false,
        VM_SERVER = "localhost{{port}}",//window.location.hostname,
        VM_SERVER_PORT = 5001,//parseInt(window.location.port, 10),
        REMOTING_PORT = 8080,
        currentTheme = 'fresh',
        OPERATING_SYSTEMS = [
            {
                'key': 'Windows 3.1',
                'value': 'Windows31'
            },
            {
                'key': 'Windows 95',
                'value': 'Windows95'
            },
            {
                'key': 'Windows 98',
                'value': 'Windows98'
            },
            {
                'key': 'Windows ME',
                'value': 'WindowsME'
            },
            {
                'key': 'Windows NT 4',
                'value': 'WindowsNT4'
            },
            {
                'key': 'Windows 2000',
                'value': 'Windows2000'
            },
            {
                'key': 'Windows XP',
                'value': 'WindowsXP'
            },
            {
                'key': 'Windows XP (64)',
                'value': 'WindowsXP_64'
            },
            {
                'key': 'Windows 2003',
                'value': 'Windows2003'
            },
            {
                'key': 'Windows 2003 (64 bit)',
                'value': 'Windows2003_64'
            },
            {
                'key': 'Windows Vista',
                'value': 'WindowsVista'
            },
            {
                'key': 'Windows Vista (64 bit)',
                'value': 'WindowsVista_64'
            },
            {
                'key': 'Windows 2008',
                'value': 'Windows2008'
            },
            {
                'key': 'Windows 2008 (64 bit)',
                'value': 'Windows2008_64'
            },
            {
                'key': 'Windows 7',
                'value': 'Windows7'
            },
            {
                'key': 'Windows 7 (64 bit)',
                'value': 'Windows7_64'
            },
            {
                'key': 'Windows 8',
                'value': 'Windows8'
            },
            {
                'key': 'Windows 8 (64 bit)',
                'value': 'Windows8_64'
            },
            {
                'key': 'Linux 2.2',
                'value': 'Linux22'
            },
            {
                'key': 'Linux 2.4',
                'value': 'Linux24'
            },
            {
                'key': 'Linux 2.4 (64 bit)',
                'value': 'Linux24_64'
            },
            {
                'key': 'Linux 2.6',
                'value': 'Linux26'
            },
            {
                'key': 'Linux 2.6 (64 bit)',
                'value': 'Linux26_64'
            },
            {
                'key': 'Arch Linux',
                'value': 'ArchLinux'
            },
            {
                'key': 'Arch Linux (64 bit)',
                'value': 'ArchLinux_64'
            },
            {
                'key': 'Debian',
                'value': 'Debian'
            },
            {
                'key': 'Debian (64 bit)',
                'value': 'Debian_64'
            },
            {
                'key': 'openSUSE',
                'value': 'OpenSUSE'
            },
            {
                'key': 'openSUSE (64 bit)',
                'value': 'OpenSUSE_64'
            },
            {
                'key': 'Fedora',
                'value': 'Fedora'
            },
            {
                'key': 'Fedora (64 bit)',
                'value': 'Fedora_64'
            },
            {
                'key': 'Gentoo',
                'value': 'Gentoo'
            },
            {
                'key': 'Gentoo (64 bit)',
                'value': 'Gentoo_64'
            },
            {
                'key': 'Mandriva',
                'value': 'Mandriva'
            },
            {
                'key': 'Mandriva (64 bit)',
                'value': 'Mandriva_64'
            },
            {
                'key': 'Red Hat',
                'value': 'RedHat'
            },
            {
                'key': 'Red Hat (64 bit)',
                'value': 'RedHat_64'
            },
            {
                'key': 'Turbolinux',
                'value': 'Turbolinux'
            },
            {
                'key': 'Turbolinux (64 bit)',
                'value': 'Turbolinux_64'
            },
            {
                'key': 'Ubuntu',
                'value': 'Ubuntu'
            },
            {
                'key': 'Ubuntu (64 bit)',
                'value': 'Ubuntu_64'
            },
            {
                'key': 'Xandros',
                'value': 'Xandros'
            },
            {
                'key': 'Xandros (64 bit)',
                'value': 'Xandros_64'
            },
            {
                'key': 'Oracle',
                'value': 'Oracle'
            },
            {
                'key': 'Oracle (64 bit)',
                'value': 'Oracle_64'
            },
            {
                'key': 'Mac OS X',
                'value': 'MacOS'
            },
            {
                'key': 'Mac OS X (x64)',
                'value': 'MacOS'
            },
            {
                'key': 'Other Linux',
                'value': 'OtherLinux'
            }
        ];

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
     * Returns the entry host
     * 
     * @public
     * @return {string}
     */
    function getEntryHost() {
    	return VM_SERVER.replace(/\{\{\w+\}\}/, ':' + VM_SERVER_PORT);
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
     * Gets list of all end points
     *
     * @public
     * @returns {array} Array with all end points
     */
    function getEndPoints() {
        return endpoints;
    }

    /**
     * The method puts specific operating system into two (currently) groups - linux/win.
     *
     * @public
     * @param {string} name Operating system.
     * @return {string} operating system type.
     */
    function getVMOs(name) {
        if ((/(linux|ubuntu|fedora|debian|mandriva|gentoo|red\shat)/i).test(name)) {
            return 'linux';
        } else if ((/(windows)/i).test(name)) {
            return 'win';
        } else if ((/(mac)/i).test(name)) {
            return 'mac';
        } else {
            return undefined;
        }
    }

    /**
     * This method returns an array with all supported OS
     *
     * @public
     * @return {array} list of all operating systems.
     */
    function getOperatingSystems() {
        return OPERATING_SYSTEMS;
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
    sandbox.getOperatingSystems = getOperatingSystems;
    sandbox.getEndPoints = getEndPoints;
    sandbox.getEntryHost = getEntryHost;


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
                return vms;
            }
        },

        getEndPoints = function (hosts) {
            var ep = [];
            for (var i = 0; i < hosts.length; i += 1)
                ep.push(hosts[i][0]);
            return ep;
        };

        pubSub.subscribe('system-startup-init', function (hosts) {
            vms = parseHosts(hosts);
            endpoints = getEndPoints(hosts);
            if (!firstConnectionEstablished) {
                pubSub.publish('ui-startup-init', getVmsArray(vms));
            }
            firstConnectionEstablished = true;
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
