plainvm.start('ui.preloader');

$(window).load(function () {
    plainvm.start('ui.vm_statistics');
    plainvm.start('system.remote_command_bridge');
    plainvm.start('ui.vm_status_pic');
    plainvm.start('ui.vms_list');
    plainvm.start('ui.vm_control');
    plainvm.start('ui.vm_details');
    plainvm.start('ui.vm_settings');
    plainvm.start('ui.install_wizard');
    plainvm.start('system.connection_handler');
    plainvm.start('system.install_vm');
});

plainvm.start('layout.index_side_panel_structure');
plainvm.start('layout.main_content_structure');
plainvm.start('layout.install_wizard');
