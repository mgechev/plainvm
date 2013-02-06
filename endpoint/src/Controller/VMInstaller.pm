#!/usr/bin/perl

use warnings;
use strict;

use Model::ISOManager;
use Mediator::PublishSubscribe;

use Scalar::Util;

#This class manages the whole installation process.
#For some tasks like creating new VM or transferring chunks it
#assigns the responsibility to different classes like ISOManager, VMManager
package VMInstaller;

sub new($ $) {
    my $class = shift;
    my $vmm = shift;
    my $self = {
        _isom => ISOManager->new,
        _vmm => $vmm
    };
    bless $self, $class;
    return $self;
}

#Handles new request which is connected with virtual machine installation
sub handle_request($ $ $) {
    my ($self, $req, $client) = @_;
    if ($req->{type} eq 'system-iso-chunk') {
        $self->_handle_chunk($req, $client);
    } elsif ($req->{type} eq 'system-create-vm') {
        my $res = $self->_create_vm($req, $client);
        $self->_send_install_response($res, $client);
    }
}

#Handles save of a chunk. It transfer this task to the ISOManager
sub _handle_chunk($ $) {
    my ($self, $data, $client) = @_;
    my $filename = $data->{data}{filename};
    if ($self->_handle_existing_iso($data, $client)) {
        return;
    }
    if ($data->{data}{id} == 0) {
        $self->{_isom}->new_file($filename);
    }
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
    my ($self, $data, $client) = @_;
    my $filename = $data->{data}{filename};
    if ($data->{data}{id} == 0 && $self->{_isom}->exists($filename) && !$data->{data}{force}) {
        PublishSubscribe::publish('update-client', { client => $client,
            data => JSON::to_json({
                type => 'response-iso-chunk',
                uid => $data->{uid},
                data => {
                    filename => $data->{data}{name},
                    status => 'exists'
                }
            })
        });
        return 1;
    }
    return 0;
}

sub _create_vm($ $ $) {
    my ($self, $data, $client) = @_;
    my $success = 1;
    my $cause;
    if (!$self->_validate_create_vm_request($data->{data})) {
        Common::error('Invalid installation parameters passed by the client');
        $cause = 'Invalid parameters';
        $success = 0;
    } else {
        $data->{data}{iso} = $self->{_isom}->get_full_file_path($data->{data}{os});
        if (!$self->{_vmm}->create_vm($data->{data})) {
            $cause = 'Error while creating the virtual machine';
            $success = 0;
        }
    }
    return {
        success => $success,
        cause => $cause,
        uid => $data->{uid},
        name => $data->{data}{name}
    };
}

sub _send_install_response($ $) {
    my ($self, $data, $client) = @_;
    my $success = $data->{success};
    if ($success) {
        PublishSubscribe::publish('update-client', { client => $client,
            data => JSON::to_json({
                type => 'create-vm-success',
                uid => $data->{uid},
                data => {
                    name => $data->{name}
                }
            })
        });
    } else {
        PublishSubscribe::publish('update-client', { client => $client,
            data => JSON::to_json({
                type => 'create-vm-fail',
                uid => $data->{uid},
                data => {
                    name => $data->{name},
                    cause => $data->{cause}
                }
            })
        });
    }
}

sub _validate_create_vm_request($ $) {
    my ($self, $req) = @_;
    return 0 unless $req->{os} =~ /^[a-zA-Z0-9.\s)(]{3,35}$/;
    return 0 unless $req->{name} =~ /^[a-zA-Z0-9.\s)(_-]{3,35}$/;
    return 0 unless Scalar::Util::looks_like_number($req->{hdds});
    return 0 unless Scalar::Util::looks_like_number($req->{ram});
    return 1;
}

1;
