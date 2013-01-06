#!/usr/bin/perl

use strict;
use warnings;
use Model::VBMachine;

#Manages the virtual machines, controls their creation (flyweight factory) and
#provides indirect access to them.
#This class is something like virtual machine pool.
package VMManager;

sub new($) {
    my ($class) = @_;
    my $self = {
        _vms => {}
    };
    bless($self, $class);
    return $self;
}

sub get_running_vms($) {
    my $self = shift;
    my @running_vms = ();
    for my $id (keys($self->{_vms})) {
        if ($self->{_vms}{$id}->is_running) {
            push(@running_vms, $self->{_vms}{$id});
        }
    }
    return @running_vms;
}

sub get_all_vms($) {
    my ($self) = @_;
    return %{$self->{_vms}};
}

sub start_all($) {
    my ($self) = @_;
    my %hash = %{ $self->{_vms} };
    foreach my $key (keys %hash) {
        $hash{$key}->start;
    }
}

sub poweroff_all($) {
    my ($self) = @_;
    my %hash = %{ $self->{_vms} };
    foreach my $key ( keys %hash ) {
        $hash{$key}->poweroff;
    }
}

sub shutdown_all($) {
    my ($self) = @_;
    my %hash = %{ $self->{_vms} };
    foreach my $key (keys %hash) {
        $hash{$key}->shutdown;
    }
}

sub load_vms($) {
    my ($self) = @_;
    my @ids = $self->_get_vm_ids;
    for (@ids) {
        $self->get_vm($_);
        $self->{_vms}->{$_}->load_vm();
    }
    return %{$self->{_vms}};
}

sub get_vm($ $) {
    my ($self, $id) = @_;
    my $vm = $self->{_vms}->{$id};
    if ($vm) {
        return $vm;
    }
    $vm = new VBMachine($id);
    $self->{_vms}->{$id} = $vm;
    return $vm;
}

sub serialize($) {
    my ($self) = @_;
    my %hash = %{ $self->{_vms} };
    my $result = '[';
    foreach my $key (keys %hash) {
        $result .= $hash{$key}->serialize . ',';
    }
    chop $result;
    $result .= ']';
    return $result;
}

sub take_screenshots($) {
    my $self = shift;
    my %vms = $self->get_all_vms();
    my $screenshots = '[ ';
    my $current_vm;
    my $current_screenshot;
    for my $id (keys(%vms)) {
        $current_vm = $vms{$id};
        $current_screenshot = $current_vm->take_screenshot();
        $current_screenshot = ($current_screenshot) ? "\"$current_screenshot\"" : "null";
        $screenshots .= "{ \"id\": \"$id\", \"pic\": $current_screenshot },";
    }
    chop($screenshots);
    $screenshots .= ']';
    return $screenshots;
}

sub _get_vm_ids($) {
    my ($self) = @_;
    my @vmsList = map { split / / } split /\n/, `vboxmanage list vms`;
    my @ids = ();
    for (@vmsList) {
        if (/{(.*)}/) {
            s/{(.*)}/$1/s;
            push @ids, $_;
        }
    }
    return @ids;
}

1;
