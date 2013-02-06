#!/usr/bin/perl

use warnings;
use strict;

use Data::Dumper;

use XML::Simple;

use Common::Common;

package GuacamoleUserMapping;

my $INSTANCE = undef;

use constant PROTOCOL => 'rdp';

sub new($) {
    my $class = shift;
    return $INSTANCE if defined $INSTANCE;
    my $self = {
        _file => Config::get_option('guacamole_users_dir')
    };
    bless $self, $class;
    $INSTANCE = $self;
    return $self;
}

sub add_user($ $ $ $) {
    my ($self, $user, $host, $port, $pass) = @_;
    if ($self->_user_exists($user)) {
        Common::warn('Replacing an existing user ' . $user);
        $self->remove_user($user);
    }
    my $mapping = $self->get_user_mapping($user, $host, $port, $pass);
    my $xml = XML::Simple::XMLin($self->{_file}) or die('Cannot open!');
    push $xml->{authorize}, $mapping;
    $xml = { 'user-mapping' => $xml };
    $mapping = XML::Simple::XMLout($xml, KeepRoot => 1);
    open(FH, '>', $self->{_file}) or die("Cannot open $self->{_file} for writing.");
    print FH $mapping;
    close(FH);
}

sub get_user_mapping($ $ $ $) {
    my ($self, $user, $host, $port, $pass) = @_;
    $pass = '' unless defined $pass;
    my $data = {
        username => $user,
        password => $pass,
        protocol => [PROTOCOL],
        param => {
            hostname => { content => $host },
            port => { content => $port }
        }
    };
    return $data, 
}

sub remove_user($ $ $) {
    my ($self, $user) = @_;
    my $xml = XML::Simple::XMLin($self->{_file}) or die('Cannot open!');
    my @authorize = @{$xml->{authorize}};
    my $last_elem = $#authorize;
    my @del_indexes = grep { $authorize[$_]{username} =~ /$user/o } 0..$last_elem;
    splice @authorize, $_, 1 for @del_indexes;
    my $data = { authorize => \@authorize };
    open(FH, '>', $self->{_file}) or die("Cannot open $self->{_file} for writing.");
    print FH XML::Simple::XMLout({ 'user-mapping' => $data }, KeepRoot => 1);
    close(FH);
}

sub _user_exists($ $) {
    my ($self, $user) = @_;
    my $content = $self->_get_file_content;
    return $content =~ /$user/o;
}

sub _get_file_content($) {
    my ($self) = @_;
    open(FH, '<', $self->{_file}) or Common::error('Cannot open ' . $self->{_file} . ' for reading');
    my $content = '';
    $content .= $_ while (<FH>);
    close(FH);
    return $content;
}

1;
