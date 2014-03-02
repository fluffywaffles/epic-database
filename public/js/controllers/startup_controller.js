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

app.factory("Startups", ["$http", function($http) {
	var cachedStartups;
	var onLoadList;
	
	var list = function(onLoad, force) {
		if(force) {
			console.log("Force load list");
		}
		if(!force && cachedStartups) {
			console.log("Returning cached copy");
			onLoad(undefined, angular.copy(cachedStartups));
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
			cachedStartups = data.reduce(function(previousValue, element, index, array) {
				previousValue[element._id] = element;
				return previousValue;
			}, {});
			onLoadList.forEach(function(onLoad) {
				onLoad(undefined, angular.copy(cachedStartups));
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
		}
	};
}]);

app.controller("Startup", function($scope) {
	
});

app.controller("StartupList", function($scope, Startups, $location) {
	$scope.loadedStartups = false;
	Startups.list(function(error, startups) {
		angular.forEach(startups, function(startup) {
			if(startup.relatedStartups) {
				startup.relatedStartups = startup.relatedStartups.map(function(id) {
					return startups[id];
				});
			}
		});
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

app.controller("Edit", function($scope, Startups, $routeParams, $location) {
	$scope.loadedStartups = false;
	$scope.disableForm = true;
	Startups.list(function(error, startups) {
		$scope.loadedStartups = true;
		$scope.disableForm = false;
		var loadStartupToEdit = function() {
			$scope.toEdit = angular.copy(startups[$routeParams.id]);
			$scope.toEdit.relatedStartups = $scope.toEdit.relatedStartups.map(function(id) {
				var element = startups[id];
				return {
					name: element.name,
					_id: element._id
				};
			});
			console.log($scope.toEdit);
		};
		loadStartupToEdit();
		$scope.commitEdit = function() {
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

app.controller("StartupForm", function($scope, Startups) {
	Startups.list(function(error, startups) {
		var startupTypeahead = [];
		angular.forEach(startups, function(value, key) {
			startupTypeahead.push({
				name: value.name,
				_id: value._id
			});
		});
		$scope.startupTypeahead = startupTypeahead;
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
	
	$scope.addFounder = function() {
		if(!$scope.toEdit.founders) {
			$scope.toEdit.founders = [];
		}
		$scope.toEdit.founders.push("New Founder");
	};
	
	$scope.deleteFounder = function(indexToDelete) {
		$scope.toEdit.founders.splice(indexToDelete, 1);
	};
	
	$scope.addIndustry = function() {
		if(!$scope.toEdit.industries) {
			$scope.toEdit.industries = [];
		}
		$scope.toEdit.industries.push("New industry");
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
});
