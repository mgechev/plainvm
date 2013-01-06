#!/usr/bin/perl

use strict;
use warnings;

package Common;

sub trim($) {
    my ($str) = @_;
    if (defined $str) {
        $str =~ s/^\s+//;
        $str =~ s/^\s+$//;
    }
    return $str;
}

sub log($) {
    my $theResult = "LOG: " . $_[0] . "\n";
    print $theResult;
    return $theResult;
}

sub warn($) {
    my $theResult = "\033[93mWarning: " . $_[0] . "\033[0m\n";
    print $theResult;
    return $theResult;
}

sub error($) {
    my $theResult = "\033[91mError: " . $_[0] . "\033[0m\n";
    print $theResult;
    return $theResult;
}

1;
