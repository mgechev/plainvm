#!/usr/bin/perl

use strict;
use warnings;
use Server::EntryHost;
use Common::Config;
use Common::Common;

MAIN: {

    print "\033[92m       _       _                      \n";
    print " _ __ | | __ _(_)_ ____   ___ __ ___  \n";
    print "| '_ \\| |/ _` | | '_ \\ \\ / / '_ ` _ \\\n";
    print "| |_) | | (_| | | | | \\ V /| | | | | |\n";
    print "| .__/|_|\\__,_|_|_| |_|\\_/ |_| |_| |_|\n";
    print "|_|\033[0m                             "; 
    print "\033[93m EntryHost \033[0m1.0\n\n";

    Config::load_config();
    Config::load_endpoints();

    my $entry_host = new EntryHost();
    $entry_host->start;

}
