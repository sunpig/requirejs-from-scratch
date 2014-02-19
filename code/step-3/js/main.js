// main.js
require('Dragon', function(Dragon){
	require('Kitty', function(Kitty){
		require('Map', function(Map){
			var dragon = new Dragon();
			var kitty = new Kitty();
			var map = new Map();

			require('Brain', function(){
				// make it stop MAKE IT STOP
			});
		});
	});
});

// output:

// A new dragon
// Hello kitty
// A new map
// Before brain

