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
				onLoad(undefined, cachedStages);
				return;
			}
			$http.get("/data/stage").success(function(data) {
				cachedStages = data;
				onLoad(undefined, cachedStages);
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

app.controller("StartupList", function($scope, Startups, $location) {
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
	Startups.list(function(error, startups) {
		loadRelatedStartups(startups);
		$scope.startups = startups;
		$scope.loadedStartups = true;
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
	});
});

app.controller("Add", function($scope, Startups, $location) {
	$scope.loadedStartups = false;
	$scope.disableForm = true;
	Startups.list(function(error, startups) {
		$scope.loadedStartups = true;
		$scope.disableForm = false;
		$scope.toEdit = {};
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

app.controller("StartupForm", function($scope, Startups, $http, $filter) {
	Startups.list(function(error, startups) {
		$scope.startups = startups;
	});
	
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
			return $filter("filter")(results, searchText);
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
		$scope.toEdit.industries.push("");
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
