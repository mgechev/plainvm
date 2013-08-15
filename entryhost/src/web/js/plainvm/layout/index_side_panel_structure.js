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
