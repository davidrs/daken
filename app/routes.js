
var clone = require('clone');
var qs = require('querystring'),
	mongo = require("mongodb");

var BSON = mongo.BSONPure;

module.exports = function (app) {

	// Homepage doens't do anything.
	app.get('/', function(req, res){
		console.log("index page");
	 	res.send('hello world');
	});

	// Run searches
	app.get('/run', function(req, res){
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "X-Requested-With");
		console.log('Run the searches');
		app.runSearches();
	  	res.send({status:'run'});
	});

	//Create a new entry.
	app.get('/set', function(req, res){
		app.setEntry();
	  	res.send({status:'set'});
	});

	app.get('/auth/:pwd', function(req, res){
		console.log("running auth");		
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "X-Requested-With");
		
		res.send({auth: app.authorizeUser(req.params.pwd)});
	});

	// Show all searches queue
	app.get('/search', function(req, res){
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "X-Requested-With");
		app.getSearches(res);
	});



	// Show queue
	app.get('/queue', function(req, res){		
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "X-Requested-With");		
		//TODO: see if/why qs. parse was necessary...
		app.getQueue({}, res);
	});

	// Show queue
	app.post('/queue', function(req, res){		
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "X-Requested-With");
		var body = '';
		req.on('data', function (chunk) {
		    body += chunk;
		});
		req.on('end', function () {
			//TODO: see if/why qs. parse was necessary...
			body = JSON.parse(body);//qs.parse(body);
		  	console.log('Get Queue, filter: ', body);
			app.getQueue(body, res);
		});
	});

// Show queue
	app.post('/queue/submit', function(req, res){		
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "X-Requested-With");
		var body = '';
		req.on('data', function (chunk) {
		    body += chunk;
		});
		req.on('end', function () {

			body = JSON.parse(body);
		  	console.log('Submit Response: ', body);
			app.submitResponse(body, res);
		});
	});	


	// Call to make actions.
	app.get('/queue/:id/:action', function(req, res){
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "X-Requested-With");
		//console.log(req.params);
		var id = BSON.ObjectID(req.params.id);
		var action = req.params.action ;
		var filter =
            {
             _id: id,
            status: 'pending' 
		};

		if(id && action){
			app.tweetCollection.findOne(filter, function(err, entry){
				if(entry){					
					if(action == 'approve'){
						console.log('approve');
						app.approveResponse(id);
					} else if(action == 'reject'){
						console.log('reject');
						app.rejectResponse(id);					
					}
					res.send({status: action});
				} else{
					console.warn("No match found.",err);
					res.send({status: 'pending'});
				}
			});
		} else{
			res.send({status: 'pending'});
		}
	});
};
