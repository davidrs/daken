var express = require('express');
var dirty = require('dirty');

var app = express();

var dbSearches = dirty('searches.db');
app.dbQueue = dirty('queue.db');
app.config = {
	API_BASE_URL: 'http://localhost:3000/',
	TWEETS_PER_EMAIL: 10
};

var Twit = require('twit');

var clone = require('clone');


var port = process.env.PORT || 3000;
require("./routes")(app);
require("./helpers")(app);
app.listen(port);

var T = new Twit({
    consumer_key:         'pzYm83EAARajUYxih4NbPH1Rb'
  , consumer_secret:      'JE3uFgsOa33iawnzfHL0L5JWWVQflAy9vf9XiYhqXaHFOM1GbR'
  , access_token:         '387245373-cEveoGrdv2OMNcdwvGOi4t066nzGywfzjZbxruRa'
  , access_token_secret:  'UzL9ysHcJikDXbvgnM6o1SfkPa9Y6O7t0fxN9Bf9jembT'
});


app.runSearches = function(){
    dbSearches.forEach(function(key, val) {
    	app.runSingleSearch(key,val);	    	
    });
}

app.runSingleSearch = function(badWord, search){
	var email = search.emails[search.emailIndex];
	app.incrementEmailIndex(badWord, search);
  	console.log('Found key: %s, val: %j', badWord, search);
	T.get('search/tweets', 
		{ 
			q: badWord + ' since:' + app.twitterDate(), 
			count: config.TWEETS_PER_EMAIL,
			lang: 'en' 
		}, function(err, data, response) {
			if(data.statuses){
			  var badTweets = data.statuses;
			  console.log('got bad tweets: ', badTweets.length);

			  for(var i=0; i < badTweets.length;i++){
			  	var checkQueue = app.dbQueue.get(badTweets[i].id_str);
		  		if(!checkQueue && !badTweets[i].retweeted_status){
		  			app.dbQueue.set(badTweets[i].id_str,
				  	{	
				  		badTweet:badTweets[i],
				  		email: email,
				  		response: app.randomComment(search),
				  		status:'pending'
				  	});
		  		} else{
		  			console.log('DUPLICATE key or a RT.',badTweets[i].retweeted_status);
		  		}			
			  }
			}
			else{
				console.warn("twitter didn't return statuses",data);
			}
		}
	);

};

app.getQueue = function(){
	var response = {};
    app.dbQueue.forEach(function(key, val) {
    	var resp = clone(val);
    	resp.badTweet = val.badTweet.text;
    	response[key] = resp;
    });
    return response;
};

app.randomComment = function(val){
	var index = Math.floor(Math.random() * val.comments.length);
	return val.comments[index];
};


app.incrementEmailIndex = function(key, val){
	val.emailIndex = (val.emailIndex + 1) % val.emails.length;
	dbSearches.set(key, val);
};


app.approveResponse = function(id){
	var entry = app.dbQueue.get(id);

	console.log("Approving response ",id);

	var statusUpdate = entry.response;

	console.log("TODO: Uncomment to send ", statusUpdate);
	
	T.post('statuses/update', { status: statusUpdate }, function(err, data, response) {
	   console.log('err ',err);
	  console.log('post ',data);
	  //console.log('response ',response);
	});	
}

//Set new entries:
app.setEntry = function(){
	dbSearches.on('load', function() {
	    dbSearches.set('gay', 
    	{
    		emails: ['sample1@gmail.com', 'sample2@gmail.com'],
    		emailIndex: 0,
    		comments:['Dakens first magical tweet',
    					'Some other tweet',
    					'A third kind of tweet']
    	});
	});
};
