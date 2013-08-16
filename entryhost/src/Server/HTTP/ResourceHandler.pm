#!/usr/bin/perl

use strict;
use warnings;

#Manages all resources which are accessible through the HTTP server
package ResourceHandler;

#Contains all resources which are allowed to the clients
my %_resources = (
    'index.htm' => 'text/html',
    'css/images/header.gif' => 'image/gif',
    'css/images/windows-icon.png' => 'image/png',
    'css/images/linux-icon.png' => 'image/png',
    'css/images/mac-icon.png' => 'image/png',
    'css/images/subheader.png' => 'image/png',
    'css/images/check_black.png' => 'image/png',

    'js/libs/jqxcore.js' => 'application/x-javascript',
    'js/libs/jqxdropdownlist.js' => 'application/x-javascript',
    'js/libs/jqxprogressbar.js' => 'application/x-javascript',
    'js/libs/jqxcheckbox.js' => 'application/x-javascript',
    'js/libs/jqxwindow.js' => 'application/x-javascript',
    'js/libs/jqxdocking.js' => 'application/x-javascript',
    'js/libs/jqxtooltip.js' => 'application/x-javascript',
    'js/libs/jqxlistbox.js' => 'application/x-javascript',
    'js/libs/jqxscrollbar.js' => 'application/x-javascript',
    'js/libs/jqxcombobox.js' => 'application/x-javascript',
    'js/libs/jqxslider.js' => 'application/x-javascript',
    'js/libs/jqxbuttons.js' => 'application/x-javascript',
    'js/libs/jqxnumberinput.js' => 'application/x-javascript',
    'js/libs/jquery-1.8.2.min.js' => 'application/x-javascript',
    'js/libs/mustache.js' => 'application/x-javascript',
    'js/libs/jqxvalidator.js' => 'application/x-javascript',
    'js/libs/jqxtabs.js' => 'application/x-javascript',
    'js/libs/jqxchart.js' => 'application/x-javascript',
    'js/libs/jqxdata.js' => 'application/x-javascript',

    'js/build/libs.js' => 'application/x-javascript',
    'js/build/plainvm.js' => 'application/x-javascript',

    'js/plainvm/core.js' => 'application/javascript',
    'js/plainvm/ui/preloader.js' => 'application/javascript',
    'js/plainvm/system/connection_handler.js' => 'application/javascript',
    'js/plainvm/ui/vms_list.js' => 'application/javascript',
    'js/plainvm/ui/vm_details.js' => 'application/javascript',
    'js/plainvm/ui/vm_status_pic.js' => 'application/javascript',
    'js/plainvm/ui/vm_settings.js' => 'application/javascript',
    'js/plainvm/ui/vm_control.js' => 'application/javascript',
    'js/plainvm/system/remote_command_bridge.js' => 'application/javascript',
    'js/plainvm/ui/vm_statistics.js' => 'application/javascript',
    'js/plainvm/layout/main_content_structure.js' => 'application/javascript',
    'js/plainvm/layout/install_wizard.js' => 'application/javascript',
    'js/plainvm/ui/install_wizard.js' => 'application/javascript',
    'js/plainvm/layout/index_side_panel_structure.js' => 'application/javascript',
    'js/plainvm/system/install_vm.js' => 'application/javascript',
    'js/plainvm/init.js' => 'application/javascript',
        
    'css/jqx.base.css' => 'text/css',
    'css/jqx.fresh.css' => 'text/css',
    'css/styles.css' => 'text/css',
    'css/images/close.png' => 'image/png',,
    'css/images/icon-up.png' => 'image/png',
    'css/images/icon-down.png' => 'image/png',
    'css/images/icon-up-white.png' => 'image/png',
    'css/images/icon-down-white.png' => 'image/png',
    'css/images/not-running.png' => 'image/png',

    'css/images/404.jpg' => 'image/jpg',
    'css/images/plainvm-logo.png' => 'image/png',
    'css/images/startvm.png' => 'image/png',
    'css/images/poweroffvm.png' => 'image/png',
    'css/images/shutdownvm.png' => 'image/png',
    'css/images/menuvm.png' => 'image/png',
    'css/images/icon-right.png' => 'image/png',
    'css/images/icon-left.png' => 'image/png',
    'css/images/multi-arrow.gif' => 'image/gif',
    'css/images/icon-left-white.png' => 'image/png',
    'css/images/icon-right-white.png' => 'image/png',

    'css/images/favicon.ico' => 'image/png'
);

my $_notfound = 'notfound.htm';
my $_server_error = 'notfound.htm';
my $_prefix_dir = 'web/';

sub _prepare_resource($) {
    my $resource = shift;
    return 'index.htm' if $resource eq '/';
    return substr($resource, 1, length($resource) - 1) if defined($resource);
}

sub get_resource($) {
    my $file = shift;
    my $file_content = '';
    $file = _prepare_resource($file);
    if (!$_resources{$file}) {
        return undef;
    }
    $file = $_prefix_dir . $file;
    if (open(FH, '<', $file)) {
        while (<FH>) {
            $file_content .= $_;
        }
        close(FH);
        return $file_content;
    }
    return undef;
}

sub get_mime_type($) {
    my $file = shift;
    $file = _prepare_resource($file);
    my $type = $_resources{$file};
    return $type;
}

sub get_server_error {
    my $content = '';
    open FH, '<' . $_server_error;
    while (<FH>) {
        $content .= $_;
    }
    return $content;
}

sub get_not_found {
    my $content = '';
    my $file = $_prefix_dir . $_notfound;
    open(FH, '<' . $file);
    while (<FH>) {
        $content .= $_;
    }
    return $content;
}

1;
