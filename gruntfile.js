module.exports = function (grunt) {
    var localConfig = {
        typeScriptSrc: [
            "**/*.ts",
            "!node_modules/**/*.*",
            "!sample/**/*.*",
            "!bin/**/*.*"
        ],
        typeScriptDeclarations: [
            "**/*.d.ts",
            "!references.d.ts",
            "!node_modules/**/*.*",
            "!sample/**/*.*",
            "!bin/**/*.*"
        ],
        outDir: "bin/dist/"
    }

    grunt.initConfig({
        clean: {
            build: {
                src: [localConfig.outDir]
            }
        },
        ts: {
            build: {
                src: localConfig.typeScriptSrc,
                outDir: localConfig.outDir,
                options: {
                    target: "es5",
                    module: "commonjs",
                    declaration: false,
                    noImplicitAny: false,
                    removeComments: true,
                    sourceMap: false,
                    noLib: false,
                    outDir: "dist",
                    isolatedModules: true
                }
            }
        },
        tslint:
        {
            build:
            {
                src: localConfig.typeScriptSrc,
                options: {
                    configuration: grunt.file.readJSON("./tslint.json")
                }
            }
        },
        copy: {
            declarations: {
                src: localConfig.typeScriptDeclarations,
                dest: localConfig.outDir
            },
            packageConfig: {
                src: "package.json",
                dest: localConfig.outDir,
                options: {
                    process: function (content, srcPath) {
                        var contentAsObject = JSON.parse(content);
                        contentAsObject.devDependencies = undefined;
                        return JSON.stringify(contentAsObject, null, "\t");
                    }
                }
            },
            readme: {
                src: "README.md",
                dest: localConfig.outDir,
                options: {
                    process: function (content, srcPath) {
                        return content.substring(content.indexOf("\n") + 1)
                    }
                }
            }
        },
        exec: {
            npm_publish: {
                cmd: "npm publish",
                cwd: localConfig.outDir
            }
        }
    });

    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-tslint");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-exec");

    grunt.registerTask("build", [
        "tslint:build",
        "clean:build",
        "ts:build",
        "copy"
    ]);
    grunt.registerTask("publish", [
        "build",
        "exec:npm_publish"
    ]);
};