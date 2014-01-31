# CasperJS

>**Important note:** the `master` branch hosts the development version of CasperJS, which is now pretty stable and should be the right version to use if you ask me.
>
>Use the [`1.0` branch](https://github.com/n1k0/casperjs/tree/1.0) if you want to keep in sync with the stable old version, or [use tagged versions](https://github.com/n1k0/casperjs/tags).
>
>Currently, available documentation is:
>
>- **hosted on [docs.casperjs.org](http://docs.casperjs.org/) for the development branch**
>- hosted on [casperjs.org](http://casperjs.org/) for the 1.0 branch
>
>[Travis-CI](http://travis-ci.org/n1k0/casperjs) build status:
>
>- ![Build Status](https://travis-ci.org/n1k0/casperjs.png?branch=master) `master` branch
>- 1.0 tests unfortunately have to be run manually using the `casperjs selftest` command

CasperJS is a navigation scripting & testing utility for [PhantomJS](http://www.phantomjs.org/)
and [SlimerJS](http://slimerjs.org/). It eases the process of defining a full navigation
scenario and provides useful high-level functions, methods & syntaxic sugar for doing common
tasks such as:

- defining & ordering [navigation steps](http://docs.casperjs.org/en/latest/quickstart.html)
- [filling forms](http://docs.casperjs.org/en/latest/modules/casper.html#fill)
- [clicking links](http://docs.casperjs.org/en/latest/modules/casper.html#click)
- [capturing screenshots](http://docs.casperjs.org/en/latest/modules/casper.html#captureselector) of a page (or an area)
- [making assertions on remote DOM](http://docs.casperjs.org/en/latest/modules/tester.html)
- [logging](http://docs.casperjs.org/en/latest/logging.html) & [events](http://docs.casperjs.org/en/latest/events-filters.html)
- [downloading](http://docs.casperjs.org/en/latest/modules/casper.html#download) resources, even binary ones
- catching errors and react accordingly
- writing [functional test suites](http://docs.casperjs.org/en/latest/testing.html), exporting results as JUnit XML (xUnit)

Browse the [sample examples repository](https://github.com/n1k0/casperjs/tree/master/samples).
Don't hesitate to pull request for any cool example of yours as well!

**Read the [full documentation](http://docs.casperjs.org/) on casperjs documentation website.**

Subscribe to the [project mailing-list](https://groups.google.com/forum/#!forum/casperjs)

Follow the CasperJS project [on twitter](https://twitter.com/casperjs_org) and [Google+](https://plus.google.com/b/106641872690063476159/).

## Show me some code!

First [install CasperJS](http://docs.casperjs.org/en/latest/installation.html), we'll use 1.1 beta here.

Sample test to see if some dropdown can be opened:

```javascript
casper.test.begin('a twitter bootstrap dropdown can be opened', 2, function(test) {
    casper.start('http://getbootstrap.com/2.3.2/javascript.html#dropdowns', function() {
        test.assertExists('#navbar-example');
        this.click('#dropdowns .nav-pills .dropdown:last-of-type a.dropdown-toggle');
        this.waitUntilVisible('#dropdowns .nav-pills .open', function() {
            test.pass('Dropdown is open');
        });
    }).run(function() {
        test.done();
    });
});
```

Run the script:

![](http://cl.ly/image/271e2i403A0F/Capture%20d%E2%80%99%C3%A9cran%202013-01-20%20%C3%A0%2009.26.15.png)

##Support

Need help with getting CasperJS up and running? Got a time-consuming problem you want to get solved quickly?

Get <a href="http://codersclan.net/?repo_id=32">CasperJS support on CodersClan.</a>

<a href="http://codersclan.net/?repo_id=32"><img src="http://www.codersclan.net/gs_button/?repo_id=32" width="200"></a>
## Contributing

### Contributing code

Please read the [CONTRIBUTING.md](https://github.com/n1k0/casperjs/blob/master/CONTRIBUTING.md) file contents.

### Contributing documentation

CasperJS's documentation is written using the [Markdown format](http://daringfireball.net/projects/markdown/), and hosted on Github thanks to the [Github Pages Feature](http://pages.github.com/).

To view the source files on github, head to [the gh-pages branch](https://github.com/n1k0/casperjs/tree/gh-pages), and check the [documentation's README](https://github.com/n1k0/casperjs/tree/gh-pages#readme) for further instructions.

## Team

- Nicolas Perriault ([@n1k0](https://github.com/n1k0))
- Nick Currier ([@hexid](https://github.com/hexid))
- Laurent Jouanneau ([@laurentj](https://github.com/laurentj))
- Mickaël Andrieu ([@mickaelandrieu](https://github.com/mickaelandrieu))
- Matt DuVall ([@mduvall](https://github.com/mduvall))

## License

MIT
