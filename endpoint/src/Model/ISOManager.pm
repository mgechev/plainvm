#!/usr/bin/perl

use strict;
use warnings;
use Data::Dumper;

use Model::File;
use Common::Common;

#This class manages the ISO files. It has the following responsibilities:
#   - manage a pull of files
#   - create new iso files
#   - append to old iso files
#   - tracks the chunks order
package ISOManager;

my $INSTANCE = undef;

sub new($) {
    my $class = shift;
    return $INSTANCE if defined $INSTANCE;
    my $self = {
        _chunks => {},
        _files => {},
        _base => Config::get_option('iso_dir') . '/',
        _ext => 'iso'
    };
    bless $self, $class;
    $INSTANCE = $self;
    return $self;
}

sub get_full_file_path($ $) {
    my ($self, $filename) = @_;
    my $base = $self->{_base};
    my $ext = $self->{_ext};
    $filename = "$base$filename.$ext"  unless $filename =~ /$base/o;
    return $filename;
}

sub append_base64_chunk($ $ $) {
    my ($self, $data) = @_;
    my $filename = $self->get_full_file_path($data->{filename});
    my $id = $data->{id};
    $self->_init_file($filename) unless defined $self->{_files}{$filename};
    my $old_id = $self->{_chunks}{$filename};
    if ($old_id == 0 || $old_id < $id) {
        $self->{_chunks}{$filename} = $id;
        $self->{_files}{$filename}->append_base64($data->{chunk});
        return 1;
    }
    Common::warn('This chunk have beed already appended');
    return 0;
}

sub _init_file($ $) {
    my ($self, $filename) = @_;
    $self->{_chunks}{$filename} = 0 unless defined $self->{_chunks}{$filename};
    my $file = new File($filename);
    $self->{_files}{$filename} = $file;
    return $file;
}

sub exists($ $) {
    my ($self, $filename) = @_;
    print $self->get_full_file_path($filename);
    return -e $self->get_full_file_path($filename);
}

sub new_file($ $) {
    my ($self, $filename) = @_;
    $filename = $self->get_full_file_path($filename);
    Common::log('Removing the old ISO file...');
    unlink($filename) if $self->exists($filename);
    my $file = $self->_init_file($filename);
    $file->create_empty_file;
}

1;
