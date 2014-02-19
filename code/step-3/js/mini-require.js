// mini-require.js

var moduleStore = {};

function define(moduleName, moduleFactory) {
	moduleStore[moduleName] = moduleFactory;
}

function require(moduleName, callback) {
	var moduleFactory = moduleStore[moduleName];
	if (moduleFactory) {
		callback(moduleFactory());
	} else {
		var scriptElement = document.createElement('script');
		scriptElement.src = 'js/' + moduleName + '.js';
		scriptElement.onload = function(){
			var moduleFactory = moduleStore[moduleName];
			callback(moduleFactory());
		}
		document.body.appendChild(scriptElement);
	}
}

