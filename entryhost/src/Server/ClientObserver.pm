#!/usr/bin/perl

use strict;
use warnings;

#When an event at the ConnectionHandler occurs  this
#class notifies the EntryHost.
package ClientObserver;

sub new {
    my ($class, $entryhost) = @_;
    my $self = {
        _entryhost => $entryhost
    };
    bless $self, $class;
    return $self; 
}

sub command_received {
    my ($self, $command) = @_;
    $self->{_entryhost}->send_command($command);
}

sub client_init_vms {
    my $self = shift;
    my $result = $self->{_entryhost}->get_vms;
    return $result;
}

sub client_init_screenshots {
    my $self = shift;
    my $result = $self->{_entryhost}->get_screenshots;
    return $result;
}

1;
