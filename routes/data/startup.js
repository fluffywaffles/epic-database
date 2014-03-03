var mongoose = require("mongoose");

module.exports = function(app) {	
	app.get("/data/startup", function(request, response) {
		response.type("json");
		var Startup = mongoose.model("Startup");
		Startup
			.find({})
			.populate("founders").exec(function(err, startups) {
				if(err) {
					response.send(500, "Error retrieving startups from DB");
				}
				setTimeout(function() {
					response.send(startups);	
				}, 1000);
				
			});
	});
	
	var addOrEditStartupCallback = function(response) {
		return function(err, updated) {
			if(err) {
				console.log(err);
				response.send(400, "Error updating database");
			} else {
				console.log(updated);
				setTimeout(function() {
					response.send(updated, 200);	
				}, 1000);
				
			}
		};
	};
	
	//THIS MUST COME BEFORE THE EDIT PATH!!
	app.post("/data/startup/new", function(request, response) {
		var toAdd = request.body;
		console.log(toAdd);
		var Startup = mongoose.model("Startup");
		Startup.create(toAdd).populate("founders").exec(addOrEditStartupCallback(response));
	});
	
	app.post("/data/startup/:id", function(request, response) {
		var toUpdate = request.body;
		delete toUpdate._id;
		var id = request.params.id;
		var Startup = mongoose.model("Startup");
		var Person = mongoose.model("Person");
		//console.log(id);
		//console.log(toUpdate);
		
		var onFoundersUpdated = function() {
			Startup.findByIdAndUpdate(id, toUpdate).populate("founders").exec(addOrEditStartupCallback(response));
		};
		
		if(toUpdate.founders && toUpdate.founders.length > 0) {
			founderIdMap = [];
			var count = 0;
			var oneDone = function() {
				console.log("One done");
				count++;
				if(count == toUpdate.founders.length) {
					toUpdate.founders = founderIdMap;
					onFoundersUpdated();
				}
			};
			toUpdate.founders.forEach(function(founder, index) {
				if(founder._id) {
					founderIdMap[index] = founder._id;
					oneDone();
				} else {
					Person.create(founder, function(error, newPerson) {
						if(error) {
							console.log("Error with new person");
							response.send(404);
						} else {
							founderIdMap[index] = newPerson._id;
							oneDone();
						}
					});
				}
			});
		} else {
			onFoundersUpdated();
		}
		
	});
	
	app.del("/data/startup/:id", function(request, response) {
		var id = new mongoose.Types.ObjectId(request.params.id);
		var Startup = mongoose.model("Startup");
		console.log(id);
		Startup.remove({_id: id}, function(error) {
			if(error) {
				response.send("Error deleting", 404);
			} else {
				//Remove from any startups that have this as a related startup
				Startup.update({relatedStartups: id}, {$pull: {relatedStartups: id}}, {multi: true}, function(error, numAffected, rawResponse) {
					if(error) {
						console.log(error);
						response.send("Error deleting", 404);
					}
					console.log(numAffected);
					response.send(200);	
				});
			}
		});
		
	});
};
	