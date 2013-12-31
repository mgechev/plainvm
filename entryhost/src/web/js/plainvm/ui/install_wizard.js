/**
 * Initializes the install wizard
 */
plainvm.register('ui.install_wizard', (function () {

    var tabs,
        firstForm,
        sandbox;

    /**
     * Adds UI handlers to the wizard
     *
     * @public
     * @param {object} sndbx The sandbox.
     */
    function init(sndbx) {
        sandbox = sndbx;
        tabs = $('#plainvm-vm-installation');
        selectItem(0);
        sandbox.subscribe('system-loading-completed', function () {
            firstSectionHandlers();
            secondSectionHandlers();
            thirdSectionHandlers();
        });
        sandbox.subscribe('system-install-finished', function () {
            var finishButton = $('#plainvm-install-wizard-finish');
            finishButton.jqxButton('disabled', false);
            finishButton.text('Reset');
            finishButton.bind('click', resetWizard);
            finishButton.unbind('click', finishInstallation);
        });
        sandbox.subscribe('system-install-info', function (t) {
            $('#plainvm-install-wizard-info').text(t);
        });
        tabs.bind('selected', function () {
            $('#plainvm-vm-install-wizard-section-1').jqxValidator('hide');
            $('#plainvm-vm-install-wizard-section-2').jqxValidator('hide');
            $('#plainvm-vm-install-wizard-section-3').jqxValidator('hide');
        });
    }

    /**
     * Resets the installation wizard
     *
     * @private
     */
    function resetWizard() {
        var finishButton = $('#plainvm-install-wizard-finish');
        tabs.jqxTabs('enableAt', 0);
        tabs.jqxTabs('disableAt', 2);
        tabs.jqxTabs('selectedItem', 0);
        tabs.find('input').val('');
        $('#plainvm-install-wizard-ram-slider').jqxSlider('value', 256);
        $('#plainvm-install-wizard-hdd-slider').jqxSlider('value', 10000);
        $('#plainvm-install-wizard-progress').jqxProgressBar('value', 0);
        $('#plainvm-install-wizard-info').text('');
        finishButton.text('Create');
        finishButton.unbind('click', resetWizard);
        finishButton.bind('click', finishInstallation);
    }

    /**
     * Adds validation logic for the first section of the wizard
     *
     * @private
     */
    function firstSectionHandlers() {
        var sectionOne = $('#plainvm-vm-install-wizard-section-1').jqxValidator();
        sectionOne.jqxValidator({
            rules: [
                {
                    input: '#plainvm-install-wizard-vm-name',
                    message: 'Invalid name.',
                    action: 'keyup,blur',
                    rule: function (input) {
                        return (/^[a-zA-Z]{2,}[\sa-zA-Z0-9._\-]{1,}$/).test(input.val());
                    }
                }
            ]
        });
        $('#plainvm-install-wizard-first-next').bind('click', function () {
            if (sectionOne.jqxValidator('validate')) {
                sandbox.publish('ui-install-wizard-first-section', {
                    name: $('#plainvm-install-wizard-vm-name').val(),
                    os: $('#plainvm-install-wizard-vm-os').jqxDropDownList('getSelectedItem').value,
                    endpoint: $('#plainvm-install-wizard-endpoint').jqxDropDownList('getSelectedItem').value
                });
                selectItem(1);
            }
        });
    }

    /**
     * Adds event handlers to the second section of the wizard
     *
     * @private
     */
    function secondSectionHandlers() {
        var sectionTwo = $('#plainvm-vm-install-wizard-section-2').jqxValidator();
        sectionTwo.jqxValidator({
            rules: [{
                input: '#plainvm-install-wizard-file',
                message: 'The ISO file is required',
                rule: function (input) {
                    return !!input.val().length;
                }
            }]
        });
        $('#plainvm-install-wizard-second-next').bind('click', function () {
            if (sectionTwo.jqxValidator('validate')) {
                sandbox.publish('ui-install-wizard-second-section', {
                    ram : $('#plainvm-install-wizard-ram-slider').jqxSlider('value'),
                    hdds: $('#plainvm-install-wizard-hdd-slider').jqxSlider('value'),
                    file: document.getElementById('plainvm-install-wizard-file').files[0]
                });
                selectItem(2);
            }
        });
        $('#plainvm-install-wizard-second-back').bind('click', function () {
            selectItem(0);
        });
    }

    /**
     * Adds event handler to the third section of the wizard
     *
     * @private
     */
    function thirdSectionHandlers() {
        var progressBar = $('#plainvm-install-wizard-progress');
        $('#plainvm-install-wizard-finish').bind('click', finishInstallation);
        $('#plainvm-install-wizard-third-back').bind('click', function () {
            selectItem(1);
        });
        sandbox.subscribe('system-vm-install-progress', function (p) {
            progressBar.jqxProgressBar('value', p);
        });
    }

    /**
     * Handler of the button which triggers an installation start
     *
     * @private
     */
    function finishInstallation() {
        $('#plainvm-install-wizard-finish').jqxButton('disabled', true);
        $('#plainvm-install-wizard-third-back').jqxButton('disabled', true);
        sandbox.publish('ui-install-wizard-finish-section');
    }

    /**
     * Selects specific tab item
     *
     * @private
     * @param {number} idx Index which indicates the tab item which should be selected
     */
    function selectItem(idx) {
        tabs.jqxTabs('disabled', true);
        tabs.jqxTabs('enableAt', idx);
        tabs.jqxTabs('selectedItem', idx);
    }

    return {
        init: init
    };
}()));
