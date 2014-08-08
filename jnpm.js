var child_process = require('child_process'), fs = require('fs'), path = require('path');

var args = process.argv.slice(2);

function printUsageAndExit() {
    process.stderr.write('Installs Java dependencies declared in package.json, or installs a hook to do that automatically when `npm install` is run\n\n');
    process.stderr.write('Usage: jnpm [setup | install]\n');
    process.stderr.write('  setup - configure the ~/.npmrc for this user to hook calls to npm install\n');
    process.stderr.write('  install - configure the ~/.npmrc for this user to hook calls to npm install\n');
    process.exit(1);
}

if (args.length === 0) {
    printUsageAndExit();
}

switch (args[0]) {
    case 'setup' :
        doSetup();
        break;
    case 'install' :
        require('./hook');
        break;
    default :
        process.stderr.write('Unknown argument: ' + args[0]);
        printUsageAndExit();
}

function ifNoErr(err, cb) {
    if (err) {
        process.stderr.write(err + '');
        process.exit(2);
    }
    cb();
}

function doSetup() {
    var file = path.join(getUserHome(), '.npmrc');
    console.log('Will write ' + file);

    function modifyFile(body) {
        var hook = path.join(path.dirname(module.filename), 'hook');
        var scriptLine = 'onload-script=' + hook + '\n';
        if (body) {
            console.log('BODY ' + body)
            var rex = /onload\-script\=.*/g;
            if (rex.test(body)) {
                console.log('Replacing line')
                body = body.replace(rex, scriptLine);
            } else {
                body = body + '\n' + scriptLine;
                console.log('Appending line')
            }
        } else {
            console.log('Creating new file');
            body = scriptLine;
        }
        fs.writeFile(file, body, {encoding: 'utf8'}, function (err) {
            ifNoErr(err, function () {
                console.log('Wrote ' + file);
            });
        })
    }

    fs.exists(file, function (exists) {
        if (exists) {
            console.log('Modifying ' + file);
            fs.readFile(file, {encoding: 'utf8'}, function (err, body) {
                ifNoErr(err, function () {
                    modifyFile(body);
                });
            })
        } else {
            console.log('Creating ' + file)
            modifyFile();
        }
    });
}

function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}
