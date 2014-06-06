var BASE_API_URL = 'http://warm-citadel-2025.herokuapp.com';
if (document.location.hostname == "localhost"){
	BASE_CLIENT_URL = 'http://localhost:3000';
}
var MIN_TWEETS = 5;

var User = {email:'davidrustsmith@gmail.com', auth: false, password:''};
//var currentWord ='';

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
				$('#login-form').hide();
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
					var word = $(this).data('word');
					var cleanWord = $(this).data('cleanWord');
					app.getQueue(word);

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
		var filter = {word: word};
		if(! User.auth){
			filter.status = "approved";
		} 

		$.post(BASE_API_URL+'/queue',
			filter).done(
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
				row.append(_.template(template, entry));

				// Add new row div if needed.
				if((counter + 1) % 3 == 0){
					$('#queue').append(row);
					$('#queue').append('<hr />');
					row = $('<div class="row"></div>');		
				}
			}

			// Add last row we were building.
			if(counter % 3 != 0){
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
			$.getJSON(BASE_API_URL + '/queue/'+ id +"/approve",function(data){
				console.log('approved ',data);
			});
			evt.preventDefault();
		});

		$('.reject').click(function(evt){
			var id = $(this).data('id');
			console.log('click ',id);
			var parentBox = $(this).closest('.col-md-4');
			$.get(BASE_API_URL + '/queue/'+ id +"/reject", function(data){
				console.log('rejected ',data);
				console.log(parentBox)
				parentBox.fadeOut(600, function() { $(this).remove(); });
			});
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
