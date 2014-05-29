//var BASE_API_URL = 'http://warm-citadel-2025.herokuapp.com';
var BASE_API_URL = 'http://localhost:3000';

var app = {
	start: function(){
		$.get(BASE_API_URL +'/search',function(data){
			console.log(data);
		});
	}
};
app.start();
