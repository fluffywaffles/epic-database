var app = angular.module("epicDatabase", ["ngRoute", "ui.bootstrap"],
function($routeProvider) {
	$routeProvider.when("/:id/edit", {
		templateUrl: "/startup/edit",
		controller: "Edit"			
	});
	$routeProvider.when("/add", {
		templateUrl: "/startup/add",
		controller: "Add"
	});
	$routeProvider.otherwise({
		templateUrl: "/startup/list",
		controller: "StartupList"
	});
	
});

app.factory("Stages", ["$http", function($http) {
	var cachedStages;
	return {
		stages: function(onLoad) {
			if(cachedStages) {
				onLoad(undefined, angular.copy(cachedStages));
				return;
			}
			$http.get("/data/stage").success(function(data) {
				cachedStages = data;
				onLoad(undefined, angular.copy(cachedStages));
			});
		}
	};
}]);


app.factory("Industries", ["$http", function($http) {
	var cachedIndustries;
	return {
		industries: function(onLoad) {
			if(cachedIndustries) {
				onLoad(undefined, angular.copy(cachedIndustries));
				return;
			}
			$http.get("/data/industry").success(function(data) {
				cachedIndustries = data;
				onLoad(undefined, angular.copy(cachedIndustries));
			});
		}
	};
}]);

app.factory("Startups", ["$http", function($http) {
	var cachedStartups;
	var onLoadList;
	
	var copyStartupsToArray = function() {
		var arr = [];
		angular.forEach(cachedStartups, function(element) {
			arr.push(angular.copy(element));
		});
		return arr; 
	};
	
	var list = function(onLoad, force) {
		if(force) {
			console.log("Force load list");
		}
		if(!force && cachedStartups) {
			console.log("Returning cached copy");
			onLoad(undefined, copyStartupsToArray());
			return;
		}
		if(onLoadList) {
			console.log("Already downloading startups");
			onLoadList.push(onLoad);
			return;
		}
		console.log("Downloading startups");
		onLoadList = [onLoad];
		$http.get("/data/startup").success(function(data) {
			console.log(data);
			cachedStartups = data.reduce(function(previousValue, element, index, array) {
				previousValue[element._id] = element;
				return previousValue;
			}, {});
			onLoadList.forEach(function(onLoad) {
				onLoad(undefined, copyStartupsToArray());
			});
			onLoadList = undefined;
		});
	};
	
	return {
		list: function(onLoad) { list(onLoad, false); },
		addOrEdit: function(startup, onDone) {
			if(startup._id) {
				var url = "/data/startup/" + startup._id;
			} else {
				var url = "/data/startup/new";
			}
			startup = angular.copy(startup);
			if(startup.relatedStartups) {
				startup.relatedStartups = startup.relatedStartups
					.map(function(element) {
						return element._id;
					})
					.filter(function(element) {
						return !!element;
					});
			}
			if(startup.founders) {
				startup.founders = startup.founders.filter(function(element) {
					if(!element.name && !element.value) {
						return false;
					}
					return true;
				});
			}
			if(startup.industries) {
				startup.industries = startup.industries.filter(function(element) {
					return element.name.length > 0;
				});
			}
			
			if(startup.media) {
				startup.media = startup.media.filter(function(medium) {
					return !!medium;
				});
			}
			
			if(startup.stage) {
				startup.stage = startup.stage._id;
			}
			
			console.log(startup);
			
			
			$http.post(url, startup).success(function(committedStartup) {
				console.log("success");
				cachedStartups[committedStartup._id] = committedStartup;
				onDone(undefined, angular.copy(committedStartup));
			}).error(function(data, status) {
				console.log("error " + status);
				onDone("Error", undefined);
			});
		},
		del: function(startup, onDone) {
			$http.delete("/data/startup/" + startup._id, startup).success(function() {
				console.log("success");
				delete cachedStartups[startup._id];
				list(onDone, true);
			}).error(function(data, status) {
				console.log("Error: " + data);
				onDone("Error", undefined);
			});
		},
		getById: function(id) {
			return angular.copy(cachedStartups[id]);
		}
	};
}]);

app.controller("Startup", function($scope) {
	
});

app.controller("StartupList", function($scope, Startups, Stages, Industries, $location) {
	//One level load (related startups inside related startups are not loaded)
	var loadRelatedStartups = function(startups) {
		startups.forEach(function(startup) {
			if(startup.relatedStartups) {
				startup.relatedStartups = startup.relatedStartups.map(function(id) {
					return Startups.getById(id); 
				});
			}
		});
	};
	$scope.loadedStartups = false;
	Stages.stages(function(error, stages) {
		Industries.industries(function(error, industries) {
			Startups.list(function(error, startups) {
			
				loadRelatedStartups(startups);
				$scope.startups = startups;
				$scope.loadedStartups = true;
				
				
				$scope.stages = stages;
				$scope.industries = industries;
				
				$scope.selectAllIndustryFilters = function() {
					$scope.industries.forEach(function(industry) {
						industry.enabled = true;
					});
				};
				
				$scope.selectAllStageFilters = function() {
					$scope.stages.forEach(function(stage) {
						stage.enabled = true;
					});
				};
				
				$scope.selectAllStageFilters();
				$scope.selectAllIndustryFilters();
				
				$scope.editStartup = function(startup) {
					$location.path("/" + startup._id + "/edit");
				};
				$scope.deleteStartup = function(startup) {
					startup.disableModify = true;
					Startups.del(startup, function(error, startups) {
						startup.disableModify = false;
						if(error) {
							
						} else {
							loadRelatedStartups(startups);
							$scope.startups = startups;
						}
					});
				};
				
				$scope.updateFilter = function() {
					
				};
				
				
				
				$scope.startupFilter = function(startup) {
					var allStages = $scope.stages.every(function(stage) {
						return stage.enabled;
					});
					
					return allStages || $scope.stages.some(function(stage) {
						return allStages || stage.enabled && startup.stage && startup.stage._id == stage._id;
					});
				};
				
				$scope.industryFilter = function(startup) {
					var allIndustries = $scope.industries.every(function(industry) {
						return industry.enabled;
					});
					return allIndustries || $scope.industries.some(function(industry) { //Loop over all possible industries
						return industry.enabled && startup.industries && startup.industries.some(function(startupsIndustry) {
							//Loop over industries that the given startup contains
							//If the startup contains the industry we are looking for, return true
							return industry._id == startupsIndustry._id;
						});
					});
					
				};
			});
		});
	});
	
});

app.controller("Add", function($scope, Startups, Stages, $location) {
	$scope.loadedStartups = false;
	$scope.disableForm = true;
	Startups.list(function(error, startups) {
		Stages.stages(function(error, stages) {
			$scope.loadedStartups = true;
			$scope.disableForm = false;
			$scope.toEdit = {};
			$scope.stages = stages;
			$scope.saveNew = function() {
				$scope.saving = true;
				$scope.disableForm = true;
				Startups.addOrEdit($scope.toEdit, function(error, startup) {
					if(error) {
						$scope.disableForm = false;
						$scope.saving = false;
						return;
					}
					console.log("Added successfully");
					$scope.disableForm = false;
					$scope.saving = false;
					$location.path("/");
				});
			};
		});
	});
});

app.controller("Edit", function($scope, Startups, Stages, $routeParams, $location) {
	$scope.loadedStartups = false;
	$scope.disableForm = true;
	Startups.list(function(error, startups) {
		Stages.stages(function(error, stages) {
			$scope.loadedStartups = true;
			$scope.disableForm = false;
			$scope.stages = stages;
			
			var loadStartupToEdit = function() {
				$scope.toEdit = Startups.getById($routeParams.id);
				$scope.toEdit.relatedStartups = $scope.toEdit.relatedStartups.map(function(id) {
					return Startups.getById(id);
				});
				if($scope.toEdit.stage) {
					//The objects must be the same for initial selection
					stages.forEach(function(stage) {
						if(stage._id == $scope.toEdit.stage._id) {
							$scope.toEdit.stage = stage;
						}					
					});
				}
				
				console.log($scope.toEdit);
			};
			loadStartupToEdit();
			$scope.commitEdit = function() {
				console.log($scope.toEdit);
				$scope.disableForm = true;
				$scope.saving = true;
				Startups.addOrEdit($scope.toEdit, function(error, startup) {
					if(error) {
						$scope.disableForm = false;
						$scope.saving = false;
						return;
					}
					console.log("Edited successfully");
					$scope.disableForm = false;
					$scope.saving = false;
					$location.path("/");
				});
			};
			$scope.revertEdit = loadStartupToEdit;
			
		});
	});
});


app.factory("Geocoder", ["$q", function($q) {
	var geocoder = new google.maps.Geocoder();
	
	return {
		codeAddress: function(location) {
			var deferred = $q.defer();
			geocoder.geocode({address: location}, function(results, status) {
				if(status == google.maps.GeocoderStatus.OK) {
					deferred.resolve(results);
				} else {
					console.log(status);
					deferred.reject(status);
				}
			});
			return deferred.promise;
		}
	};
}]);



app.controller("StartupForm", function($scope, Startups, $http, $filter, Geocoder) {
	Startups.list(function(error, startups) {
		$scope.startups = startups;
	});

	$scope.codeAddress = function(address) {
		return Geocoder.codeAddress(address);
	};
	
	$scope.locationSelected = function(location) {
		console.log(location);
		$scope.toEdit.location = {
			formatted_address: location.formatted_address,
			latitude: location.geometry.location.d,
			longitude: location.geometry.location.e
		};
	};
	
	$scope.locationChanged = function() {
		$scope.toEdit.location = {};
	};
	
	$scope.excludeSelectedStartups = function(test) {
		if(test._id == $scope.toEdit._id) {
			return false;
		}
		return $scope.toEdit.relatedStartups.every(function(related) {
			if(related && test._id == related._id) {
				return false;
			} else {
				return true;
			}
		});
	};
	
	$scope.searchPeople = function(searchText) {
		//Need to do serverside filtering
		return $http.get("/data/person").then(function(response) {
			//For reasons I don't understand, angular typeahead will not filter results from a promise
			var results = response.data;
			if(!results) {
				results = [];
			}
			return $filter("filter")(results, searchText)
				.filter(function(test) {
					//Exclude founders that are already selected
					return !$scope.toEdit.founders.some(function(selectedFounder) {
						return selectedFounder._id == test._id;
					});
			});
		});
	};
	
	$scope.searchIndustries = function(searchText) {
		return $http.get("/data/industry").then(function(response) {
			var results = response.data;
			return $filter("filter")(results, searchText)
				.filter(function(test) {
					//Exclude industries that are already selected
					return !$scope.toEdit.industries.some(function(selectedIndustry) {
						return selectedIndustry._id == test._id;
					});
				});
			
		});
	};
	
	$scope.founderSelected = function(index, model) {
		console.log(index);
		console.log(model);
		$scope.toEdit.founders[index] = model;
	};
	
	$scope.founderNameChanged = function(index) {
		
		if($scope.toEdit.founders[index]._id) {
			$scope.toEdit.founders[index] = {name: $scope.toEdit.founders[index].name, email: ""};
		}
	};
	
	$scope.founderEmailChanged = function(index) {
		//If we previously had an existing user selected and now we don't
		if($scope.toEdit.founders[index]._id) {
			$scope.toEdit.founders[index] = {name: "", email: $scope.toEdit.founders[index].email};
		}
		
	};
	
	$scope.industrySelected = function(index, model) {
		$scope.toEdit.industries[index] = model;
	};
	
	$scope.industryChanged = function(index) {
		if($scope.toEdit.industries[index]._id) {
			$scope.toEdit.industries[index] = {name: $scope.toEdit.industries[index].name};
		}
	};
	
	
	$scope.addFounder = function() {
		if(!$scope.toEdit.founders) {
			$scope.toEdit.founders = [];
		}
		$scope.toEdit.founders.push({});
		console.log($scope.toEdit.founders);
	};
	
	$scope.deleteFounder = function(indexToDelete) {
		$scope.toEdit.founders.splice(indexToDelete, 1);
	};
	
	$scope.addIndustry = function() {
		if(!$scope.toEdit.industries) {
			$scope.toEdit.industries = [];
		}
		$scope.toEdit.industries.push({});
	};
	
	$scope.deleteIndustry = function(indexToDelete) {
		$scope.toEdit.industries.splice(indexToDelete, 1);
	};
	
	$scope.addRelatedStartup = function() {
		if(!$scope.toEdit.relatedStartups) {
			$scope.toEdit.relatedStartups = [];
		}
		$scope.toEdit.relatedStartups.push("");
	};
	
	$scope.deleteRelatedStartup = function(indexToDelete) {
		$scope.toEdit.relatedStartups.splice(indexToDelete, 1);
	};
	
	$scope.addMedia = function() {
		if(!$scope.toEdit.media) {
			$scope.toEdit.media = [];
		}
		$scope.toEdit.media.push("");
	};
	
	$scope.deleteMedia = function(indexToDelete) {
		$scope.toEdit.media.splice(indexToDelete, 1);
	};
	
});
