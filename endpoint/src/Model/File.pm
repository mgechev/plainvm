#!/usr/bin/perl

use strict;
use warnings;

use MIME::Base64;
use Common::Common;
use Common::Config;

use Mediator::PublishSubscribe;

package File;

sub new($ $) {
    my $class = shift;
    my $filename = shift;
    my $self = {
        _filename => $filename
    };
    bless $self, $class;
    return $self;
}

sub create_empty_file($) {
    my ($self) = @_;
    my $file = $self->{_filename};
    open(FH, '>', $file) or Common::error('Cannot open the file ' . $file);
    close(FH);
}

sub append_base64($ $) {
    my ($self, $chunk) = @_;
    $chunk = MIME::Base64::decode_base64 $chunk;
    open(FH, '>>', $self->{_filename}) or Common::error('Cannot open the file ' . $self->{_filename});
    print FH $chunk;
    close(FH);
}

sub name {
    my ($self, $name) = @_;
    $self->{_filename} = $name if defined $name;
    return $self->{_filename};
}

1;
