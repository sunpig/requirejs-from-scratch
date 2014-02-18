define('Dragon', ['Brain'], function(Brain){

	var Dragon = function(){
		console.log('A new dragon (6)');

		this.brain = new Brain();

		console.log(this.brain);
	}

	return Dragon;

});

