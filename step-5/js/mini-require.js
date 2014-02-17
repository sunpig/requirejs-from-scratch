// mini-require.js

var moduleStore = {};

function define(moduleName, moduleFactory) {
	moduleStore[moduleName] = moduleFactory;
}

function require(moduleNames, callback) {
	var availableModuleNames = [];
	moduleNames.forEach(function(moduleName){
		if (moduleStore[moduleName]) {
			availableModuleNames.push(moduleName);
		} else {
			if (!document.querySelectorAll('[data-module-name=' + moduleName + ']').length) {
				var scriptElement = document.createElement('script');
				scriptElement.src = 'js/' + moduleName + '.js';
				scriptElement.setAttribute('data-module-name', moduleName);
				scriptElement.onload = function(){
					require(moduleNames, callback);
				}
				document.body.appendChild(scriptElement);
			}
		}
	});

	if (availableModuleNames.length === moduleNames.length) {
		modules = moduleNames.map(function(moduleName){
			return moduleStore[moduleName]();
		})
		callback.apply(this, modules);
	}
}

