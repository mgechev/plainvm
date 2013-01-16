#!/usr/bin/perl

use strict;
use warnings;

use Server::HTTP::ResourceHandler;

use Protocol::WebSocket::Handshake::Server;
use Protocol::WebSocket::Frame;
use Protocol::WebSocket::Cookie::Response;

use HTTP::Request;
use HTTP::Response;

#Handles the client's connections.
#This package manages the client's HTTP requests, WebSocket upgrades
#and WebSocket frames.
package ClientHandler;

sub new {
    my ($class, $observer) = @_;
    my $self = {
        _server => undef,
        _port => undef,
        _address => undef,
        _handles => {},
        _websocket_connections => {},
        _observer => $observer
    };
    bless($self, $class);
    return $self;
}

sub update_clients($) {
    my ($self, $current_vms) = @_;
    my $websocket_connections = $self->{_websocket_connections};
    for my $client_key (keys($websocket_connections)) {
        $self->send_frame($websocket_connections->{$client_key}, $current_vms);
    }
}

sub listen($ $) {
    my ($self, $port, $address) = @_;
    $self->{_port} = $port;
    $self->{_address} = $address;
    my $cv = AnyEvent->condvar();
    AnyEvent::Socket::tcp_server($address, $port, sub {
        $self->_client_connection_callback(@_);
    });
    $cv->wait();
}

#Sends websocket frame
sub send_frame($ $ $) {
    my ($self, $handle, $message) = @_;
    my $frame = Protocol::WebSocket::Frame->new;
    $handle->push_write($frame->new($message)->to_bytes);
}

#Handles connection errors
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
    $currentHandle->on_read(sub {
        $self->_request_callback(@_); 
    });
    $currentHandle->on_eof(sub {
        Common::warn('Unexpected end-of-file.');
        $self->_handle_error($currentHandle);
    });
    $currentHandle->on_error(sub {
        Common::error('Error ocurred.');
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

sub _request_callback($ $) {
    my ($self, $handle) = @_;
    my $chunk = $handle->{rbuf};
    $handle->{rbuf} = undef;
    if ($self->_is_http($chunk)) {
        $self->_handle_http_request($handle, $chunk);
    } else {
        Common::log('Client sent websocket frame.');
        $self->_handle_websocket_frame($handle, $chunk);
    }
}

sub _handle_http_request($ $ $) {
    my ($self, $handle, $chunk) = @_;
    if ($self->_is_websocket($chunk)) {
        Common::log('Client made websocket handshake.');
        $self->_handle_websocket_handshake($chunk, $handle);
    } else {
        Common::log('Client made http request.');
        my $response = $self->_get_http_response(HTTP::Request->parse($chunk));
        $handle->push_write('HTTP/1.1' . $response->as_string);
        $self->_release_handle($handle);
        $handle->destroy;
        return;
    }
}

sub _get_http_response($) {
    my ($self, $request) = @_;
    my ($resource, $status, $response, $type) = ($request->uri, 200, HTTP::Response->new, undef);
    my $content = ResourceHandler::get_resource($resource);
    if (defined($content)) {
        $type = ResourceHandler::get_mime_type($resource);
    } else {
        $content = ResourceHandler::get_not_found();
        $type = 'text/html';
        $status = 404;
    }
    $response->code($status);
    $response->content($content);
    $response->header('content-type' => $type);
    return $response; 
}

sub _is_websocket($ $) {
    my ($self, $request) = @_;
    my @ary = split(/\n/, $request);
    my %hash = ();
    for (@ary) {
        my @temp = split(/:/, $_, 2);
        if (defined($temp[0]) and defined($temp[1])) {
            my $key = lc $temp[0];
            $hash{$key} = lc $temp[1];
        }
    }
    return exists($hash{'upgrade'}) and exists($hash{'connection'}) and 
           index('websocket', $hash{'upgrade'}) >= 0 and index('upgrade', $hash{'connection'}) >= 0;
}

sub _is_http($ $) {
    my ($self, $request) = @_;
    my @requestParts = split(/ /, $request);
    if (lc($requestParts[0]) =~ m/(http|get|post|http\/1.1)/) {
        return 1;
    }
    return 0;
}

sub _handle_websocket_frame($ $ $) {
    my ($self, $handle, $request) = @_;
    my $frame = Protocol::WebSocket::Frame->new;
    $frame->append($request);
    while (my $message = $frame->next) {
        $self->{_observer}->command_received($message, $handle);
    }
}

sub _handle_websocket_handshake($ $ $) {
    my ($self, $request, $handle) = @_;
    my $handshake = Protocol::WebSocket::Handshake::Server->new;
    if (!$handshake->is_done) {
        $handshake->parse($request);
        if ($handshake->is_done) {
            my $handshake_response = $handshake->to_string;
            my $init_vms = $self->{_observer}->client_init_vms;
            my $init_screens = $self->{_observer}->client_init_screenshots;
            $handle->push_write($handshake_response);
            $self->{_websocket_connections}->{$handle} = $handle;
            $self->_release_handle($handle);
            $self->send_frame($handle, $init_vms);
            $self->send_frame($handle, $init_screens);
        }
    }
}

1;
