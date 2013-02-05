#!/usr/bin/perl

use strict;
use warnings;

#This package is used for removing the coupling between
#the different components.
#It has only two methods - publish and subscribe.
#When subscribing to given topic you should provide a callback
#to be invoked when the event occurs.
package PublishSubscribe;

my %_topics = ();
our $test = 0;

sub publish($ $) {
    my ($event, $args) = @_;
    if (exists($_topics{$event})) {
        my @callbacks = @{$_topics{$event}};
        if (@callbacks) {
            $_->($args) for (@callbacks);
        }
        return 1;
    }
    return 0;
}

sub get {
    return $test;
}

sub set {
    $test = shift;
}

sub subscribe($ $) {
    my ($event, $callback) = @_;
    my $callbacks = $_topics{$event};
    if (!$callbacks) {
        $callbacks = [];
    }
    push(@{$callbacks}, $callback);
    $_topics{$event} = $callbacks;
}

1;
