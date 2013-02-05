#!/usr/bin/perl

use strict;
use warnings;

use MIME::Base64;
use Common::Common;
use Common::Config;

package File;

sub new($ $) {
    my $class = shift;
    my $filename = shift;
    $filename = Config::get_option('iso_folder') . '/' . $filename;
    my $self = {
        _filename => $filename
    };
    bless $self, $class;
    if (not -e $filename) {
        $self->create_empty_file($filename);
    }
    return $self;
}

sub create_empty_file($ $) {
    my ($self, $file) = @_;
    open(FH, '>', $file) or Common::error('Cannot open the file ' . $file);
    close(FH);
}

sub appendBase64($ $) {
    my ($self, $chunk) = @_;
    $chunk = MIME::Base64::decode_base64 $chunk;
    open(FH, '>>', $self->{_filename}) or Common::error('Cannot open the file ' . $self->{_filename});
    print FH $chunk;
    close(FH);
}

1;
