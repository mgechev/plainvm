#!/usr/bin/perl

use strict;
use warnings;
use threads;

use Model::VMManager;
use Common::Common;

use Common::Config;

package VMStatusVerifier;

my $screenshot_update_interval;
my $update_interval;

my $INSTANCE = undef;

sub instance($) {
    unless (defined($INSTANCE)) {
        my ($class, $vmm) = @_;
        my $self = {
            _last_vms_state => {},
            _last_screenshots => undef,
            _vmm => $vmm,
            _last_check => 0,
            _last_screenshot_check => 0
        };
        $screenshot_update_interval = Config::get_option('screenshot_update_interval');
        $update_interval = Config::get_option('update_interval');
        $INSTANCE = bless($self, $class);

    }
    return $INSTANCE;
}

#Checks for updates and update the local cache.
#This method handles the virtual machine's information (properties).
sub check_for_updates($) {
    my $self = shift;
    if (time() - $self->{_last_check} >= $update_interval) {
        $self->{_last_check} = time();
        my $vmm = $self->{_vmm};
        my %vms = $vmm->load_vms();
        my %last_state = ();
        my @changed = ();
        for my $id (keys(%vms)) {
            my $serialized_machine = $vms{$id}->serialize;
            if (!exists($self->{_last_vms_state}->{$id})) {
                push(@changed, $serialized_machine);
            } else {
                my $machine = $self->{_last_vms_state}->{$id};
                if ($serialized_machine ne $machine) {
                    push(@changed, $serialized_machine);
                }
            }
            $last_state{$id} = $serialized_machine;
        }
        $self->{_last_vms_state} = \%last_state;
        if (scalar(@changed) > 0) {
            Common::log(@changed . " vms changed since last check.");
            return $self->_prepare_data(\@changed);
        }
    }
    return undef;
}

sub check_for_screenshots() {
    my $self = shift;
    if (time() - $self->{_last_screenshot_check} >= $screenshot_update_interval) {
        $self->{_last_screenshot_check} = time();
        $self->{_last_screenshots} = $self->{_vmm}->take_screenshots();
    }
    return $self->{_last_screenshots};
}

sub _prepare_data($ $) {
    my $self = shift;
    my $data = shift;
    my $result = '[';
    for (@{$data}) {
        $result .= $_ . ',';
    }
    chop($result);
    $result .= ']';
    return $result;
}

1;
