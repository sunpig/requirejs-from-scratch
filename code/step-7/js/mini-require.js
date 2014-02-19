// mini-require.js

var moduleStore = {};

function define(arg1, arg2, arg3) {
	debugger;
	if (typeof(arg1)==='string') {
		var moduleName = arg1;
		_require(arg2, function(deps){
			moduleStore[arg1] = function(deps){
				return arg3.call(deps);
			}
		});
	} else {
		_require(arg1, arg2);
	}
}

function _define(moduleName, moduleFactory) {
	moduleStore[moduleName] = moduleFactory;
}

function _require(moduleNames, callback) {
	var availableModuleNames = [];
	moduleNames.forEach(function(moduleName){
		if (moduleStore[moduleName]) {
			availableModuleNames.push(moduleName);
		} else {
			var moduleScript;
			var moduleScriptSearch = document.querySelectorAll('[data-module-name=' + moduleName + ']');
			if (moduleScriptSearch.length) {
				moduleScript = moduleScriptSearch[0];
				moduleScript.addEventListener("load", function(){
					define(moduleNames, callback);
				});
			} else {
				moduleScript = document.createElement('script');
				moduleScript.src = 'js/' + moduleName + '.js';
				moduleScript.setAttribute('data-module-name', moduleName);
				moduleScript.addEventListener("load", function(){
					define(moduleNames, callback);
				});
				document.body.appendChild(moduleScript);
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

