var Twit = require('twit');

module.exports = function (app) {

	app.configure = function(){
		app.config = {
			API_BASE_URL: 'http://localhost:3000/',
			TWEETS_PER_EMAIL: 15
		};
		app.T = new Twit({
		    consumer_key:         'pzYm83EAARajUYxih4NbPH1Rb'
		  , consumer_secret:      'JE3uFgsOa33iawnzfHL0L5JWWVQflAy9vf9XiYhqXaHFOM1GbR'
		  , access_token:         '387245373-cEveoGrdv2OMNcdwvGOi4t066nzGywfzjZbxruRa'
		  , access_token_secret:  'UzL9ysHcJikDXbvgnM6o1SfkPa9Y6O7t0fxN9Bf9jembT'
		});
	};	
};
