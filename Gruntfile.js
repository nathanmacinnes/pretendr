module.exports = (grunt) => {

  // Project configuration
  grunt.initConfig({
    pkg : grunt.file.readJSON("package.json"),
    mochaTest : {
      spec : {
        options : {
          reporter : "spec"
        },
        src : ["test/test-*.js"]
      },
      examples : {
        options : {
          reporter : "spec"
        },
        src : ["examples/*.js"]
      }
    },
    jshint : {
      core : ["Gruntfile.js"],
      spec : ["test/*.js", "examples/*.js"],
      lib : ["lib/*.js"],
      examples : ["examples/*.js"],
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
      examples : {
        src : "examples/*.js"
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
      spec : {
        files : ["test/*.js"],
        tasks : ["test:spec", "jshint:spec", "jscs:spec"]
      },
      examples : {
        files : ["examples/*.js"],
        tasks : ["examples"]
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
  grunt.registerTask("examples",
    ["mochaTest:examples", "jshint:examples", "jscs:examples"]);
  grunt.registerTask("spec",
    ["mochaTest:spec", "jshint:spec", "jscs:spec"]);

  grunt.registerTask("default", ["test", "lint"]);

  grunt.loadNpmTasks("grunt-contrib-watch");
};
