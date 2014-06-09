var BASE_API_URL = 'http://warm-citadel-2025.herokuapp.com';
if (document.location.hostname == "localhost"){
	BASE_API_URL = 'http://localhost:3000';
}
var MIN_TWEETS = 5;

var User = {email:'davidrustsmith@gmail.com', auth: false, password:''};
var currentWord ='';

requirejs.config({
    paths: {
        "text" : "js/vendor/text"
    }
});

var app = {
	start: function(){
		app.loadSettings();

		$.getJSON(BASE_API_URL + '/search',function(data){
			console.log('search',data);
			app.renderSearches(data);
		});

		$('#login').click(function(evt){
			User.email = $('#email-account').val();
			User.password = $('#password').val();
			app.login();
			if(localStorage){
				localStorage.setItem("email", User.email);
				localStorage.setItem("password", User.password);
			}
			evt.preventDefault();
		});

		$('.logout').click(function(evt){
			evt.preventDefault();
			
			User.email = '';
			User.password = '';
			User.auth = false;

			if(localStorage){
				localStorage.setItem("email", '');
				localStorage.setItem("password", '');
			}

			$('#login-section').show();
			$('#logout-section').hide();
		});

		$('.btn-response').click(function(evt){
			console.log("click");
			var response = $('#submit-response').val();
			console.log(response);
			if(response.length<1){
				alert("Missing response text.");
			} else{
				app.suggestResponse(response);
				var div =$('#submit-response');	
				div.animate({height:'+=30px',opacity:'0.4'},"slow");
				div.val('');
				div.animate({height:'-=30px',opacity:'1'},"slow");
			}		
			evt.preventDefault();
		});


	},

	suggestResponse: function(response){		
		var filter = {
			word: currentWord,
			response: response,
			auth: User.auth
		};

		$.post(BASE_API_URL+'/queue/submit',
			JSON.stringify(filter)).done(
			function(queue){
				if(!User.auth){
					alert("Thank you! Response will be moderated and then added to Daken's repertoire.")
				}
			});			
	},

	loadSettings: function(){
		if(localStorage){
			// Retrieve Email if found
			User.email = localStorage.getItem("email");
			User.password = localStorage.getItem("password");
			if(User.password && User.password.length>0){
				app.login();
			}
		}
	},

	login: function(){
		$.getJSON(BASE_API_URL + '/auth/' + User.password,function(data){
			console.log('ran auth',data);
			User.auth = data.auth;
			if(User.auth){
				$('#login-section').hide();
				$('#logout-section').show();
			}
		});
	},

	renderSearches: function(searches){
		require(['text!templates/search.html'],
			function(template){
				$('#searches').html('').show();
				for(var word in searches){
					$('#searches').append(_.template(template, searches[word]));
				}

				// add listeners to click to load queue for each search. use data-word
				$('a.search').click(function(evt){
					currentWord = $(this).data('word');
					var cleanWord = $(this).data('cleanword');
					app.getQueue(currentWord);

					$('#intro').hide();
					$('#search-container .search-word').text(cleanWord);
					$('#search-container').show();
				});

				// Go back, hide queue, show searches
				$('a.back').click(function(evt){
					$('#intro').show();
					$('#search-container').hide();
					$('#queue').hide();
					$('#searches').show();
				});
			});
	},

	getQueue: function(word){
		ga('send', 'event', 'buttonDaken', 'click', word);
		var filter = {word: word};
		if(! User.auth){
			// Decided to show unnapproved to everyone. Allows for guests to reply directly themselves.
			//filter.status = "approved";
		} 

		$.post(BASE_API_URL+'/queue',
			JSON.stringify(filter)).done(
			function(queue){
				//var queue = JSON.parse(queue);
				console.log('queue',queue);

				app.runMoreIfNeeded(queue);
				app.renderQueue(queue, word);
		});
	},


	renderQueue: function(queue, word){
		require(['text!templates/queue.html'], function(template){
			var entry = {};		
			var row = $('<div class="row"></div>');	

			$('#queue').html('');	

			for(var counter = 0; counter < queue.length; counter++){

				entry = queue[counter];
				entry.id = entry._id;
				entry.auth = User.auth;
				row.append(_.template(template, entry));

				// Add new row div if needed.
				if((counter + 1) % 3 === 0){
					$('#queue').append(row);
					$('#queue').append('<hr />');
					row = $('<div class="row"></div>');		
				}
			}

			// Add last row we were building.
			if(counter % 3 !== 0){
				$('#queue').append(row);
			}	

			app.addQueueListeners();

			$('#searches').hide();
			$('#queue').show();
		});
	},

	addQueueListeners: function(){
		$('.approve').click(function(evt){
			var id = $(this).data('id');
			var parentBox = $(this).closest('.col-md-4');
			if(User.auth){
				$.getJSON(BASE_API_URL + '/queue/'+ id +"/approve",function(data){
					console.log('approved ',data);
					console.log(parentBox.find('.pending-actions').length);
					parentBox.find('.pending-actions').hide();
					parentBox.addClass("bg-success");
				});
			}
			evt.preventDefault();
		});

		$('.reject').click(function(evt){
			var id = $(this).data('id');
			console.log('click ',id);
			var parentBox = $(this).closest('.col-md-4');
			if(User.auth){
				$.get(BASE_API_URL + '/queue/'+ id +"/reject", function(data){
					console.log('rejected ',data);
					console.log(parentBox);
					parentBox.fadeOut(600, function() { $(this).remove(); });
				});
			}
			evt.preventDefault();
		});
	},

	runMoreIfNeeded: function(queue){
		//only counts if user is auth, otherwise may exist, but just can't see any
		if(User.auth && queue.length < MIN_TWEETS){
			$.get(BASE_API_URL + '/run',function(data){
				console.log('ran searches',data);
			});
		}
	}
};


app.start();
