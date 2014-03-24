define(['../dist/localforage'], function(lf) {
    lf.ready(function() {
        var key = 'STORE_KEY';
        var value = 'What we save offline';
        var UNKNOWN_KEY = 'unknown_key';

        lf.setItem(key, value, function() {
            console.log('SAVING', value);

            lf.getItem(key, function(readValue) {
                console.log('READING', readValue);
            });
        });

        // Promises code.
        lf.setItem('promise', 'ring', function() {
            lf.getItem('promise').then(function(readValue) {
                console.log('YOU PROMISED!', readValue);
            });
        });

        // Since this key hasn't been set yet, we'll get a null value
        lf.getItem(UNKNOWN_KEY, function(readValue) {
            console.log('FAILED READING', UNKNOWN_KEY, readValue);
        });
    });

    lf.ready().then(function() {
        console.log("You can use ready from Promises too");
    })
});
