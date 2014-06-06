var Twit = require('twit');

module.exports = function (app) {

	app.configure = function(){
		app.config = {
			API_BASE_URL: 'http://localhost:3000/',
			TWEETS_PER_EMAIL: 15
		};
		app.T = new Twit({
		    consumer_key:         'GsaQ0j9nLg2uImZhjEj7KmWCu'
		  , consumer_secret:      'b2QFKJjsSVaIp6CarFy2gk6WXC7DXd9xHRqaiF4LKKz4ELztSQ'
		  , access_token:         '2528590494-aAKpuyEdEcGKyLXghfEgeGLNO96TStBk7Qmte82'
		  , access_token_secret:  'ehuek6S2wbjJh3YM1TFcVTDDXOTZhOlS1XhZI9rX94TJG'
		});
	};	
};
