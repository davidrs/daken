
var clone = require('clone');

module.exports = function (app) {


	// Homepage doens't do anything.
	app.get('/', function(req, res){
		console.log("index page");
	  res.send('hello world');
	});

	// Run searches
	app.get('/run', function(req, res){
		console.log('Run the searches');
		app.runSearches();
	  	res.send('run');
	});

	//Create a new entry.
	app.get('/set/', function(req, res){
		app.setEntry();
	});

	//Show all searches queue
	app.get('/search', function(req, res){
		var response = app.getSearches();
	  	res.send(JSON.stringify(response));
	});

	//Show entire queue
	app.get('/queue', function(req, res){
		var response = app.getQueue();
	  	res.send(JSON.stringify(response));
	});

	//Show queue for particular email address, that are pending.
	app.get('/queue/email/:email', function(req, res){
		var response ={};

		    app.dbQueue.forEach(function(key, val) {
		    	if(val.email == req.params.email && val.status == 'pending'){
		    		var resp = clone(val);
		    		resp.badTweet = val.badTweet.text;
				    resp.approveLink = app.config.API_BASE_URL+'queue/'+ key +'/approve',
				    resp.rejectLink = app.config.API_BASE_URL+'queue/'+ key +'/reject'
				    
			    	response[key] = resp;
		    	}
		    });
		    console.log('Queue response' );
	  	res.send(JSON.stringify(response));
	});


	// Call to make actions.
	app.get('/queue/:id/:status', function(req, res){
		var id =req.params.id;
		var status = req.params.status;

		var entry = app.dbQueue.get(id);
		if(entry){
			if(entry.status == 'pending'){
				if(status == 'approve'){
					console.log('TODO: approve');
					app.approveResponse(id);
				} else if(status == 'reject'){
					console.log('TODO: rejected');

				}
			}
	  		res.send("Set status: "+status);

		}else{
			console.warn("No id match found.");
		}

	});
};
