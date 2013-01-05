#!/usr/bin/perl

use warnings;
use strict;

package Config;

my $config_file = 'config/config.conf';
my $ep_file = 'config/endpoints.conf';

my %config;
my $endpoints;

sub load_config {
   die('The configuration file does not exists') if (not -e $config_file); 
   open(FH, $config_file);
   while (<FH>) {
       my @key_value = split /=/, $_;
       $key_value[0] =~ s/\s//g;
       $key_value[1] =~ s/\s//g;
       $config{lc $key_value[0]} = $key_value[1];
   }
   close(FH);
}

sub load_endpoints {
    my @endpoints;
    my @socket;
    $endpoints = [];
    die('The end points configuration file does not exists!') if (not -e $ep_file);
    open(FH, $ep_file);
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

sub get_option($) {
    my $option = shift;
    return $config{lc $option}; 
}

sub get_endpoints {
    my @result = @$endpoints;
    return \@result;
}

1;
