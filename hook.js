var path = require('path'), child_process = require('child_process'), util = require('util');
process.argv.push('--verbose');
var args = process.argv.slice(2);
if (args.length >= 1) {
    switch (args[0]) {
        case 'i' :
        case 'isntall' : //copied from npm.js
        case 'install' :
            listenForInstallComplete(process.cwd());
    }
}

function listenForInstallComplete(dir) {
    var npmJs = path.join(path.dirname(require.main.filename), '../lib/npm.js');
    var npm = require(npmJs);
    if (npm.command === 'install') {
        var pkg = require(path.join(dir, 'package.json'));
        oneProjectsDependencies(dir, pkg);
    }
}

function oneProjectsDependencies(dir, pkg) {
    if (pkg['java'] && pkg.java['dependencies']) {
        for (var i = 0; i < pkg.java.dependencies.length; i++) {
            var dep = pkg.java.dependencies[i];
            if (typeof dep === 'string') {
                var split = dep.split(':');
                var nue = {
                    groupId: split[0],
                    artifactId: split[1],
                    version: split[2]
                };
                dep = pkg.java.dependencies[i] = nue;
            }
            if (typeof dep['version'] === 'undefined') {
                process.stderr.write('Missing version from dependency ' + util.inspect(dep) + ' \n');
                process.exit(121);
            }
            if (typeof dep['artifactId'] === 'undefined') {
                process.stderr.write('Missing artifactId from dependency ' + util.inspect(dep) + ' \n');
                process.exit(122);
            }
            if (typeof dep['groupId'] === 'undefined') {
                process.stderr.write('Missing groupId from dependency ' + util.inspect(dep) + ' \n');
                process.exit(121);
            }
        }
        var copied = copy(pkg.java.dependencies);
        ensureDependencies(pkg, dir, copied);
    }

}

function ensureDependencies(pkg, dir, deps) {
    console.log('Install Java Dependencies');
    var repositories = pkg.repositories || ['http://repo1.maven.org/maven2'];
    function installOneDep() {
        if (deps.length === 0) {
            return console.log('Java dependencies installed');
        }
        var dep = deps.pop();
        var repos = copy(repositories);
        var found = false;
        console.log('Install Dependency: \n' + util.inspect(dep));
        function tryOneRepo() {
            if (!found && repos.length === 0) {
                process.stderr.write('Could not download ' + dep.groupId + ':' + dep.artifactId + ':' + dep.version + ' from any of ' + util.inspect(repositories) + '\n');
                process.exit(124);
            }
            if (found || repos.length === 0) {
                return setImmediate(installOneDep);
            }
            var repo = repos.pop();
            var cmdline = 'mvn org.apache.maven.plugins:maven-dependency-plugin:2.1:get -DrepoUrl='
                    + repo + ' -Dartifact=' + dep.groupId + ':'
                    + dep.artifactId + ':' + dep.version;

            var proc = child_process.exec(cmdline, {cwd: dir, encoding: 'utf8'}, function (err, out, stderr) {
                if (!err) {
                    found = true;
                }
                setImmediate(tryOneRepo);
            });
            proc.stdout.pipe(process.stdout);
            proc.stderr.pipe(process.stderr);
        }
        tryOneRepo();
    }
    installOneDep();
}

function copy(arr) {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
        result.push(arr[i]);
    }
    return result;
}
