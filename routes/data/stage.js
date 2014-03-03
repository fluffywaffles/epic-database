//Simple way of getting initial data that is unlikely to change during program execution
var mongoose = require("mongoose");

module.exports = function(app) {
	app.get("/data/stage", function(request, response) {
		var Stage = mongoose.model("Stage");
		var stages = Stage.find(function(error, data) {
			if(error) {
				console.log(error);
				response.send("Error getting people from DB", 404);
			}
			response.send(data, 200);
		});
	});
};
