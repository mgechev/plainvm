/**
 * The content of the install page. This module defines a tab control which
 * is the actual installation wizard
 */
plainvm.register('layout.install_wizard', (function () {
    var sandbox,
        tabs;

    /**
     * Renders the first section of the wizard
     *
     * @private
     */
    function renderFirstSection() {
        $('#plainvm-install-wizard-vm-os').jqxDropDownList({
            theme: sandbox.getTheme(),
            source: sandbox.getOperatingSystems(),
            valueMember: 'value',
            displayMember: 'key',
            width: 280,
            height: 25,
            selectedIndex: 0
        });
        $('#plainvm-install-wizard-first-next').jqxButton({
            theme: sandbox.getTheme(),
            width: 60,
            height: 30
        });
        $('#plainvm-install-wizard-endpoint').jqxDropDownList({
            theme: sandbox.getTheme(),
            source: [],
            width: 280,
            height: 25,
            selectedIndex: 0
        });
    }

    /**
     * Renders the second section of the wizard
     *
     * @private
     */
    function renderSecondSection() {
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
        $('#plainvm-install-wizard-second-back').jqxButton({
            theme: sandbox.getTheme(),
            width: 60,
            height: 30
        });
    }

    /**
     * Renders the third section of the wizard
     *
     * @private
     */
    function renderThirdSection() {
        $('#plainvm-install-wizard-finish').jqxButton({
            theme: sandbox.getTheme(),
            width: 60,
            height: 30
        });
        $('#plainvm-install-wizard-third-back').jqxButton({
            theme: sandbox.getTheme(),
            width: 60,
            height: 30
        });
        $('#plainvm-install-wizard-progress').jqxProgressBar({
            height: 25,
            width: 280,
            min: 0,
            max: 100,
            value: 0,
            animationDuration: 0,
            theme: sandbox.getTheme()
        });
    }

    /**
     * Renders the wizard
     *
     * @public
     * @param {object} sndbx The sandbox.
     */
    function init(sndbx) {
        sandbox = sndbx;
        $(window).load(function () {
            tabs = $('#plainvm-vm-installation');
            tabs.jqxTabs({
                keyboardNavigation: false,
                theme: sandbox.getTheme(),
                width: '600',
                height: '400',
                enabledHover: false,
                disabled: true
            });
            //Because the event bubbles and is caught by the parent tab
            tabs.bind('selected', function (e) {
                if (e.args.item === 1) {
                    var ramSlider = $('#plainvm-install-wizard-ram-slider'),
                        hddSlider = $('#plainvm-install-wizard-hdd-slider');
                    ramSlider.jqxSlider('value', ramSlider.jqxSlider('value'));
                    hddSlider.jqxSlider('value', hddSlider.jqxSlider('value'));
                }
                return false;
            });
            renderFirstSection();
            renderSecondSection();
            renderThirdSection();
        });
        sandbox.subscribe('ui-startup-init', function () {
            $('#plainvm-install-wizard-endpoint').jqxDropDownList('source', sandbox.getEndPoints());
        });
    }

    return {
        init: init
    };


}()));