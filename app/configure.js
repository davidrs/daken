var Twit = require('twit');

module.exports = function (app) {

	app.configure = function(){
		app.config = {
			API_BASE_URL: 'http://localhost:3000/',
			TWEETS_PER_EMAIL: 15
		};
		app.T = new Twit({
		    consumer_key:         '9zb2FtFnxxAVCw1ILaRvH7QvQ',
		  	consumer_secret:      'JdX5ipkIWp9tGtVUv7T83NkNiYHZFbdmtyWs5D2RgOALvKFiuf',
		 	access_token:         '2528590494-ojhB785XXkm05AJNdHqUgkMhljZlCWeelARyrQd',
		 	access_token_secret:  'dECVYon2XovK0o5y89EuZn97ZCQtfmgyW6ExMUkGtLxQ4'
		});
	};	
};
