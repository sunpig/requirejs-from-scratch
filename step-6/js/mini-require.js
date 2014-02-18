// mini-require.js

var _moduleStore = {};
var _todos = [];

function define(moduleName, dependencies, moduleFactory) {
	require(dependencies, function(){
		_moduleStore[moduleName] = moduleFactory;
	})
}

function require(dependencies, callback) {
	_todos.push({
		dependencies: dependencies,
		callback: callback,
		resolved: false
	})
	dependencies.forEach(function(moduleName){
		if (!document.querySelectorAll('[data-module-name=' + moduleName + ']').length) {
			var scriptElement = document.createElement('script');
			scriptElement.src = 'js/' + moduleName + '.js';
			scriptElement.setAttribute('data-module-name', moduleName);
			scriptElement.addEventListener("load", function(){
				setTimeout(_resolve, 0);
			});
			document.body.appendChild(scriptElement);
		}
	});
	_resolve();
}

function _resolve(){
	_todos.forEach(function(todo){
		if (!todo.resolved) {
			var dependencies = todo.dependencies;
			var availableDependencies = dependencies.filter(function(moduleName) {
				return !!(_moduleStore[moduleName]);
			});
			if (availableDependencies.length === dependencies.length) {
				modules = dependencies.map(function(moduleName){
					return _moduleStore[moduleName].apply(this, modules);
				});
				todo.callback.apply(this, modules);
				todo.resolved = true;
			}
		}
	});
}

