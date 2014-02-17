define('Brain', function(){

	console.log('Before brain');

	var Brain = function(name){
		console.log('A new brain (5)');
		var brain = document.createElement('img');
		brain.src = "img/brain.svg";
		document.body.appendChild(brain);
	}

	return Brain;

});

