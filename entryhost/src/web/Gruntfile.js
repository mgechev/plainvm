module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.initConfig({
        uglify: {
            build: {
                files: {
                    './js/plainvm.js': [
                                'js/plainvm/core.js',
                                'js/plainvm/ui/preloader.js',
                                'js/plainvm/system/connection_handler.js',
                                'js/plainvm/ui/vms_list.js',
                                'js/plainvm/ui/vm_details.js',
                                'js/plainvm/ui/vm_status_pic.js',
                                'js/plainvm/ui/vm_settings.js',
                                'js/plainvm/ui/vm_control.js',
                                'js/plainvm/system/remote_command_bridge.js',
                                'js/plainvm/ui/vm_statistics.js',
                                'js/plainvm/layout/main_content_structure.js',
                                'js/plainvm/layout/install_wizard.js',
                                'js/plainvm/ui/install_wizard.js',
                                'js/plainvm/layout/index_side_panel_structure.js',
                                'js/plainvm/system/install_vm.js',
                                'js/plainvm/init.js'],
                    './js/libs.js': [
                                'js/libs/jqxcore.js',
                                'js/libs/jqxdata.js',
                                'js/libs/jqxbuttons.js',
                                'js/libs/jqxscrollbar.js',
                                'js/libs/jqxlistbox.js',
                                'js/libs/jqxcombobox.js',
                                'js/libs/jqxdropdownlist.js',
                                'js/libs/jqxwindow.js',
                                'js/libs/jqxdocking.js',
                                'js/libs/jqxtooltip.js',
                                'js/libs/jqxslider.js',
                                'js/libs/jqxprogressbar.js',
                                'js/libs/jqxnumberinput.js',
                                'js/libs/jqxvalidator.js',
                                'js/libs/jqxtabs.js',
                                'js/libs/jqxchart.js',
                                'js/libs/jqxcheckbox.js',
                                'js/libs/mustache.js']
                }
            }
        }
    });

    grunt.registerTask('default', ['uglify']);

};
