/// <binding BeforeBuild='build' />
/*
This file in the main entry point for defining grunt tasks and using grunt plugins.
Click here to learn more. http://go.microsoft.com/fwlink/?LinkID=513275&clcid=0x409
*/
module.exports = function (grunt)
{
    var localConfig = {
        typeScriptSrc: [
            "**/*.ts",
            "!node_modules/**/*.*",
            "!bin/**/*.*",
            "!_references.ts"
        ],
        typeScriptDeclarations: [
            "**/*.d.ts",
            "!node_modules/**/*.*",
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
                    noLib: true,
                    outDir: "dist",
                    isolatedModules: true
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
                    process: function (content, srcPath)
                    {
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
                    process: function (content, srcPath)
                    {
                        return content.substring(content.indexOf("\n") + 1)
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-clean");

    grunt.registerTask("build", [
        "clean:build",
        "ts:build",
        "copy"
    ]);
};