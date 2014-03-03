//Simple way of getting initial data that is unlikely to change during program execution
var mongoose = require("mongoose");

module.exports = function(app) {
	app.get("/data/industry", function(request, response) {
		var Industry = mongoose.model("Industry");
		var industries = Industry.find(function(error, data) {
			if(error) {
				console.log(error);
				response.send("Error getting industries from DB", 404);
			}
			response.send(data, 200);
		});
	});
};
