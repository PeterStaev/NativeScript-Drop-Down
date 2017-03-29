module.exports = function (grunt) {
    var localConfig = {
        typeScriptSrc: [
            "**/*.ts",
            "!node_modules/**/*.*",
            "!demo/**/*.*",
            "!bin/**/*.*"
        ],
        typeScriptDeclarations: [
            "**/*.d.ts",
            "!references.d.ts",
            "!node_modules/**/*.*",
            "!demo/**/*.*",
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
        tslint: {
            build: {
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
            tsCompile: {
                cmd: "node ./node_modules/typescript/bin/tsc --project tsconfig.json --outDir " + localConfig.outDir
            },
            npm_publish: {
                cmd: "npm publish",
                cwd: localConfig.outDir
            }
        }
    });

    grunt.loadNpmTasks("grunt-tslint");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-exec");

    grunt.registerTask("build", [
        "tslint:build",
        "clean:build",
        "exec:tsCompile",
        "copy"
    ]);
    grunt.registerTask("publish", [
        "build",
        "exec:npm_publish"
    ]);
};