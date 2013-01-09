#!/usr/bin/perl

use strict;
use warnings;
use utf8;

use threads;

use AnyEvent::Socket;
use AnyEvent::Handle;

use Server::EndPointConnectionHandler;

use Server::ClientHandler;
use Server::ClientObserver;

use JSON;

use threads;
use threads::shared;

use Common::Common;
use Common::Config;

#This class is the Entry host.
#It manages the end points via EndPointConnectionHandler and the clients
#using the ClientHandler.
package EntryHost;

sub new {
    my ($class) = @_;
    my $self = {
        _server => undef,
        _port => undef,
    };
    bless($self, $class);
    return $self;
}

#Sends update message to the clients with all changed virtual machines
sub update_clients($ $) {
    my ($self, $current_vms) = @_;
    my $response = $self->_prepare_client_response($current_vms, 'system-update');
    $self->{_client_handler}->update_clients($response);
}

#Sends command to any end point.
#Actually the command is not explicitly send, it's being pushed into a
#queue and send when the EndPointConnectionHandler is ready.
sub send_command($ $ $) {
    my ($self, $command) = @_;
    eval {
        my $parsed_command = JSON::from_json($command);
        $self->{_ep_handler}->push_command($parsed_command->{data}{endpoint}, $command);
    };
    if ($@) {
        Common::error("Error while parsing the command: $@");
    }
}

#Gets all VMs for startup initialization of a client.
sub get_vms($) {
    my $self = shift;
    my $vms = $self->{_ep_handler}->get_vms;
    return $self->_prepare_client_response($vms, 'system-startup-init');
}

#Gets the screenshots for all VMs.
sub get_screenshots($) {
    my $self = shift;
    my $screenshots = $self->{_ep_handler}->get_screenshots;
    return $self->_prepare_client_response($screenshots, 'system-screenshot-update');
}

#Starts the EntryHost.
sub start($ $) {
    my $self = shift;
    my $timer;
    threads->new(sub {
        my $client_handler = ClientHandler->new(ClientObserver->new($self));
        $self->{_client_handler} = $client_handler;
  
        my $ep_handler = EndPointConnectionHandler->new(Config::get_endpoints);
        $ep_handler->connect_to_endpoints;
        $self->{_ep_handler} = $ep_handler;
   
        my $timer = $self->_start_endpoint_data_check($ep_handler, $client_handler);
        $client_handler->listen(Config::get_option('http_port'), Config::get_option('address'));

    })->join;
}

sub _start_endpoint_data_check($ $ $) {
    my ($self, $ep_handler, $client_handler) = @_;
    return AnyEvent->timer(after => 0, interval => 1, cb => sub {
        if ($ep_handler->is_dirty) {
            my $res = $ep_handler->get_dirty;
            $res = $self->_prepare_client_response($res, 'system-update');
            $client_handler->update_clients($res);
        }
        if ($ep_handler->is_screenshot_dirty) {
            my $res = $ep_handler->get_dirty_screenshots;
            $res = $self->_prepare_client_response($res, 'system-screenshot-update');
            $client_handler->update_clients($res);
        }
    });
}

#Translates the data which comes from the EndPointConnectionHandler
#to one which is readable by the clients
sub _prepare_client_response($ $ $) {
    my ($self, $hash, $type) = @_;
    my $eps_vms = [];
    my $result = {};
    for my $ep (keys(%$hash)) {
        my @vms = ();
        my $ep_vms = JSON::from_json($hash->{$ep});
        for my $vm_id (keys(%$ep_vms)) {
            push(@vms, $ep_vms->{$vm_id});
        }
        push(@$eps_vms, [$ep, \@vms]);
    }
    $result = {
        type => $type,
        data => $eps_vms
    };
    return JSON::to_json($result);
}

1;
