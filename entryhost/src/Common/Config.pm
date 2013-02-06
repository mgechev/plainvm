#!/usr/bin/perl

use warnings;
use strict;

use Common::Common;

package Config;

my @config_files = ('config/entryhost-config.conf', '/etc/plainvm/entryhost-config.conf');
my @ep_files = ('config/endpoints.conf', '/etc/plainvm/endpoints.conf');

my %config;
my $endpoints;

sub load_config {
    my $file = _get_file(\@config_files);
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

sub load_endpoints {
    my $file = _get_file(\@ep_files);
    my @endpoints;
    my @socket;
    $endpoints = [];
    open(FH, '<' . $file);
    my $ep = '';
    $ep .= $_ while (<FH>);
    @endpoints = split(/,/, $ep);
    for (@endpoints) {
        next unless length > 1; #if there's extra comma
        @socket = split(/:/, $_);
        $socket[0] =~ s/\s//g;
        $socket[1] =~ s/\s//g if defined $socket[1]; #the port may not be specified
        push($endpoints, {
            host => $socket[0],
            port => $socket[1]
        });
    }
}

sub _get_file($ $) {
    my ($files, $file) = (@_, undef);
    for (@$files) {
        $file = $_ if -e $_;
    }
    die 'Configuration file does not exists' if not defined $file;
    return $file;
}

sub get_option($) {
    my $option = shift;
    return $config{lc $option}; 
}

sub get_endpoints {
    my @result = @$endpoints;
    return \@result;
}

1;
