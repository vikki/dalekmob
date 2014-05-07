var path = require('path');
var Q = require('q');
var uuid = require('dalekjs/lib/dalek/uuid');
var browsermob = require('browsermob-proxy');
var chai = require("chai");

console.log("whoooo dalekmob");

function addGetRequestedUrls(test) {
    test.driver.getRequestedUrls = function(hash) {
        test.driver.actionQueue.push(function() {
            var deferred = Q.defer();

            test.driver.proxy.getHAR(test.driver.proxyPort, function(err, resp) {
                var urls = JSON.parse(resp).log.entries.map(function(e) {return e.request.url});
                deferred.resolve();
                test.driver.events.emit('driver:message', {key: 'getRequestedUrls', hash: hash, value: urls});
            });

            //deferred.resolve(); // resolve late to preserve order of test commands
            return deferred.promise;
        });
    }

    test.assert.__proto__._containsMatch = function _containsMatch(collection, matcher) {
        var matches = collection.filter(function(entry) {
            return entry.indexOf(matcher) !== -1;
        });

        return matches && matches.length > 0;
    };

    test.assert.__proto__.requestMatching = function(expectedValue) {
        var hash = uuid();
        var expected = expectedValue;
        var message = "checking for request matching " + expectedValue;

        // want to use test.assert._contains fo realsies but _equals is a good checker for process
        var cb = test.assert._generateCallbackAssertion.call(test.assert, 'getRequestedUrls', 'getRequestedUrls', test.assert._containsMatch, hash, {expected: expected, message: message});
        cb = cb.bind(test);

        test.assert.test.actionPromiseQueue.push(function () {
            console.log("running action ");
            var deferredAction = Q.defer();
            var opts = [hash];
            test.driver.getRequestedUrls.apply(this.test.driver, opts);
            deferredAction.resolve();

            test.driver.events.on('driver:message', cb);

            return deferredAction.promise;
        }.bind(test.assert));

        return test.assert.test;
    };
}

function setupBrowsermob(ctx, cb) {
    var nightwatchClient = ctx;
    nightwatchClient.driver.proxy = new browsermob.Proxy({ host: 'localhost', port: 8080, selHost: 'localhost', selPort: ctx.driver.webdriverClient.opts.port  });

    nightwatchClient.driver.proxy.start(function(err, data) {
        var proxyUrl = 'localhost' + ':' +  data.port;
        //console.log("proxy started on" + proxyUrl);

        // REALLY NEED TO FAIL ON ERROR HERE!!!!!

        // No idea why this one needs a proxyType and the other one doesn't
        nightwatchClient.driver.desiredCapabilities.proxy = { httpProxy: proxyUrl, proxyType: 'MANUAL' };
        nightwatchClient.driver.proxyPort = data.port;

        // this should be an action, but baby steps
        nightwatchClient.driver.proxy.startHAR(nightwatchClient.driver.proxyPort, "yello", function() {
            if (typeof cb === "function") {
                cb();
            }
        });

    });
}

module.exports = {
    addGetRequestedUrls: addGetRequestedUrls,
    setupBrowsermob: setupBrowsermob
};