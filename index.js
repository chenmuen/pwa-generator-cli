'use strict';
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const swPrecache = require('sw-precache');
const _ = require('underscore');
const underscoreDeepExtend = require('underscore-deep-extend');

const rootPath = __dirname;
const execPath = process.cwd();
let defaultConfig = require(`${rootPath}/default-config.json`);
let customerConfig;
let finalConfig;

module.exports = (cmdConfigFile, cmdBuildFile) => {
	// underscore添加deep extend方法
	_.mixin({deepExtend: underscoreDeepExtend(_)});

	// 合并默认配置与用户配置
	let customerConfigPath = cmdConfigFile ? cmdConfigFile : `${execPath}/pwa-config.json`;
	if (fs.existsSync(customerConfigPath)) {
		customerConfig = require(`${execPath}/pwa-config.json`);
		finalConfig = _.deepExtend(defaultConfig, customerConfig);
	} else {
		finalConfig = defaultConfig;
	}

	if(cmdBuildFile) {
		finalConfig.buildDir = cmdBuildFile;
	}

	// 处理sw-precache路径问题
	finalConfig.swPrecache.staticFileGlobs && finalConfig.swPrecache.staticFileGlobs.forEach((data, index)=>{
		finalConfig.swPrecache.staticFileGlobs[index] = `${execPath}/${data}`;
	});

	if(finalConfig.swPrecache.stripPrefix) {
		finalConfig.swPrecache.stripPrefix = `${execPath}/${finalConfig.swPrecache.stripPrefix}`;
	} else {
		finalConfig.swPrecache.stripPrefix = `${execPath}/`;
	}

	// 写入文件
	fs.readdir(execPath, function(err, files) {
		if (err) {
			console.log('error:\n' + err);
			return;
		}

		files.forEach(function(file) {
			if (file === finalConfig.buildDir ) {
				createManifest(file);
				createServiceWorkder(file);
				createSWRegister(file);
			}
		});
	});
}

function createManifest(file) {
	fs.open(`${execPath}/${file}/manifest.json`, 'w+', (err, fd) => {
		let tempTpl = fs.readFileSync(`${rootPath}/templates/manifest.tmpl.json`, 'utf-8');
		let content = ejs.render(tempTpl, finalConfig.manifest);
		fs.writeFile(fd, content, (err) => {
			if (!err) {
				console.log('create manifest.json successfully');
			}
		});
	})
}

function createServiceWorkder(file) {
	swPrecache.write(`${execPath}/${file}/service-worker.js`, finalConfig.swPrecache , () => {
		console.log('create service-worker.js successfully');
	});
}

function createSWRegister(file) {
	fs.open(`${execPath}/${file}/sw-register.js`, 'w+', (err, fd) => {
		let tempTpl = fs.readFileSync(`${rootPath}/templates/sw-register.tmpl.js`, 'utf-8');
		let content = ejs.render(tempTpl, {'swPos': finalConfig.swRegisterLocation});
		fs.writeFile(fd, content, (err) => {
			if (!err) {
				console.log('create sw-register.js successfully');
			}
		});
	})
}
