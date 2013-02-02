#!/usr/bin/perl

use strict;
use warnings;
use Model::VirtualMachine;
use Common::Common;
use MIME::Base64;
use Image::Imlib2;

#Adapter for VirtualBox
package VBMachine;

our @ISA = qw(VirtualMachine);

use constant MAX_IMAGE_WIDTH => 300;

sub new($ $) {
    my ($class, $id) = @_;
    my $self = $class->SUPER::new();
    $self->{_vrde_port} = undef;
    $self->{_vrde_address} = undef;
    $self->{_status} = undef;
    die('Id haven\'t been provided!') if not defined($id);
    bless($self, $class);
    $self->id($id);
    return $self;
}

sub start($) {
    my ($self) = @_;
    my $id = $self->{_id};
    `vboxmanage startvm $id --type headless` if defined $id;
}

sub poweroff($) {
    my ($self) = @_;
    my $id = $self->{_id};
    `vboxmanage controlvm $id poweroff` if defined $id;
}

sub shutdown($) {
    my ($self) = @_;
    my $id = $self->{_id};
    `vboxmanage controlvm $id acpipowerbutton` if defined $id;
}

sub enable_vrde($) {
    my ($self) = @_;
    my $id = $self->{_id};
    `vboxmanage modifyvm $id --vrde on` if defined $id;
}

sub id($ $) {
    my ($self, $id) = @_;
    return $self->SUPER::id($id);
}

sub name {
    my ($self, $name) = @_;
    $name = $self->_get_vm_property('Name') unless defined($name);
    return $self->SUPER::name($name);
}

sub ram {
    my ($self, $ram) = @_;
    no warnings 'numeric';
    $ram = int($self->_get_vm_property('Memory size')) unless defined($ram);
    return $self->SUPER::ram($ram);
}

sub os($) {
    my ($self) = @_;
    my $os = $self->_get_vm_property('Guest OS');
    return $self->SUPER::os($os);
}

sub vram {
    my ($self, $vram) = @_;
    no warnings 'numeric';
    $vram = int($self->_get_vm_property('VRAM size')) unless defined($vram);
    return $self->SUPER::vram($vram);
}

sub cpu {
    my ($self, $cpu) = @_;
    no warnings 'numeric';
    $cpu = int($self->_get_vm_property('CPU exec cap')) unless defined($cpu);
    return $self->SUPER::cpu($cpu);
}

sub disable_vrde($) {
    my ($self) = @_;
    my $id = $self->{_id};
    `vboxmanage modifyvm $id --vrde off` if defined $id;
}

sub vrde_port($ $) {
    my ($self, $port) = @_;
    if (defined($port)) {
        $self->{_vrde_port} = $port;
    } else {
        my @vrdeStr = split(/ /, $self->_get_vm_property('VRDE'));
        if ($vrdeStr[4]) {
            chop $vrdeStr[4];
            $port = $vrdeStr[4];
        } else {
            $port = 'null';
        }
    }
    no warnings 'numeric';
    $self->{_vrde_port} = int($port) if defined $port;
    return $self->{_vrde_port};
}

sub vrde_address($ $) {
    my ($self, $address) = @_;
    if (defined $address) {
        $self->{_vrde_address} = $address;
    } else {
        my @vrdeStr = split / /, $self->_get_vm_property('VRDE');
        if ($vrdeStr[2]) {
            chop $vrdeStr[2];
            $address = $vrdeStr[2];
        } else {
            $address = 'null';
        }
    }
    $self->{_vrde_address} = $address if defined $address;
    return $self->{_vrde_address};
}

sub is_running($) {
    my ($self) = @_;
    my $output = `vboxmanage list runningvms`;
    return index($output, $self->id) >= 0;
}

sub save_state($) {
    my ($self) = @_;
    my $id = $self->{_id};
    my $name = $self->{_name};
    my $ram = $self->{_ram};
    my $vram = $self->{_vram};
    my $cpu = $self->{_cpu};
    my $vrde_address = $self->{_vrde_address};
    my $vrde_port = $self->{_vrde_port};
    `vboxmanage modifyvm $id --name "$name" --memory $ram --vram $vram --cpuexecutioncap $cpu --vrdeport $vrde_port --vrdeaddress $vrde_address`;
}

sub serialize($) {
    my ($self) = @_;
    my $id = $self->id;
    my $name = $self->name;
    my $ram = $self->ram;
    my $os = $self->os;
    my $vram = $self->vram;
    my $cpu = $self->cpu;
    my $vrde_address = $self->vrde_address;
    my $vrde_port = $self->vrde_port;
    my $is_running = ($self->is_running) ? 'true' : 'false';
    my $result = "{ \"id\": \"$id\", \"is_running\": $is_running, \"name\": \"$name\", \"ram\": \"$ram\" , \"cpu\": \"$cpu\", \"os\": \"$os\", \"vram\": \"$vram\", \"vrde_port\": $vrde_port, \"vrde_address\": ";
    if ($vrde_address eq 'null') {
        $result .= 'null }';
    } else {
        $result .= "\"$vrde_address\" }";
    }
    return $result;
}

sub equals($ $) {
    my ($self, $machine) = @_;
    if (not defined($machine)) {
        return 0;
    }
    return $self->serialize() eq $machine->serialize();
}

sub load_vm($) {
    my $self = shift;
    my $id = $self->{_id};
    $self->{_status} = `vboxmanage showvminfo $id` if defined $id;
    return $self->{_status};
}

sub take_screenshot($) {
    my $self = shift;
    my $id = $self->id();
    if ($self->is_running()) {
        my $filename = "$id.png";
        `vboxmanage controlvm $id screenshotpng $filename`;
        $self->_resize_screenshot($filename);
        open(IMAGE, "<$filename");
        my $raw_string = '';
        while (<IMAGE>) {
            $raw_string .= $_;
        }
        unlink($filename);
        my $encoded = MIME::Base64::encode_base64($raw_string);
        $encoded =~ s{\n}{}g;
        $encoded = "data:image/png;base64,$encoded";
        return $encoded; 
    }
    return undef;
}

sub _resize_screenshot($ $) {
    my ($self, $file) = @_;
    my $image = Image::Imlib2->load($file);
    my $width = $image->width();
    my $height = $image->height();
    if ($width > MAX_IMAGE_WIDTH) {
        my $ratio = $width / $height;
        my $height = MAX_IMAGE_WIDTH / $ratio;
        $image->set_quality(10);
        my $scaled = $image->create_scaled_image(MAX_IMAGE_WIDTH, $height);
        $scaled->save($file);
    }
}

sub _get_vm_property($ $) {
    my ($self, $property) = @_;
    my $id = $self->{_id};
    if (not defined($self->{_status})) {
        Common::warning("You must load the VM before getting any property (use load_vm)\n");
    }
    my $props = $self->{_status};
    if (defined $props) {
        my %propsHash = ();
        my @propsAry = split(/\n/, $props);
        @propsAry = map { split(/:/, $_, 2) } @propsAry;
        for (my $i = 0; $i < scalar(@propsAry); $i += 2) {
            unless (defined $propsHash{$property}) {
                $propsAry[$i] = Common::trim($propsAry[$i]);
                $propsAry[$i + 1] = Common::trim($propsAry[$i + 1]);
                $propsHash{$propsAry[$i]} = $propsAry[$i + 1];
            }
        }
        return $propsHash{$property};
    }
    return undef;
}

1;
