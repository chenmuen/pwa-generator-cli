#!/usr/bin/env node
'use strict';
const program = require('commander');
const pwaCli = require('.');
const rootPath = __dirname;
const execPath = process.cwd();
let packageJson = require(rootPath + '/package.json');

program.version(packageJson.version)
	.usage('[options] [value ...]')
	.option('-c --config [value]', 'your config.json file')
	.option('-b --build [value]', 'your build file')
	.parse(process.argv);

pwaCli(program.config, program.build);
