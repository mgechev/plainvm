#!/usr/bin/perl

use warnings;
use strict;

use Common::Common;

package Config;

my @config_files = ('config/endpoint-config.conf', '/etc/plainvm/endpoint-config.conf');

my %config;

sub load_config {
    my $file = _get_config_file();
    open(FH, '<' . $file);
    while (<FH>) {
        my @key_value = split /=/, $_;
        $key_value[0] =~ s/\s//g;
        $key_value[1] = Common::trim($key_value[1]);
        chomp $key_value[1];
        $config{lc $key_value[0]} = $key_value[1];
    }
    close(FH);
}

sub _get_config_file {
    my $file = undef;
    for (@config_files) {
        $file = $_ if -e $_;
    }
    die 'The configuration file does not exists' if not defined $file; 
    return $file;
}

sub get_option($) {
    my $option = shift;
    return $config{lc $option}; 
}

1;
