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

use Data::Dumper;

use JSON;

use threads;
use threads::shared;

use Common::Common;
use Common::Config;

use Thread::Semaphore;

#This class is the Entry host.
#It manages the end points via EndPointConnectionHandler and the clients
#using the ClientHandler.
package EntryHost;

my $uid;
my %responses;
use constant MAX_UID => 100000000;

sub new {
    my ($class) = @_;
    my $self = {
        _server => undef,
        _port => undef,
        _client_response => {}
    };
    bless($self, $class);
    $uid = 0;
    %responses = ();
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
#The method checks whether the request will wait for response (if the needResponse
#flag is set) if so we generate unique id for the request and put it into a hash
sub send_command($ $ $) {
    my ($self, $command, $client) = @_;
    eval {
        my $parsed_command = JSON::from_json($command);
        my $unique_id = $self->_get_uid();
        if (defined $parsed_command->{'needResponse'}) {
            $responses{$unique_id} = {
                timeout => 0,
                client => $client
            };
            $parsed_command->{uid} = $unique_id;
        }
        $self->{_ep_handler}->push_command($parsed_command->{data}{endpoint},
                JSON::to_json($parsed_command));
    };
    if ($@) {
        Common::error("Error while parsing the command: $@");
    }
}

sub _get_uid($) {
    if ($uid >= MAX_UID) {
        $uid = 0;
    }
    return $uid++;
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

#Checks for updates and responses
sub _start_endpoint_data_check($ $ $) {
    my ($self, $ep_handler, $client_handler) = @_;
    return AnyEvent->timer(after => 0, interval => Config::get_option('poll_interval'), cb => sub {
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
        $self->_handle_responses($ep_handler->get_responses);
    });
}

#This method is called when a response handling is required
#It loop over all responses by the end points and sends them to the client
sub _handle_responses($ $) {
    my ($self, $ep_resp) = @_;
    my @ep_resp = @$ep_resp;
    my $parsed;
    for (@ep_resp) {
        eval {
            $parsed = JSON::from_json($_);
            if (defined $responses{$parsed->{uid}}) {
                $self->_send_client_message($responses{$parsed->{uid}}->{client}, {
                    type => $parsed->{type},
                    data => $parsed->{data}
                });
                delete $responses{$parsed->{uid}};
            } else {
                Common::warn('No response waiting for ' . $parsed->{uid});
            }
        };
        if ($@) {
            Common::error('Error while handling the responses ' . $@);
        }
    }
    $self->_update_responses_timeout;
}

#This method updates the timeout of all waiting responses
#If the timeout is greater then RESPONSE_TIMEOUT in the configuration
#the response is dropped and an error message is returned to the client
sub _update_responses_timeout($) {
    my $self = shift;
    my $timeout;
    for my $key (keys %responses) {
        $timeout = $responses{$key}->{timeout};
        if ($timeout > Config::get_option('response_timeout')) {
            $self->_send_client_message($responses{$key}->{client}, {
                type => 'error-response',
                data => 'No response by the end point'
            });
            delete $responses{$key};
        } else {
            $responses{$key}->{timeout} = $timeout + 1;
        }
    }
}

sub _send_client_message($ $ $) {
    my ($self, $client, $message) = @_;
    $self->{_client_handler}->send_frame($client, JSON::to_json($message));
}

#Translates the data which comes from the EndPointConnectionHandler
#to one which is readable by the clients
sub _prepare_client_response($ $ $) {
    my ($self, $hash, $type) = @_;
    my $eps_vms = [];
    my $result = {};
    for my $ep (keys(%$hash)) {
        my @vms = ();
        my $ep_vms;
        eval {
            $ep_vms = JSON::from_json($hash->{$ep});
        };
        if ($@) {
            Common::error('Error while parsing the virtual machines provided by the end point');
            return;
        }
        for my $vm_id (keys(%$ep_vms)) {
            push(@vms, $ep_vms->{$vm_id});
        }
        push(@$eps_vms, { host => $ep, vms => \@vms });
    }
    $result = {
        type => $type,
        data => $eps_vms
    };
    return JSON::to_json($result);
}

1;