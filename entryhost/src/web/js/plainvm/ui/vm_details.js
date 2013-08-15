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
