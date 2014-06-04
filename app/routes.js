
var clone = require('clone');
var qs = require('querystring');

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
	app.post('/queue', function(req, res){		
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "X-Requested-With");
		var body = '';
		req.on('data', function (chunk) {
		    body += chunk;
		});
		req.on('end', function () {

			body = qs.parse(body);
		  	console.log('Get Queue, filter: ', body);
			var response = app.getQueue(body);

		  	res.send(JSON.stringify(response));
		});
	});


	// Call to make actions.
	app.get('/queue/:id/:status', function(req, res){
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "X-Requested-With");

		var id =req.params.id;
		var status = req.params.status;

		var entry = app.dbQueue.get(id);
		if(entry){

			// Che4ck pending to stop duplicates.
			if(entry.status == 'pending'){
				if(status == 'approve'){
					console.log('approve');
					app.approveResponse(id);
				} else if(status == 'reject'){
					console.log('TODO: rejected');
					app.rejectResponse(id);
				}
			}

		} else{
			console.warn("No id match found.");
		}

		res.send({status: status});
	});
};
