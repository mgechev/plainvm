#!/usr/bin/perl

use strict;
use warnings;

use Mediator::PublishSubscribe;
use Controller::VMStatusVerifier;

#Manages the clients (in this case the EntryHosts)
package ClientHandler;

#Keeps a reference to the instance (this class is a Singleton)
my $INSTANCE = undef;

#Gets the instance
sub instance($) {
    unless (defined($INSTANCE)) {
        my ($class, $vmm) = @_;
        my $self = {
            _vmm => $vmm,
            _vm_status_verifier => VMStatusVerifier->instance($vmm)
        };
        $INSTANCE = bless($self, $class);
        $self->_subscribe();
    }
    return $INSTANCE;
}

sub check_for_updates($ $) {
    my ($self, $client) = @_;
    my $theData = $self->{_vm_status_verifier}->check_for_updates();
    if (defined($theData)) {
        $theData = "{ \"type\": \"update\", \"data\": $theData}";
        PublishSubscribe::publish('update-client', {client => $client, data => $theData});
    } else {
        $theData = "{ \"type\": \"update\", \"data\": null}";
        PublishSubscribe::publish('update-client', {client => $client, data => $theData});
    }
}

sub check_for_screenshot_updates($ $) {
    my ($self, $client) = @_;
    my $theData = $self->{_vm_status_verifier}->check_for_screenshots();
    $theData = "{ \"type\": \"screenshot-update\", \"data\": $theData }";
    PublishSubscribe::publish('update-client', { client => $client, data => $theData });
}

#When a client connects to the EndPoint an event is being triggered by the PublishSubscribe
#static class. This method subscribes to essential events which handling is required for
#successfully managing all connected clients.
sub _subscribe($) {
    my $self = shift;
    PublishSubscribe::subscribe('message-received', sub {
        my $request = shift;
        $self->_handle_request($request);
    });
    PublishSubscribe::subscribe('client-connected', sub {
        my ($ref) = @_;
        my %data = %{$ref};
        $self->{_vmm}->load_vms();
        my $machines = $self->{_vmm}->serialize();
        my $theData = "{ \"type\": \"update\", \"data\": $machines }";
        PublishSubscribe::publish('update-client', {client => $data{client}, data => $theData});
    });
}

#Handles a specific request by the client
sub _handle_request {
    my ($self, $request) = @_;
    my $msg = $request->{message};
    my $client = $request->{client};
    my $type = $msg->{type};
    if ($type eq 'update') {
        $self->check_for_updates($client);
    } elsif ($type eq 'screenshot-update') {
        $self->check_for_screenshot_updates($client);
    } elsif ($type eq 'change-vm-state') {
        my $action = $msg->{data}{action};
        my $current_vm = $self->{_vmm}->get_vm($msg->{data}{vm});
        if ($action eq 'start') {
            $current_vm->start();
        } elsif ($action eq 'poweroff') {
            $current_vm->poweroff();
        } elsif ($action eq 'shutdown') {
            $current_vm->shutdown();
        }
    } elsif ($type eq 'machine-edited') {
        $self->_modify_machine($msg->{data});
    }

}

sub _modify_machine($ $) {
    my ($self, $vm) = @_;
    my $current = $self->{_vmm}->get_vm($vm->{id});
    $current->ram($vm->{ram});
    $current->cpu($vm->{cpu});
    $current->vram($vm->{vram});
    $current->vrde_port($vm->{vrde_port});
    $current->vrde_address($vm->{vrde_address});
    $current->name($vm->{name});
    $current->save_state();
}

1;
