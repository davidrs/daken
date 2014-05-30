var BASE_API_URL = 'http://warm-citadel-2025.herokuapp.com';
//var BASE_API_URL = 'http://localhost:3000';
var BASE_CLIENT_URL = 'http://localhost:3000';

requirejs.config({
    paths: {
        "text" : "js/vendor/text"
    }
});

var app = {
	start: function(){
		$.getJSON(BASE_API_URL +'/search',function(data){
			console.log(data);
			app.renderSearches(data);
		});


	},

	renderSearches: function(){
		require(['text!templates/search.html'],
			function(template){
				console.log('tempalte',template);
				$('h1').after(_.template(template));
			});
	}
};
app.start();
