var Twit = require('twit');

module.exports = function (app) {

	app.configure = function(){
		app.config = {
			API_BASE_URL: 'http://localhost:3000/',
			TWEETS_PER_EMAIL: 10
		};
		app.T = new Twit({
		    consumer_key:         'XXX'
		  , consumer_secret:      'XXX'
		  , access_token:         'XXX'
		  , access_token_secret:  'XXX'
		});
	};	
};
