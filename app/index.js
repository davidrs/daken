var express = require('express');
var dirty = require('dirty');
var md5 = require('MD5');

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
	app.T.get('search/tweets', 
		{ 
			q: badWord + ' since:' + app.twitterDate(), 
			count: app.config.TWEETS_PER_EMAIL,
			lang: 'en' 
		}, function(err, data, response) {
			if(data.statuses){
			  var badTweets = data.statuses;
			  console.log('got bad tweets: ', badTweets.length);

			  for(var i=0; i < badTweets.length;i++){
			  	var checkQueue = app.dbQueue.get(badTweets[i].id_str);

			  	// Make sure not a duplicate and not a Retweet
		  		if(!checkQueue && !badTweets[i].retweeted_status){
		  			app.dbQueue.set(badTweets[i].id_str,
				  	{	
				  		badTweet:badTweets[i],
				  		word: badWord,
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

app.authorizeUser = function(pwd){
	pwd = pwd.toLowerCase();
	return (md5(pwd) == 'a37821efe50a564f7dad395ad6b036bc');
};

app.getSearches = function(){
	var response = {};
    app.dbSearches.forEach(function(key, val) {
    	var resp = clone(val);
    	response[key] = resp;
    });
    return response;
};

app.getQueue = function(filter){
	var response = [];
    app.dbQueue.forEach(function(key, val) {
    	
    	var allFilterMatch = true;
    	for ( var prop in filter ){
    		if(filter[prop] != val[prop]){
    			allFilterMatch = false;
    			break;
    		}
    	}

    	if(allFilterMatch){
	    	var resp = clone(val);
	    	resp.id = key;
	    	response.push(resp);
	    }

	    //TODO if # elements in response is < desired call runsinglesearch.
	    //TODO filter out old ones.

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
	console.log('entry',entry);
	var userName = entry.badTweet.user.screen_name;
	console.log(userName);

	var statusUpdate = '.@' + userName+ ' ' + entry.response;

	console.log("TODO: Uncomment to send ", statusUpdate);
	// TODO figure out how to 'reply' to a tweet.
	
	app.T.post('statuses/update', { status: statusUpdate }, function(err, data, response) {
	   console.log('err ',err);
	   console.log('post ',data);
	});	
}

app.rejectResponse = function(id){
	var entry = app.dbQueue.get(id);

	console.log("Rejecting response ",id);
	entry.status = "rejected";

	app.dbQueue.set(id,entry);
	
}

//Set new entries:
app.setEntry = function(){
    app.dbSearches.set('gay', 
	{
		word:'gay', //duplicate of key, just so we have it easily accesible
		cleanWord: 'gay', //Gay is not always a bad word. Use cleanVersion for words like f*g
		emails: ['sample1@gmail.com', 'sample2@gmail.com'],
		emailIndex: 0,
		comments:['Dakens first magical tweet',
					'Some other tweet',
					'A third kind of tweet']
	});
};
