#!/usr/bin/perl

use strict;
use warnings;
use utf8;

use threads;

use AnyEvent::Socket;
use AnyEvent::Handle;

use JSON;
use Mediator::PublishSubscribe;
use Common::Common;

#Manages the entry host connections.
package ConnectionHandler;

sub new {
    my ($class) = @_;
    my $self = {
        _server => undef,
        _port => undef,
        _handles => {},
        _websocket_connections => {}
    };
    bless($self, $class);
    $self->_subscribe_to_events();
    return $self;
}

sub listen($ $) {
    my ($self, $port, $address) = @_;
    $self->{_port} = $port;
    my $cv = AnyEvent->condvar();
    AnyEvent::Socket::tcp_server($address, $self->{_port}, sub {
        $self->_client_connection_callback(@_);
    });
    $cv->wait();
}

#Subscribes to events which should send some data to the client
sub _subscribe_to_events {
    my $self = shift;
    PublishSubscribe::subscribe('update-client', sub {
        my $ref = shift;
        my %data = %{$ref};
        $self->_send_frame($data{client}, $data{data});
    });
    PublishSubscribe::subscribe('update-clients', sub {
        my ($data) = @_;
        my $websocket_connections = $self->{_websocket_connections};
        for my $client_key (keys($websocket_connections)) {
            $self->_send_frame($websocket_connections->{$client_key}, $data->{data});
        }
    });
}

#Sends a message to the client
sub _send_frame($ $ $) {
    my ($self, $handle, $message) = @_;
    eval {
        $handle->push_write($message);
    };
    if ($@) {
        Common::error('Unable to send message to the client.');
    }
}

sub _handle_error ($ $) {
    my ($self, $handle) = @_;
    if (exists($self->{_websocket_connections}->{$handle})) {
        Common::log('Client disconnected that\'s why the previous error occured.');
        delete $self->{_websocket_connections}->{$handle};
        $handle->destroy();
    }
}

sub _client_connection_callback($) {
    my ($self, $filehandler, $host, $port) = @_;
    my $handles = $self->{_handles};
    my $currentHandle = new AnyEvent::Handle(fh => $filehandler);
    $self->{_handles}->{$currentHandle} = 1;
    Common::log("Client with socket $host:$port connected.");
    PublishSubscribe::publish('client-connected', { client => $currentHandle });
    my $parser = new JSON::XS;
    $currentHandle->on_read(sub {
        my $fh = shift;
        my @obj = $parser->incr_parse($fh->{rbuf});
        $fh->{rbuf} = undef;
        $self->_handle_request($fh, $_) for @obj;
    });
    $currentHandle->on_eof(sub {
        Common::warn('Unexpected end-of-file.');
        $self->_handle_error($currentHandle);
    });
    $currentHandle->on_error(sub {
        my ($m, $f, $msg) = @_;
        Common::error("Error in the connection ocurred: $msg");
        $self->_handle_error($currentHandle);
    });
}

sub _release_handle ($ $) {
    my ($self, $handle) = @_;
    my $handles = $self->{_handles};
    if (exists($handles->{$handle})) {
        delete $handles->{$handle};
    }
}

sub _handle_request($ $ $) {
    my ($self, $handle, $json) = @_;
    $handle->{rbuf} = undef;
    PublishSubscribe::publish('message-received', { message => $json, client => $handle });
}

1;
