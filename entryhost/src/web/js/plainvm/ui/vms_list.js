/**
 * Manages the list of VMs in the left side of the screen
 */
plainvm.register('ui.vms_list', (function () {

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
                params = {};
            if (isButtonDisabled(vmId, this.className)) return;
            if (type === 'menu') {
                sandbox.publish('ui-show-menu-clicked', vmId);
            } else {
                vm = sandbox.getVmByUid(vmId);
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
                sandbox.publish('system-send-frame', {
                    type: 'change-vm-state',
                    data: params
                });
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

    /**
     * Checks whether the button for the options menu
     * should be disabled. This depends on the machine state (powered on or off)
     *
     * @private
     * @param {string} id Uid of the VM
     * @param {string} className Class name of the list item
     * @return {boolean} Returns whether the button should be disabled
     */
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