#!/usr/bin/perl

use warnings;
use strict;

package Config;

my $config_file = 'config/config.conf';

my %config;

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

sub get_option($) {
    my $option = shift;
    return $config{lc $option}; 
}

1;
