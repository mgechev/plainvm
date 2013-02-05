#!/usr/bin/perl

use warnings;
use strict;

use Model::File;
use Mediator::PublishSubscribe;

use Data::Dumper;

package VMInstaller;

sub new($ $) {
    my $class = shift;
    my $client = shift;
    my $self = {
        _client => $client
    };
    bless $self, $class;
    return $self;
}

sub handle_request($ $) {
    my ($self, $req) = @_;
    if ($req->{type} eq 'system-iso-chunk') {
        $self->_handle_chunk($req);
    }
}

sub _handle_chunk($ $) {
    my ($self, $data) = @_;
    my $file = new File($data->{data}{filename});
    $file->appendBase64($data->{data}{chunk});
    my $response = {
        type => 'response-iso-chunk',
        uid => $data->{uid},
        data => {
            filename => $data->{data}{filename},
            id => $data->{data}{id}
        }
    };
    PublishSubscribe::publish('update-client',
    { client => $self->{_client}, data => JSON::to_json($response) });
}

1;
