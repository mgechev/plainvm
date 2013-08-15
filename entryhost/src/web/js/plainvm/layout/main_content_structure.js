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
            tabs.jqxTabs({ keyboardNavigation: false, theme: sandbox.getTheme() });
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

