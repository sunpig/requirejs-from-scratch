define('Dragon', function(){

	var Dragon = function(){
		console.log('A new dragon (5)');

		var dragon = this;
		require(['Brain'], function(Brain){
			dragon.brain = new Brain();
		});

		console.log(this.brain);
	}

	return Dragon;

});

