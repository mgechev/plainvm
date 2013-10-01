/**
 * Shows the current status of the virtual machine
 */
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


