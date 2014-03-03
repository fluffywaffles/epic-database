var mongoose = require("mongoose");

module.exports = function(app) {	
	
	var populateStartup = function(query) {
		return query.populate("founders stage industries");
	};
	
	app.get("/data/startup", function(request, response) {
		response.type("json");
		var Startup = mongoose.model("Startup");
		populateStartup(Startup.find({}))
		.exec()
		.then(function(startups) {
			response.send(startups);
		}, function(error) {
			console.log(error);
			response.send(500, "Error retrieving startups from DB");
		});
	});
	
	var processIndustries = function(startup) {
		console.log("Process industries");
		var promise = new mongoose.Promise();
		var Industry = mongoose.model("Industry");
		
		if(startup.industries && startup.industries.length > 0) {
			var count = 0;
			var industryIdMap = [];
			var oneDone = function() {
				count++;
				if(count == startup.industries.length) {
					startup.industries = industryIdMap;
					promise.fulfill(startup);
				}
			};
			
			startup.industries.forEach(function(industry, index) {
				if(industry._id) {
					industryIdMap[index] = industry._id;
					oneDone();
				} else {
					Industry.create(industry, function(error, newIndustry) {
						if(error) {
							console.log(error);
							promise.reject("Error adding new industry");
							//Probably should undo or switch to multi/upsert transaction
						} else {
							industryIdMap[index] = newIndustry._id;
							oneDone();
						}
					});
				}
			});
		} else {
			promise.fulfill(startup);
		}
		return promise;
	};
	
	var processFounders = function(startup) {
		console.log("Process founders");
		var promise = new mongoose.Promise();
		var Person = mongoose.model("Person");
		
		if(startup.founders && startup.founders.length > 0) {
			var founderIdMap = [];
			var count = 0;
			var oneDone = function() {
				count++;
				if(count == startup.founders.length) {
					startup.founders = founderIdMap;
					promise.fulfill(startup);
				}
			};
			startup.founders.forEach(function(founder, index) {
				if(founder._id) {
					founderIdMap[index] = founder._id;
					oneDone();
				} else {
					Person.create(founder, function(error, newPerson) {
						if(error) {
							console.log(error);
							promise.reject("Error adding founder");
						} else {
							founderIdMap[index] = newPerson._id;
							oneDone();
						}
					});
				}
			});
		} else {
			promise.fulfill(startup);
		}
		return promise;
		
	};
	
	var errorHandler = function(error) {
		console.log(error);
		response.send(500, error);
	};
	
	//THIS MUST COME BEFORE THE EDIT PATH!!
	app.post("/data/startup/new", function(request, response) {
		var toAdd = request.body;
		var Startup = mongoose.model("Startup");
		
		processFounders(toAdd)
		.then(processIndustries)
		.then(function(processed) { return Startup.create(processed); })
		.then(function(created) { return Startup.findById(created._id); })
		.then(populateStartup)
		.then(function(query) { return query.exec(); })
		.then(function(startup) { response.send(startup); },
			errorHandler);
	});
	
	app.post("/data/startup/:id", function(request, response) {
		var toUpdate = request.body;
		delete toUpdate._id;
		var id = request.params.id;
		var Startup = mongoose.model("Startup");
		
		processFounders(toUpdate)
		.then(processIndustries)
		.then(function(processed) { return Startup.findByIdAndUpdate(id, processed); })
		.then(populateStartup)
		.then(function(query) { return query.exec(); })
		.then(function(startup) { response.send(startup); },
			errorHandler);
	});
	
	app.del("/data/startup/:id", function(request, response) {
		
		var id = new mongoose.Types.ObjectId(request.params.id);
		var Startup = mongoose.model("Startup");
		console.log(id);
		Startup.update({relatedStartups: id}, {$pull: {relatedStartups: id}}, {multi: true}).exec()
			.then(function() { return Startup.remove({_id: id}).exec(); })
			.then(function() { response.send(200); },
				function(error) {
					console.log(error);
					response.send("Error deleting", 404);
				});
	});
};
	