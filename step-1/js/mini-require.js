// mini-require.js

var moduleStore = {};

function define(moduleName, moduleFactory) {
	moduleStore[moduleName] = moduleFactory;
}

function require(moduleName) {
	var moduleFactory = moduleStore[moduleName];
	return moduleFactory();
}

