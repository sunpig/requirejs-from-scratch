// mini-require.js

var moduleStore = {};

function define(moduleName, moduleFactory) {
	moduleStore[moduleName] = moduleFactory;
}

function require(moduleName) {
	var moduleFactory = moduleStore[moduleName];
	if (!moduleFactory) {
		var request = new XMLHttpRequest();
		request.open('GET', 'js/' + moduleName + '.js', false);  // synchronous
		request.send(null);
		if (request.status === 200) {
			eval(request.responseText); // Oh my
			moduleFactory = moduleStore[moduleName];
		}
	}
	return moduleFactory();
}

