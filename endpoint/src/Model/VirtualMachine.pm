#!/usr/bin/perl

use strict;
use warnings;

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
        _cpu => undef
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

1;
