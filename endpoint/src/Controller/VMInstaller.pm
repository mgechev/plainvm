#!/usr/bin/perl

use warnings;
use strict;

use Model::ISOManager;
use Mediator::PublishSubscribe;

#This class manages the whole installation process.
#For some tasks like creating new VM or transferring chunks it
#assigns the responsibility to different classes like ISOManager, VMManager
package VMInstaller;

sub new($ $) {
    my $class = shift;
    my $self = {
        _isom => ISOManager->new
    };
    bless $self, $class;
    return $self;
}

#Handles new request which is connected with virtual machine installation
sub handle_request($ $) {
    my ($self, $req, $client) = @_;
    if ($req->{type} eq 'system-iso-chunk') {
        $self->_handle_chunk($req, $client);
    }
}

#Handles save of a chunk. It transfer this task to the ISOManager
sub _handle_chunk($ $) {
    my ($self, $data, $client) = @_;
    my $filename = $data->{data}{filename};
    $self->_handle_existing_iso($data);
    $self->{_isom}->new_file($filename) unless $self->{_isom}->exists($filename);
    $self->{_isom}->append_base64_chunk($data->{data});
    PublishSubscribe::publish('update-client', { client => $client,
        data => JSON::to_json({
            type => 'response-iso-chunk',
            uid => $data->{uid},
            data => {
                filename => $data->{data}{filename},
                id => $data->{data}{id}
            }
        })
    });
}

sub _handle_existing_iso($ $) {
    my ($self, $data) = @_;
    my $filename = $data->{data}{filename};
    if ($data->{data}{id} == 0 && $self->{_isom}->exists($filename) && !$data->{force}) {
        PublishSubscribe::publish('update-client', { client => $self->{_client},
            data => JSON::to_json({
                type => 'response-iso-chunk',
                uid => $data->{uid},
                data => {
                    filename => $data->{data}{id},
                    status => 'exists'
                }
            })
        });
        return 1;
    }
    return 0;
}

1;
