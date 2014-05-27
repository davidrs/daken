var express = require('express');
var dirty = require('dirty');

var app = express();
var dbSearches = dirty('searches.db');
var dbQueue = dirty('queue.db');
var Twit = require('twit')

var T = new Twit({
    consumer_key:         'AKBd0aYWHQmKPgk9F0yCKA'
  , consumer_secret:      'J82K9fXJEKN2Fjbj9cFgEOdgWH0mWe2IXtPdYxYDk8'
  , access_token:         '387245373-NDhyDLtFfwILsn4oaofOcP6sv8jtgLKFljWilEtT'
  , access_token_secret:  '5L1rPJ7LVuJLuQuSvBOUgG45LkFRaVn33dUXJ80zs'
});

var config = {
	TWEETS_PER_EMAIL: 10
};

app.twitterDate = function(){
	var today = new Date();
	today.setDate(today.getDate() - 1);
	var dd = today.getDate()-1;
	var mm = today.getMonth()+1; //January is 0!
	var yyyy = today.getFullYear();

	if(dd<10) {
	    dd='0'+dd
	} 

	if(mm<10) {
	    mm='0'+mm
	} 

	return yyyy+'-'+mm+'-'+dd;
};



app.runSearches = function(){
	dbSearches.on('load', function() {

	    dbSearches.forEach(function(key, val) {
	    	var badWord = key;
	    	var email = val.emails[val.emailIndex];
	    	app.incrementEmailIndex(key, val);
	      	console.log('Found key: %s, val: %j', key, val);
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
					  	var checkQueue = dbQueue.get(badTweets[i].id_str);
				  		if(!checkQueue){
				  			dbQueue.set(badTweets[i].id_str,
						  	{	
						  		badTweet:badTweets[i],
						  		email: email,
						  		response: app.randomComment(val),
						  		status:'pending'
						  	});
				  		} else{
				  			console.log('DUPLICATE key, already queued this tweet.');
				  		}			
					  }
					}
					else{
						console.warn("twitter didn't return statuses",data);
					}
				}
			);

	    });
	  });
}

app.randomComment = function(val){
	var index = Math.floor(Math.random()*val.comments.length);
	return val.comments[index];
};


app.incrementEmailIndex = function(key, val){
	val.emailIndex = (val.emailIndex + 1) % val.emails.length;
	dbSearches.set(key, val);
};


app.get('/', function(req, res){
  res.send('hello world');

});

app.get('/queue', function(req, res){
	var response ={};

	    dbQueue.forEach(function(key, val) {
	    	val.badTweet = val.badTweet.text;
	    	response[key] = val;
	    });

	    console.log('Queue response' );

  res.send(JSON.stringify(response));
});


app.get('/queue/:id/:status', function(req, res){
	var id =req.params.id;
	var status = req.params.status;

	var entry = dbQueue.get(id);
	if(entry){
		if(entry.status == 'pending'){
			if(status == 'approve'){
				console.log('TODO: approve');
			} else if(status == 'reject'){
				console.log('TODO: rejected');

			}
		}

	}else{
		console.warn("No id match found.");
	}

});


app.listen(3000);

//Run the searches
app.runSearches();

//Set new entries:
app.setEntry = function(){
	dbSearches.on('load', function() {
	    dbSearches.set('gay', 
    	{
    		emails: ['sample1@gmail.com', 'sample2@gmail.com'],
    		emailIndex: 0,
    		comments:['Check out this link: www.sample.com',
    					'Some other response',
    					'a third kind of response']
    	});
	});
};


//app.setEntry();