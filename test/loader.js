(function () {
    "use strict";
    var scripts,
        path,
        len,
        i,
        writeScript,
        scriptsToLoad,
        prefix;

    // We need this bit to make sure that all scripts are taken from the same location
    // as the loader script
    scripts = document.getElementsByTagName('script');
    i = scripts.length;
    while (i--) {
        if (scripts[i].src.indexOf('loader.js') !== -1) {
            path = scripts[i].src.substring(0, scripts[i].src.lastIndexOf('/') + 1);
            i = 0;
        }
    }

    scriptsToLoad = ['../lib/mockery.js', 'http://code.jquery.com/qunit/qunit-git.js', 'setup.js',
        'tests.js'];
    len = scriptsToLoad.length;
    for (i = 0; i < len; i++) {
        if (scriptsToLoad[i].indexOf('http') === -1) {
            prefix = path;
        } else {
            prefix = '';
        }
        document.write('<script type="text/javascript" src="' + prefix + scriptsToLoad[i] + '"></' + 'script>');
    }
}());
