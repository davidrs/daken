var express = require('express'),
	dirty = require('dirty'),
	md5 = require('MD5'),
	mongo = require("mongodb"),
	url = require("url"),
 	BSON = mongo.BSONPure;

// Heroku-style environment variables
var uristring = process.env.MONGOLAB_URI || "mongodb://localhost/testdatabase";
//var mongoUrl = url.parse (uristring);


var app = express();

//TODO: Create queue object and search object.
var Tweets = {};
var Search = {};
// Pointer to mongo db
app.db = null; 

//Mongo Collections
app.searchCollection = null;
app.tweetCollection = null;

var clone = require('clone');


var port = process.env.PORT || 3000;
require("./configure")(app);
require("./routes")(app);
require("./helpers")(app);
app.configure();
app.listen(port);

var emptyCallback = function(err, data){};

//TODO read tutorial: http://mongodb.github.io/node-mongodb-native/api-articles/nodekoarticle1.html
var MongoClient = mongo.MongoClient;

// Connect to the db
console.info("Starting Mongo Connection");
MongoClient.connect(uristring, function(err, scopedDB) {
  if(!err) {
    console.log("We are connected");
    app.db = scopedDB;

	app.db.collection('searches', function(er, collection) {
    	app.searchCollection = collection;
    	app.test();
	});

	app.db.collection('tweets', function(er, collection) {
    	app.tweetCollection = collection;
		
		//app.tweetCollection.drop() ;

    	app.updateTweets();

	});

  } else{
  	console.log('err', err);
  }
});

app.submitResponse = function(body, res){
	if(body.word){		
		//Get entry with that word.
		app.searchCollection.findOne({word:body.word}, function(err, search){
			if(search){
				console.log("found matching search");
				if(body.auth){
					app.searchCollection.update({_id: search._id},{ $push: { comments: body.response } }, emptyCallback);				
				} else{
					app.searchCollection.update({_id: search._id},{ $push: { pendingComments: body.response } }, emptyCallback);				
				}
				res.send({status:'success'});
			} else{
				console.log("No matching search");
				res.send({status:'fail'});
			}
		});
	} else{
		console.error("Missing word");
		res.send({status:'fail'});
	}

};

app.updateTweets = function(){
	// delete old ones
	Tweets.cleanup(function(){
		app.tweetCollection.count(function(err, count) {
	            if(count < 15){
	            	app.runSearches();
	            }
	    });
	});
};


//Dev test on start:
app.test = function(){
	// Delete current collection.
	// LOSES submitted comments 
	//app.searchCollection.drop() ;


	app.setEntry();
	//app.runSearches();
};

Tweets.cleanup = function(callback){
	console.log('cleanup');
	var tooOld =  new Date();
	tooOld.setDate(tooOld.getDate() - 1);

	var filter = {
		'badTweet.created_at':{$lt:tooOld},
		status:"pending"
	};
	//TODO: if tweets are pending and older than tooOld, remove them.
	app.tweetCollection.remove(filter, function(err, numRemoved) {
		console.log('tweets removed', numRemoved);
		callback();
    });
}

app.runSearches = function(){
	if(app.searchCollection){
		app.searchCollection.find().toArray(function(err, items) {
			console.log('searches: '+ items.length);
			items.forEach(function(val, key){
				//console.log('values',val,key);
				app.runSingleSearch(val);	
			});
	    });
	} else{
		console.warn("searchCollection empty / null")
	}
};


app.runSingleSearch = function(search){

	var email = search.emails[search.emailIndex];
	app.incrementEmailIndex(search);
  	console.log('Found val:',  search);
	app.T.get('search/tweets', 
		{ 
			q: search.word + ' since:' + app.twitterDate(), 
			count: app.config.TWEETS_PER_EMAIL,
			lang: 'en' 
		}, function(err, data, response) {
			if(data && data.statuses){
			  var badTweets = data.statuses;
			  console.log('got bad tweets: ', badTweets.length);

			  for(var i = 0; i < badTweets.length; i++){
			  	(function(i){
			  	app.tweetCollection.findOne({"badTweet.id_str": badTweets[i].id_str}, function(err, checkQueue ){
				  	// Make sure not a duplicate and not a Retweet
			  		if(!checkQueue && !badTweets[i].retweeted_status){

			  			// Set date to proper json style
						badTweets[i].created_at = new Date(badTweets[i].created_at);

			  			app.tweetCollection.insert(
					  	{	
					  		badTweet:badTweets[i],
					  		word: search.word,
					  		email: email,
					  		response: app.randomComment(search),
					  		status:'pending'
					  	}, emptyCallback);

			  		} else{
			  			console.log('DUPLICATE key or a RT.',badTweets[i].retweeted_status);
			  		}				  
			  	});	
			  	})(i);	
			  }
			}
			else{
				console.warn("twitter didn't return statuses ",err);
			}
		}
	);
};

app.authorizeUser = function(pwd){
	pwd = pwd.toLowerCase();
	return (md5(pwd) == 'a37821efe50a564f7dad395ad6b036bc');
};


app.getSearches = function(res){
	app.searchCollection.find().toArray(function(err, items) {
        res.send(items);
    });
};

app.getQueue = function(filter, res){
	var response = [];
    app.tweetCollection.find().toArray(function(err, items) {
    	var response = [];
    	console.log("found Tweets: "+items.length);

    	items.forEach(function(val, key) {    	
	    	var allFilterMatch = true;
	    	for ( var prop in filter ){
	    		if(filter[prop] != val[prop]){
	    			allFilterMatch = false;
	    			break;
	    		}
	    	}

	    	if(allFilterMatch){
		  		response.push(val);
		    }

		    //TODO if # elements in response is < desired call runsinglesearch.
		    //TODO filter out old ones.
		});  
		res.send(response);
	});
    return response;
};


app.incrementEmailIndex = function(val){
	val.emailIndex = (val.emailIndex + 1) % val.emails.length;
	app.searchCollection.update(
	   { word: val.word },
	   {
	      $set: { emailIndex: val.emailIndex }
	   }, emptyCallback);
};



app.approveResponse = function(id){
	console.log("Approving response ",id);
	app.tweetCollection.findOne({_id: id}, function(err, entry){
		if(entry){
			var userName = entry.badTweet.user.screen_name;
			var statusUpdate = app.prepareResponse(userName, entry.response);

			//console.log("TODO: Uncomment to send ", statusUpdate);
			// TODO figure out how to 'reply' to a tweet.
			
			app.T.post('statuses/update', { status: statusUpdate }, function(err, data, response) {
			   console.log('err ',err);
			   console.log('post ',data);
			});	


			app.tweetCollection.update({_id: id}, 
			{
				$set: {status: "approved"}
			}, emptyCallback);	
		} else{
			console.warn("Entry not found " + id);
		}
	});

};

app.rejectResponse = function(id){
	console.log("Rejecting response ",id);

	app.tweetCollection.update({_id: id}, 
	{
		$set: {status: "rejected"}
	}, emptyCallback);
	
};

//Set new entries:
app.setEntry = function(){

	// !name will be replaced with user's @twitterhandle
	var searchAry = [
	{
		word:'gay', //duplicate of key, just so we have it easily accesible
		cleanWord: 'gay', //Gay is not always a bad word. Use cleanVersion for words like f*g
		emails: [],
		emailIndex: 0,
		comments:["Pastor's speech against gay rights, with surprise ending. https://www.youtube.com/watch?v=VLEGTuXTDoI",
					"Sweet message from a bunch of famous athletes !name #ProudToPlay https://www.youtube.com/watch?v=S14QJcI4KNs&feature=inp-tw-paq-5002"],
		pendingComments:[]
	},
	{
		word:'redskins',
		cleanWord: 'r*dskins', 
		emails: [],
		emailIndex: 0,
		comments:['R*dskin: noun, dated, offensive. #Google #Definition #ChangeTheName https://www.google.com/search?q=redskin+definition',
					'Hey !name R*dskins name is only offensive if you think about it http://www.theonion.com/articles/report-redskins-name-only-offensive-if-you-think-a,33449/',
					'Support the team, not the name. http://youtu.be/mR-tbOxlhvE',
					'Great team, racist name. #SupportTheTeamNotTheName'],
		pendingComments:[]
	},
	{
		word:'retarded',
		cleanWord: 'r*t*rd*d', 
		emails: [],
		emailIndex: 0,
		comments:['Open letter from special olympic athlete to !name http://specialolympicsblog.wordpress.com/2012/10/23/an-open-letter-to-ann-coulter/'],
		pendingComments:[]
	},	
	];

	app.smartInsert(searchAry);
};

// Inserts only if an entry with that word doesn't exist
app.smartInsert = function(searchAry){
	searchAry.forEach(function(val, key){
		// Add new searches
		app.searchCollection.findOne( {word: val.word }, {safe: true}, function(err, entry){
			if(!entry){
				console.log("Insert " + val.word);
				app.searchCollection.insert( val, {safe: true}, emptyCallback);
			} else{
				console.log("Duplicate " + val.word);
			}
		});
		
	});
};

app.randomComment = function(val){
	var index = Math.floor(Math.random() * val.comments.length);
	return val.comments[index];
};

app.prepareResponse = function(userName, response){
	// If there is !name in response replace with user's name, else append users name to begining.
	if(response.indexOf('!name')>=0){
		response = response.replace('!name', '@'+userName);
	} else{
		response = '.@' + userName+ ' ' + response;
	}
	return response;
};

