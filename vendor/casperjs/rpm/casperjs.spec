%define name    casperjs
%if "%{_version}"
%define version %{_version}
%else
%define version 1.0
%endif
%define release 1
%define prefix  /usr

%define mybuilddir %{_builddir}/%{name}-%{version}-root

Summary:        open source navigation scripting & testing utility written in Javascript
Name:           %{name}
Version:        %{version}
License:        BSD
Release:        %{release}
Packager:       Jan Schaumann <jschauma@etsy.com>
Group:          Utilities/Misc
Source:         %{name}-%{version}.tar.gz
BuildRoot:      /tmp/%{name}-%{version}-root

Requires:       phantomjs

%description
CasperJS is an open source navigation scripting & testing utility written
in Javascript and based on PhantomJS.  It eases the process of defining a
full navigation scenario and provides useful high-level functions, methods
& syntactic sugar for doing common tasks

%prep
%setup -q

%install
mkdir -p %{mybuilddir}%{prefix}/bin
mkdir -p %{mybuilddir}%{prefix}/share/%{name}/bin
mkdir -p %{mybuilddir}%{prefix}/share/%{name}/modules
mkdir -p %{mybuilddir}%{prefix}/share/%{name}/samples
mkdir -p %{mybuilddir}%{prefix}/share/%{name}/tests

cp bin/%{name} %{mybuilddir}%{prefix}/share/%{name}/bin/
ln -s %{prefix}/share/%{name}/bin/%{name} %{mybuilddir}%{prefix}/bin/%{name}
cp bin/bootstrap.js  %{mybuilddir}%{prefix}/share/%{name}/bin/
# Yes, this tool needs this file in the 'bin' directory.
cp bin/usage.txt %{mybuilddir}%{prefix}/share/%{name}/bin/
cp CHANGELOG.md %{mybuilddir}%{prefix}/share/%{name}/
cp CONTRIBUTING.md %{mybuilddir}%{prefix}/share/%{name}/
cp CONTRIBUTORS.md %{mybuilddir}%{prefix}/share/%{name}/
cp LICENSE.md %{mybuilddir}%{prefix}/share/%{name}/
cp README.md %{mybuilddir}%{prefix}/share/%{name}/
cp package.json %{mybuilddir}%{prefix}/share/%{name}/
cp -R modules/* %{mybuilddir}%{prefix}/share/%{name}/modules/
cp -R samples/* %{mybuilddir}%{prefix}/share/%{name}/samples/
cp -R tests/* %{mybuilddir}%{prefix}/share/%{name}/tests/

%files
%defattr(0444,root,root)
%attr(0555,root,root)%{prefix}/bin/%{name}
%attr(0555,root,root)%{prefix}/share/%{name}/bin/%{name}
%attr(0555,root,root)%{prefix}/share/%{name}/bin/bootstrap.js
%{prefix}/share/%{name}/bin/usage.txt
%{prefix}/share/%{name}/CHANGELOG.md
%{prefix}/share/%{name}/CONTRIBUTING.md
%{prefix}/share/%{name}/CONTRIBUTORS.md
%{prefix}/share/%{name}/LICENSE.md
%{prefix}/share/%{name}/README.md
%{prefix}/share/%{name}/package.json
%{prefix}/share/%{name}/modules/*
%{prefix}/share/%{name}/samples/*
%{prefix}/share/%{name}/tests/*

%changelog
* Fri Nov 15 2013 Yasuo Ohgaki <yohgaki@ohgaki.net>
- update spec for master and other branches

* Mon Dec 24 2012 Nicolas Perriault <nicolas@perriault.net>
- removed 'injector.js' module

* Mon Dec 10 2012 Jan Schaumann <jschauma@etsy.com>
- include 'tests'

* Mon Nov 26 2012 Jan Schaumann <jschauma@etsy.com>
- first rpm version
