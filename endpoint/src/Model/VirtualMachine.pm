#!/usr/bin/perl

use strict;
use warnings;

use Scalar::Util;

use Model::GuacamoleUserMapping;

#Base class for all virtualization platform adapters
package VirtualMachine;

sub new {
    my ($class) = @_;
    my $self = {
        _name => undef,
        _id => undef,
        _ram => undef,
        _os => undef,
        _vram => undef,
        _cpu => undef,
        _remote_port => undef,
        _remote_address => undef,
        _remoting_enabled => 0
    };
    bless $self, $class;
    return $self;
}

sub id {
    my ($self, $id) = @_;
    $self->{_id} = $id if defined $id;
    return $self->{_id};
}

sub name {
    my ($self, $name) = @_;
    $self->{_name} = $name if defined $name;
    return $self->{_name};
}

sub ram {
    my ($self, $ram) = @_;
    $self->{_ram} = $ram if defined $ram;
    return $self->{_ram};
}

sub os {
    my ($self, $os) = @_;
    $self->{_os} = $os if defined $os;
    return $self->{_os};
}

sub vram {
    my ($self, $vram) = @_;
    $self->{_vram} = $vram if defined $vram;
    return $self->{_vram};
}

sub cpu {
    my ($self, $cpu) = @_;
    $self->{_cpu} = $cpu if defined $cpu;
    return $self->{_cpu};
}

sub remote_port {
    my ($self, $port) = @_;
    if (Scalar::Util::looks_like_number($port)) {
        my $id = $self->{_id};
        if (defined $self->{_remote_port} &&
            $self->{_remote_port} != $port) {
            GuacamoleUserMapping->new->remove_user($id, $self->{_remote_address}, $port);
            GuacamoleUserMapping->new->add_user($id, $self->{_remote_address}, $port);
        }
        $self->{_remote_port} = $port;
    }
    return $self->{_remote_port};
}

sub remote_address {
    my ($self, $address) = @_;
    if (defined $address) {
        my $id = $self->{_id};
        if (defined $self->{_remote_address} &&
            $self->{_remote_address} ne $address) {
            GuacamoleUserMapping->new->remove_user($id, $address, $self->{_remote_port});
            GuacamoleUserMapping->new->add_user($id, $address, $self->{_remote_port});
        }
        $self->{_remote_address} = $address;
    }
    return $self->{_remote_address};
}

sub remoting_enabled {
    my ($self, $enabled) = @_;
    if (defined $enabled) {
        my ($id, $addr, $port) = ($self->{_id}, $self->{_remote_address}, $self->{_remote_port});
        if (defined $self->{_remoting_enabled} and
            $enabled != $self->{_remoting_enabled}) {
            if ($enabled) {
                GuacamoleUserMapping->new->add_user($id, $addr, $port);
            } else {
                GuacamoleUserMapping->new->remove_user($id, $addr, $port);
            }
        }
        $self->{_remoting_enabled} = $enabled;
    }
    return $self->{_remoting_enabled};
}

1;
