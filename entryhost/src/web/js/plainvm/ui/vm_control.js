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
                window.open(getRemotingUrl(), 'fullscreen=yes');
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
           $(iframe).remove();
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


