module.exports = function (app) {

	app.twitterDate = function(){
		var today = new Date();
		today.setDate(today.getDate() - 1);
		var dd = today.getDate()-1;
		var mm = today.getMonth()+1; //January is 0!
		var yyyy = today.getFullYear();

		if(dd<10) {
		    dd='0'+dd;
		} 

		if(mm<10) {
		    mm='0'+mm;
		} 

		return yyyy+'-'+mm+'-'+dd;
	};

	
};
