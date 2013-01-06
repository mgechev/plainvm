#!/usr/bin/perl

use strict;
use warnings;
use Server::ConnectionHandler;
use Controller::ClientHandler;
use Model::VMManager;
use Common::Config;

MAIN: {

    print "\033[92m       _       _                      \n";
    print " _ __ | | __ _(_)_ ____   ___ __ ___  \n";
    print "| '_ \\| |/ _` | | '_ \\ \\ / / '_ ` _ \\ \n";
    print "| |_) | | (_| | | | | \\ V /| | | | | |\n";
    print "| .__/|_|\\__,_|_|_| |_|\\_/ |_| |_| |_|\n";
    print "|_|                                   \033[0m";
    print " \033[93m EndPoint \033[0m1.0\n\n";

    Config::load_config();

    my $vm_manager = new VMManager();
    $vm_manager->load_vms();

    my $client_handler = ClientHandler->instance($vm_manager);

    my $connection_handler = new ConnectionHandler();
    $connection_handler->listen(Config::get_option('port'), Config::get_option('address'));

}
