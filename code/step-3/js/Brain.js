define('Brain', function(){

	console.log('Before brain');

	var Brain = function(){
		console.log('A new brain (3)');
		var brain = document.createElement('img');
		brain.src = "img/brain.svg";
		document.body.appendChild(brain);
	}

	return Brain;

});

