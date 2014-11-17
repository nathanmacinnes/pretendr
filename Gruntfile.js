module.exports = function (grunt) {

    // Project configuration
    grunt.initConfig({
        pkg : grunt.file.readJSON("package.json"),
        mochaTest : {
            test : {
                options : {
                    reporter : "spec"
                },
                src : ["test/*.js"]
            }
        },
        jshint : {
            core : ["Gruntfile.js"],
            test : ["test/*.js"],
            lib : ["lib/*.js"],
            options : {
                jshintrc : true
            }
        },
        jscs : {
            lib : {
                src : "lib/*.js",
            },
            test : {
                src : "test/*.js"
            },
            misc : {
                src : ["Gruntfile.js"]
            },
            options : {
                config : ".jscsrc"
            }
        },
        watch : {
            lib : {
                files : ["lib/*.js"],
                tasks : ["test", "jshint:lib", "jscs:lib"]
            },
            test : {
                files : ["test/*.js"],
                tasks : ["test", "jshint:test", "jscs:test"]
            },
            grunt : {
                files : ["Gruntfile.js"],
                tasks : ["jshint:core"]
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-mocha-test");
    grunt.loadNpmTasks("grunt-jscs");

    grunt.registerTask("test", "mochaTest");
    grunt.registerTask("lint", ["jshint", "jscs"]);

    grunt.registerTask("default", ["test", "lint"]);

    grunt.loadNpmTasks("grunt-contrib-watch");
};
