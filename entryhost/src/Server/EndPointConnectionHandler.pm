#!/usr/bin/perl

use strict;
use warnings;

package EndPointConnectionHandler;

use threads;
use threads::shared;

use Common::Common;
use Common::Config;

use Test::Deep;

my %current_vms : shared;
my %all_vms : shared;
my $dirty : shared;

my %current_screenshots : shared;
my %all_screenshots : shared;
my $dirty_screenshots : shared;

my %command_queue : shared;

sub new {
    my ($class, $endpoints) = @_;
    my $self = {
        _server => undef,
        _endpoint_connections => {},
        _endpoints => undef
    };
    $self->{_endpoints} = $endpoints;
    bless($self, $class);
    return $self;
}

sub connect_to_endpoints($) {
    my $self = shift;
    my @endpoints = @{$self->{_endpoints}};
    for (@endpoints) {
        $self->_connect_to_endpoint($_);
    }
}

#Gets a hashmap with all virtual machines.
#The keys of the hash are the end point's hostnames
#the values are JSON strings with all VMs associated to the current end point.
sub get_vms($) {
    return \%all_vms;
}

#Returns whether there are updates for any virtual machine
sub is_dirty($) {
    return $dirty;
}

#Returns the updated machines
sub get_dirty($) {
    $dirty = 0;
    my %result = %current_vms;
    %current_vms = ();
    return \%result;
}

#Gets all screenshots. The hash which
#is returned here is with keys all end points
#and values screenshot for each machine on each of the end points.
sub get_screenshots {
    return \%all_screenshots;
}

#Returns whether there are new screenshots.
sub is_screenshot_dirty($) {
    return $dirty_screenshots;
}

sub get_dirty_screenshots($) {
    $dirty_screenshots = 0;
    my %result = %current_screenshots;
    %current_screenshots = ();
    return \%result;
}

#Sends command to a specific end point
sub push_command($ $ $) {
    my ($self, $ep, $command) = @_;
    lock(%command_queue);
    share($command);
    push($command_queue{$ep}, $command);
}

sub _connect_to_endpoint {
    my ($self, $endpoint) = @_;
    my $host = $endpoint->{host};
    my $port = $endpoint->{port} || Config::get_option('endpoint_port');
    $command_queue{$host} = &share([]);
    threads->new(sub () {
        $self->_create_tcp_connection($host, $port);
    });
}

#Creates a TCP connection to the End point and starts polling
sub _create_tcp_connection($ $ $) {
    my ($self, $host, $port) = @_;
    my $cv = AnyEvent->condvar();
    my ($timeout, $screenshot_timeout, $command_timeout, $fh);
    AnyEvent::Socket::tcp_connect($host, $port, sub {
        $fh = shift;
        eval {
            $fh = AnyEvent::Handle->new(fh => $fh);
            $self->_endpoint_connection_established($fh, $host);
            $timeout = $self->_start_poll(Config::get_option('poll_interval'), $host, $fh);
            $screenshot_timeout = 
                $self->_start_screenshot_poll(Config::get_option('screenshot_poll_interval'), $fh);
        };
        if ($@) {
            Common::error("Error while connecting to the endpoint $host");
        }
    });
    $cv->wait();
}

#This method polls for updates of the virtual machines (their properties and state)
#It also push commands sent by any client when there are any in the queue.
sub _start_poll($ $ $) {
    my ($self, $interval, $host, $fh) = @_;
    return AnyEvent->timer(after => 0, interval => $interval, cb => sub {
        my @to_write = ();
        lock(%command_queue);
        while (scalar(@{$command_queue{$host}}) > 0) {
            my $command = pop(@{$command_queue{$host}});
            my $parsed_command = JSON::from_json($command);
            push(@to_write, $parsed_command);
        }
        push(@to_write, { type => 'update' });
        $fh->push_write(json => @to_write);
    });
}

#Polls for screenshot updates
sub _start_screenshot_poll($ $ $) {
    my ($self, $interval, $fh) = @_;
    return AnyEvent->timer(after => 0, interval => $interval, cb => sub {
        $fh->push_write(json => { type => 'screenshot-update' });
    });
}

sub _endpoint_connection_established($ $ $) {
    my ($self, $fh, $endpoint) = @_;
    if ($fh) {
        Common::log('Connected to endpoint');
        $fh->on_read(sub {
            $fh->push_read(json => sub {
                my ($fh, $json) = @_;
                $self->_handle_message($json, $endpoint);
            });
        });
        $fh->on_error(sub {
            Common::error('Error in the connection with endpoint ' . $endpoint); 
        });
        $fh->on_eof(sub {
            Common::warn('Unexpected end of file with endpoint ' . $endpoint); 
        });
        $self->{_endpoint_connections}{$endpoint} = $fh;
    }
}

sub _handle_message($ $ $) {
    my ($self, $message, $endpoint) = @_;
    if ($message->{type} eq 'update') {
        $self->_validate_vms($message->{data}, $endpoint);
    }
    if ($message->{type} eq 'screenshot-update') {
        $self->_validate_screenshots($message->{data}, $endpoint);
    }
}

sub _validate_screenshots($ $ $) {
    my ($self, $data, $endpoint) = @_;
    lock(%all_screenshots);
    lock(%current_screenshots);
    lock($dirty_screenshots);
    my $res = $self->_validate({
        all => \%all_screenshots,
        current => \%current_screenshots,
        endpoint => $endpoint,
        data => $data
    });
    if (!$res) {
        $dirty_screenshots = 1;
    }
}

sub _validate_vms($ $ $) {
    my ($self, $data, $endpoint) = @_;
    lock(%all_vms);
    lock(%current_vms);
    lock($dirty);
    my $res = $self->_validate({
        all => \%all_vms,
        current => \%current_vms,
        endpoint => $endpoint,
        data => $data
    });

    if (!$res) {
        $dirty = 1;
    }
}

# Returns array of key-value pairs
# Each VM entity is returned as pair: "id": "data"
# In some cases the id can be found also in the data (like if 
# a screenshot validation is made) it may look a little dumb
# but it helps a lot when cheching whether a machine's status or screenshot
# is changed. In this way the check is done in O(1) instead of O(n)
sub _validate($ $) {
    my ($self, $opt) = @_;
    my $all = $opt->{all};
    my $current = $opt->{current};
    my $endpoint = $opt->{endpoint};
    my $data = $opt->{data};

    $all->{$endpoint} = '{}' if (!defined($all->{$endpoint}));
    $current->{$endpoint} = '{}' if (!defined($current->{$endpoint}));
    my $last = JSON::from_json($all->{$endpoint});
    my $changed = {};
    my @vms = ();
    @vms = @$data if $data;
    for (@vms) {
        my $id = $_->{id};
        if (!$last->{$id} || !Test::Deep::eq_deeply($_, $last->{$id})) {
            $last->{$id} = $_;
            $changed->{$id} = $_;
        }
    }
    $self->_update_current($current, $changed, $endpoint);
    $all->{$endpoint} = JSON::to_json($last);
    if (scalar(keys(%$changed)) > 0) {
        return 0;
    }
    return 1;
}

#This is required because the cache may not have been
#cleared for more than a single validation.
#If it haven't been cleared for more than one
#invalid vms are located in the current_vms(screenshots) not just
#in the changed in the current iteration.
sub _update_current($ $ $ $) {
    my ($self, $current_stuff, $changed_stuff, $endpoint) = @_;
    my $current = JSON::from_json($current_stuff->{$endpoint});
    for my $id (keys(%$changed_stuff)) {
        $current->{$id} = $changed_stuff->{$id};
    }
    $current_stuff->{$endpoint} = JSON::to_json($current);
}

1;
