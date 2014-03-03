var mongoose = require("mongoose");

module.exports = function(app) {
	app.get("/data/person", function(request, response) {
		var Person = mongoose.model("Person");
		var persons = Person.find(function(error, data) {
			if(error) {
				console.log(error);
				response.send("Error getting people from DB", 404);
			}
			response.send(data, 200);
		});
	});
};
