# RequireJS from scratch

Managing client-side JavaScript dependencies isn't a great experience. Other languages have it easy:

Python:

```python
from django.core.urlresolvers import reverse
from django.db import models
from django.utils import timezone
```

Ruby:

```ruby
require 'digest/md5'
require 'colorize'
require 'etl/extract_data'
```

Client-side JavaScript has this bundle of hot love in store for you:

```html
<script src="/js/lib/ace/src-min/ace.js"></script>
<script src="/js/lib/jquery-plugins/jquery.csv.js"></script>
<script src="/js/models/QueryParameterModel.js"></script>
<script src="/js/collections/QueryParametersCollection.js"></script>
<script src="/js/models/QueryModel"></script>
<script src="/js/views/ExecuteQueryView.js"></script>
<script src="/js/views/AceEditorView.js"></script>
<script src="/js/views/QueryActionsView.js"></script>
<script src="/js/views/LoggedQueryApp.js"></script>
<script>
	// Initialize the JS app
	void (new window.FD.LoggedQueryApp({
		...
	})).render();
</script>
```

or this:

![JS](http://sunpig.com/martin/code/2014/requirejs-preso/img/js-explicit-dependency-order.png)

<!--
![JS](http://sunpig.com/martin/code/2014/requirejs-preso/img/rainbow-vomit.gif)
-->

It works, but it's fragile. The order of script inclusion is significant, but it isn't *explicit* in the JS code. Deleting and refactoring code is hard, because you have to spend a lot of time manually tracing dependencies.

NodeJS has a nice [module system](http://nodejs.org/api/modules.html). Modules are files. To make the objects in a file available to a `require` call, you export them:

```node
// Brain.js
var Brain = function() {
	console.log('braaaaain');
}
module.exports = Brain;
```

You can then use a `require` call to use the module:

```node
// gimme-brain.js
var Brain = require('./Brain');
var myBrain = new Brain();
```

It would be nice if we could do something similar in client-side code. Let's take a small (theoretical) app, and see what it would take.

## Baseline (step 0)

Here's our starting point:

```html
<html>
	<head></head>
	<body><h1>App</h1></body>
	<script src="js/Brain.js"></script>
	<script src="js/Kitty.js"></script>
	<script src="js/Dragon.js"></script>
	<script src="js/Map.js"></script>
	<script src="js/main.js"></script>
</html>
```

`Dragon.js` defines a Dragon constructor:

```js
// Dragon.js
var Dragon = function(){
	console.log('A new dragon');
}
window.app = window.app || {};
window.app.Dragon = Dragon;
```

`main.js` instantiates a few objects:

```js
// main.js
var app = window.app;
var dragon = new app.Dragon();
var kitty = new app.Kitty();
var map = new app.Map();
```

In this baseline version, `window.app` serves as a namespaced module store. Every class gets attached to the window.app module (e.g. `window.app.Dragon = Dragon;`). When you want to use a class, you go to `window.app` again to get it.

## Step 1

If we wrap the `window.app` with a couple of functions, we can start to do some interesting things. Here are a couple of very simple `define` and `require` functions:

```js
// mini-require.js

var moduleStore = {};

function define(moduleName, moduleFactory) {
	moduleStore[moduleName] = moduleFactory;
}

function require(moduleName) {
	var moduleFactory = moduleStore[moduleName];
	return moduleFactory();
}
```

The `define` function takes two parameters. `moduleName` is just the name of the module, e.g. "Dragon". The second parameter is a *function*, and is a factory for the module in question. The factory function gets stored in the global object `moduleStore`, under the `moduleName` key.

When you want to use the module, you call the `require` function with the module name. This will look up the module's factory function, execute it, and pass you back the result.

(So we are still using a global variable, but it's called `moduleStore` now instead of `app`.)

The index.html page uses the `mini-require.js` script:

```html
<html>
	<head></head>
	<body><h1>App</h1></body>
	<script src="js/mini-require.js"></script>
	<script src="js/Brain.js"></script>
	<script src="js/Kitty.js"></script>
	<script src="js/Dragon.js"></script>
	<script src="js/Map.js"></script>
	<script src="js/main.js"></script>
</html>
```

Here's what the Dragon module looks like now. We use the `define` function to define a factory function for the Dragon module:

```js
// Dragon.js
define('Dragon', function(){

	var Dragon = function(){
		console.log('A new dragon (1)');
	}

	return Dragon;

});
```

Then, in `main.js` we can use `require` to get references to the factory functions for the modules, and create some objects with them:

```js
// main.js
var Dragon = require('Dragon');
var Kitty = require('Kitty');
var Map = require('Map');

var dragon = new Dragon();
var kitty = new Kitty();
var map = new Map();

var Brain = require('Brain');
```

This doesn't look too different. We still have to manually include all of our scripts in the HTML file. In the module definitions we've swapped one boilerplate style for another. `main.js` has got bigger. But the refactoring has some interesting properties.

By wrapping the module definitions in factory functions, the module code is parsed, *but not executed* when the file is downloaded. The factory function is only executed when you make the `require` call.

For example, let's say that the Brain has some code outside of its constructor function, but inside the factory function:

```js
// Brain.js
define('Brain', function(){

	console.log('Before brain');

	var Brain = function(){
		console.log('A new brain (1)');
		var brain = document.createElement('img');
		brain.src = "img/brain.svg";
		document.body.appendChild(brain);
	}

	return Brain;

});
```

The pattern of putting all modules inside factory functions means that the order of the `<script>` tags doesn't matter -- so long as they are included before `main.js` start doing its business.

However, we still have to write those script inclusions manually. We still need to know which modules will be used by `main.js`, all the way down the dependency chain.

## Step 2

Where we would like to be is here:

```html
<html>
	<head></head>
	<body><h1>App</h1></body>
	<script src="js/mini-require.js"></script>
	<script src="js/main.js"></script>
</html>
```

We want the `require` function to do all the hard work for us. When you ask for a module, we want to get it immediately if it has already been loaded. If it hasn't been loaded yet, we want the function to go out and get it, and hand it over when it is available:

![JS](http://sunpig.com/martin/code/2014/requirejs-preso/img/step-2-load-remote.png)

Here's how we could rewrite `mini-require.js` to support this:

```js
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
```

We don't even have to change anything in `main.js` for this to work:

```js
// main.js
var Dragon = require('Dragon');
var Kitty = require('Kitty');
var Map = require('Map');

var dragon = new Dragon();
var kitty = new Kitty();
var map = new Map();

var Brain = require('Brain');
```

Yay! Except...

1. Nobody likes eval. 
2. It's synchronous. Each time a module is fetched, your code pauses.
3. Cross-domain issues of XHR

<!--
![JS](http://sunpig.com/martin/code/2014/requirejs-preso/img/grumpy-cat-01.jpg)
-->

## Step 3

You can't work around the synchronousness by loading code through actual `<script>` tags, because browsers do their utter fuckmost to load external resources asynchronously. Supporting async involves making more drastic changes to the `require` function:

![JS](http://sunpig.com/martin/code/2014/requirejs-preso/img/step-3-mini-require.png)

The `require` function now takes a callback, and loads modules using script tags. When the module is available, the callback is invoked, with the output of the module definition function as a parameter. However, `main.js` now looks like this:

![JS](http://sunpig.com/martin/code/2014/requirejs-preso/img/step-3-main.1.png)

![JS](http://sunpig.com/martin/code/2014/requirejs-preso/img/my-eyes.jpg)

## Step 4

Don't despair. We can change `require` to take an array of module names, so we can batch up our module requirements:

![JS](http://sunpig.com/martin/code/2014/requirejs-preso/img/step-4-mini-require.png)

So instead of nested `require` calls, we now call `require` with an array of module names and a callback that is invoked with the modules as arguments:

![JS](http://sunpig.com/martin/code/2014/requirejs-preso/img/step-4-main.1.png)

A couple of things to note here:

1. The *order* in which the modules are loaded from the server (by script tag insertion) is not guaranteed. However, at the point where the module definition functions are all *invoked*, and passed into our own code, they *are* guaranteed to be available.
2. The "Brain" module is last in the array of dependencies, but it is not actually used in our own code. Its definition function will run, though, and it  will be passed as an argument into our function wrapper. We just don't consume it.

![JS](http://sunpig.com/martin/code/2014/requirejs-preso/img/joey-shrug.gif)

## Step 5

Let's have another look at the code we use for defining modules:

![JS](http://sunpig.com/martin/code/2014/requirejs-preso/img/step-1-dragon.png)

Dragons have brains. So we need to add some code here to reference the brain module:

![JS](http://sunpig.com/martin/code/2014/requirejs-preso/img/step-5-dragon.png)

Hmm, that's not great. We know at the start of the dragon definition that we're going to want to use the Brain module. So maybe we could use the same technique as with `require` to specify our dependencies for the whole module, like this:

![JS](http://sunpig.com/martin/code/2014/requirejs-preso/img/step-5-dragon-future.png)

## Step 6

Now we're getting somewhere. The `define` and `require` functions are starting to look quite similar:

### `require`

```
require(['modA', 'modB', 'modC'], function(modA, modB, modC){
   // code that uses the modules
});
```

### `require`

```
define('newModule', ['modA', 'modB', 'modC'], function(modA, modB, modC){
   // code that uses the modules, 
   // and also defines newModule
});
```

Why don't we merge the two together into a single function, that can take either 2 or 3 parameters? If we call that single function `define`, what we have just derived is effectively the [Asynchronous Module Definition (AMD)](https://github.com/amdjs/amdjs-api/wiki/AMD).

(I'm not actually going to write that final version of `define`, because the final step is a bit longer than all the previous ones.)

## AMD

AMD is a [public specification](https://github.com/amdjs/amdjs-api/wiki/AMD). RequireJS is a library that implements the standard. (There are others, e.g. [curl](https://github.com/cujojs/curl) and [dojo](http://dojotoolkit.org/reference-guide/1.9/loader/).) The implementations vary in details and features, but at their core they all have the same `define` function:

```
define(id?, dependencies?, factory)
```

Which means that you can write your code in a consistent, structured style:

A named module:

```
define('Dragon', ['Brain'], function(Brain){
	var Dragon = function(){
		this.brain = new Brain();
	}
	return Dragon;
});
```

Or an anonymous block with dependencies:

```
define(
	['Dragon', 'Kitty', 'Map', 'Brain'],
	function(Dragon, Kitty, Map) {
		var dragon = new Dragon();
		var kitty = new Kitty();
		var map = new Map();
	}
);
```

## RequireJS

RequireJS even allows you to collapse your initial script include down to a single line. Instead of:

```
	<script src="js/mini-require.js"></script>
	<script src="js/main.js"></script>
```

you can write a single like like this:

```
	<script src="lib/require.js" data-main="js/main.js"></script>
```

When RequireJS has finished loading, it will go and retrieve `main.js`, and then start on its dependencies.

## Other features of RequireJS

### Config file to specify paths

Config:

```
	// RequireJS config
	require.config({
		baseUrl: window.BASE_URL + 'datawarehouse/js',
		paths: {
			'ace': 'lib/ace',
			'backbone': 'lib/backbone/backbone-min',
			'bootstrap': 'lib/bootstrap/bootstrap.min',
			'jquery': 'lib/jquery/jquery-2.0.3.min',
			'jquery.csv': 'lib/jquery-plugins/jquery.csv'
		}
	});
```

Code:

```
	
```

* You can load scripts that were not written for AMD using a 