var express = require('express');
var dirty = require('dirty');

var app = express();

app.dbSearches = dirty('searches.db');
app.dbQueue = dirty('queue.db');

var clone = require('clone');


var port = process.env.PORT || 3000;
require("./configure")(app);
require("./routes")(app);
require("./helpers")(app);
app.configure();
app.listen(port);



app.runSearches = function(){
    app.dbSearches.forEach(function(key, val) {
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

app.getSearches = function(){
	var response = {};
    app.dbSearches.forEach(function(key, val) {
    	var resp = clone(val);
    	response[key] = resp;
    });
    return response;
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
	app.dbSearches.set(key, val);
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
    app.dbSearches.set('gay', 
	{
		word:'gay', //duplicate of key, just so we have it easily accesible
		cleanVersion: 'gay', //Gay is not always a bad word. Use cleanVersion for words like f*g
		emails: ['sample1@gmail.com', 'sample2@gmail.com'],
		emailIndex: 0,
		comments:['Dakens first magical tweet',
					'Some other tweet',
					'A third kind of tweet']
	});
};
