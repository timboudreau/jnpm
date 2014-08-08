JNPM
==============

A hook for use with [AvatarJS](https://avatar-js.java.net/) to enable `npm install`
to download Java libraries.

### Purpose

AvatarJS supports running NodeJS code inside a Java VM.  Naturally people will
want to use Java libraries as well.  In order to do that, there needs to be a 
way for a NodeJS project (a normal one with a `package.json`) to specify what
libraries it uses.

So, the ideal way is to hook into the machinery that `npm`, the Node package 
manager uses to download libraries - that is part of the normal NodeJS workflow.

`package.json` files are extensible - Node doesn't care if we add some additional
properties to it.  So, we add the following:

 * `java`
    * `repositories` - array of string URLs to repositories to search
    * `dependencies` - array of either
        * A string designation such as Maven uses on the command-line, e.g. `$GROUP_ID:$ARTIFACT_ID:$VERSION`, or
        * A hash of `{ groupId : '...', artifactId : '...', version : '...' }

For example:
        "java" : {
            "dependencies" : ["com.mastfrog:giulius:1.4.17"],
            "repositories" : ["http://timboudreau.com/builds/plugin/repository/everything/"]
        }

My purpose in writing it is to extend the NetBeans NodeJS plugin able to easily
run NodeJS applications in AvatarJS when the project uses Java libraries.  And
doing it through npm, utilizing the native project metadata of a NodeJS project
is the right way to do it (there is a plugin already that will run AvatarJS stuff
with Ant, but the projects aren't set up well for native NodeJS and using Ant to
run NodeJS code is just weird).

### How It Works

Run `node jnpm.js setup` - it will edit or create your `~/.npmjs`, setting

        onload-script=$PATH_TO_HERE/hook

Once you do that, whenever npm runs, after it loads, it will `require` the hook script.

The hook script will then figure out when you're running `npm install`, find the
Java dependencies, and invoke your local copy of Maven to download them.

### What It's Supposed To Do

 * Recursively download all dependencies of all Java libraries
 * Notice if any Node modules used by the current project also have Java
dependencies and get those too, just as npm does

### What It Actually Does

 * Downloads direct dependencies only

### What It Does Not Do

You still need to run AvatarJS, and pass the right things on the classpath.
Probably some provision can be made for generating a launch script down the 
road.

### Status

Very rough draft at this point.  In particular, pending 
[this enhancement request] (https://github.com/npm/npm/issues/5896) there is no
way to detect when npm has **finished** downloading dependencies

### Potential Problems

If you delete the hook script, you need to delete the `onload-script` line from
`.npmrc` in your home directory, or all invocations of `npm` will crash.
