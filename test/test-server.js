var assert = require("assert");
var request = require('supertest');

//-------------test vars
var BASE_API_URL = 'http://localhost:3000';
var MIN_TWEETS = 5;
var User = {email:'davidrustsmith@gmail.com', auth: false, password:''};
var testTweet = {_id:'123test', word:'testword'};
//--------------
//Sample tests: https://github.com/vgheri/ShopWithMe/blob/master/test/Routes.js

describe('Daken Server', function(){
	/*describe('set', function(){
    it('should set searches', function(done){
    	request(BASE_API_URL)
			.get('/set')
			.send()
    		// end handles the response
			.end(function(err, res) {
	          if (err) {
	          	//console.log('err res',res);
	            throw err;
	          }
	          //console.log("body: ",res.body);
	          assert.equal("set", res.body.status);
	          done();
	        });

    });
  });*/
  describe('search', function(){
    it('should return array of searches', function(done){
    	request(BASE_API_URL)
			.get('/search')
			.send()
    		// end handles the response
			.end(function(err, res) {
	          if (err) {
	          	//console.log('err res',res);
	            throw err;
	          }
	          //console.log("body: ",res.body);
	          assert.equal(true, res.body.length>0);
	          assert.equal('gay', res.body[0].word);
	          done();
	        });

    });
  });

  /* describe('run', function(){
    it('should run searches', function(done){
    	request(BASE_API_URL)
			.get('/run')
			.send()
    		// end handles the response
			.end(function(err, res) {
	          if (err) {
	          	//console.log('err res',res);
	            throw err;
	          }
	          //console.log("body: ",res.body);
	          assert.equal('run', res.body.status);
	          done();
	        });
    });
  });
*/
   console.log("sometimes this queue will run prematurely.")

   describe('queue', function(){
    it('should get full queue', function(done){
    	var filter = {
	        word: 'gay'
	    };
    	request(BASE_API_URL)
			.post('/queue')
			.send(filter)
    		// end handles the response
			.end(function(err, res) {
	          if (err) {
	          	//console.log('err res',res);
	            throw err;
	          }
	          //console.log("body: ",res.body);
	          assert.equal(true, res.body.length>0);
	          done();
	        });
    });
  });

   describe('approve', function(){
    it('should approve entry', function(done){
    	request(BASE_API_URL)
			.get('/queue/'+testTweet._id+'/approve')
			.send()
    		// end handles the response
			.end(function(err, res) {
	          if (err) {
	          	//console.log('err res',res);
	            throw err;
	          }
	          //console.log("body: ",res.body);
	          assert.equal('pending', res.body.status);
	          done();
	        });
    });
  });
});

/*

request(url)
	.post('/api/profiles')
	.send(profile)
    // end handles the response
	.end(function(err, res) {
          if (err) {
            throw err;
          }
          // this is should.js syntax, very clear
          res.should.have.status(400);
          done();
        });
*/
