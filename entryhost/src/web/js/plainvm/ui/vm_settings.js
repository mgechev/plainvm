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
                    input: '#machine-name', 
                    message: 'Invalid name', 
                    action: 'keyup, keydown', 
                    rule: function (input) {
                        return (/^[a-zA-Z]{2,}[\sa-zA-Z0-9._\-]{1,}$/).test(input.val());
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
            decimal: parseInt(currentVm.remote_port, 10) || 0,
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
        $('#remoting-checkbox').jqxCheckBox({
            checked: !!currentVm.remoting_enabled,
            theme: theme
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
        currentVm.remote_port = parseInt($('#port-input').jqxNumberInput('decimal'), 10);
        currentVm.remote_address = sandbox.getVmByUid(currentVm.uid).endpoint;
        currentVm.remoting_enabled = $('#remoting-checkbox').jqxCheckBox('checked');
        currentVm.name = $('#machine-name').val();
        currentVm.vram = $('#video-slider').jqxSlider('value');
        sandbox.publish('ui-update-vms', [currentVm]);
        sandbox.publish('system-send-frame', {
            type: 'machine-edited', 
            data: currentVm
        });
    }

    return {
        init: init
    };
}()));
