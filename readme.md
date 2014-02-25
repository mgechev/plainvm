#plainvm

##What is plainvm?
[plainvm](http://plainvm.mgechev.com/) allows you to control multiple virtual machines which are distributed among many hosts through your browser. The only thing you need is plainvm installed and browser which supports HTML5. For the virtualization you can use any platform (currently only VirtualBox is supported). Everything is done real-time through the websocket protocol so multiple clients can access the environment simultaneously. If all dependencies of plainvm are installed the client can establish direct access to any virtual machine and control its' desktop. As the project is in it's first release there are some limitations which can be found in the next sections. plainvm is distributed under the terms of the GPL 3.0

Extra information can be found in the project's [wiki](https://github.com/mgechev/plainvm/wiki).
Project video can be found [here](https://www.youtube.com/watch?v=KkLaXagCj9Q).

##How does it work?
plainvm has few key components. There're end points and entry host. The end ponts are the hosts where the virtual machines are actually located. The entry host is the machine which is used for accepting the clients and providing the machines hosted in the end points. In the simplest case the end point and the entry host could be the same machine. That's the case in which a single host with virtual machines is used. The communication between the client and the entry host is done with the websocket protocol. plainvm has build-in web server so there are no extra dependencies. The communication between the end points and the entry host is established through tcp sockets.

##How to install?
plainvm uses Perl 5.10+. The project has few dependencies which can be restored with `CPAN`. The dependencies are `AnyEvent`, `JSON` and `Image::Imlib2`.

    cpan AnyEvent
    cpan JSON
    cpan Image::Imlib2
    cpan HTTP

`Image::Imlib2` depends on the `imlib2` library which can be found in `libimlib2` and `libimlib2-dev`.

For access to the machines desktop you should install VirtualBox's VRDE extension pack and Guacamole. For using plainvm with Guacamole you need to patch Guacamole with the "dirty" patch provided in "guacample-dirty-patch" folder. The files which should be patched are located at `/var/lib/tomcat6/webapps/guacamole`.

After that edit `/etc/guacamole/user-mapping.xml` and create account for each machine with user name the machine's ID and empty password.

Further instructions can be found in the project's [wiki](https://github.com/mgechev/plainvm/wiki/Installation).

Note that there is port to Java of the proxy. You can take a look at the `java` folder.

##How to contribute?
Just fork the project. Here are some ideas what can be improved:

1. TLS access to the Entry host
2. Managing snapshots
3. Control over more properties of the virtual machine
4. Better integration with Guacamole

For more ideas and essential features you can check the issue tracker or the project's [wiki](https://github.com/mgechev/plainvm/wiki).
