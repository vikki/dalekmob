To get this to work :

You will need :

	- [browsermob-proxy](http://bmp.lightbody.net/)
	- [selenium server](http://docs.seleniumhq.org/download/)

Then you'll need to start both. index.js is expecting selenium to be running on port 4444 and browsermob-proxy to be running on 8080, which is the default right now, but you never know!

	$ java -jar ./selenium-server-standalone-<VERSION>.jar 

	$ sh browsermob-proxy

This **only works with my [fork](https://github.com/vikki/dalek) of dalek** [hopefully for now] because it relies on async setup methods - it should work exactly the same as the one from npm, but with ctx and async setup functions.

You'll also need to install dalekmob as a (dev)dependency in the project where your dalek tests live. 

	npm install git+ssh://git@github.com:vikki/dalekmob.git --save-dev

In any test where you wish to use dalekmob, require dalekmob.

This will expose 2 functions: 

- dalekmob.setupBrowsermob() - wraps the intern suite setup to setup the proxy before the session is created, thus allowing tests to go through the proxy - call this from your test's module definition
- dalekmob.addGetHAR(remote);  - adds a getHAR function to the remote, which can be used to verify requests and anything else the HAR provides in your test.

You can then write tests that look a bit like this (actual proper readme to follow once this is a grown up project): 

```
	var dalekMob = require('dalekMob');

	module.exports = {
	    options: {
	        // only my fork has async(done) and ctx args passed in
	        setup: function(ctx, done) {
	            dalekMob.setupBrowsermob(ctx, done);
	        }
	    },
		'Page title exists': function (test) {
			var url = 'http://www.google.com';

	        dalekMob.addGetRequestedUrls(test);

	        test
	            .open(url)
	            .assert.exists('body')
	            .assert.requestMatching("google.com")
	            .done();
		}
	};

```