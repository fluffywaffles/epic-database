var app = angular.module("epicDatabase", ["ngRoute"],
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
	return {
		list: function(onLoad) {
			if(cachedStartups) {
				console.log("Returning cached copy");
				onLoad(cachedStartups);
				return ;
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
					onLoad(cachedStartups);
				});
				onLoadList = undefined;
			});
		},
		addOrEdit: function(startup, onDone) {
			if(startup._id) {
				var url = "/data/startup/" + startup._id;
			} else {
				var url = "/data/startup/new";
			}
			$http.post(url, startup).success(function(committedStartup) {
				console.log("success");
				cachedStartups[committedStartup._id] = committedStartup;
				onDone(undefined, committedStartup);
			}).error(function(data, status) {
				console.log("error " + status);
				onDone("Error", undefined);
			});
		},
		del: function(startup, onDone) {
			$http.delete("/data/startup/" + startup._id, startup).success(function() {
				console.log("success");
				delete cachedStartups[startup._id];
				onDone(undefined, cachedStartups);
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
	Startups.list(function(startups) {
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
	Startups.list(function(startups) {
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
	Startups.list(function(startups) {
		$scope.loadedStartups = true;
		$scope.disableForm = false;
		var loadStartupToEdit = function() {
			$scope.toEdit = angular.copy(startups[$routeParams.id]);
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

app.controller("StartupForm", function($scope) {
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
		$scope.toEdit.relatedStartups.push("New related startup");
	};
	
	$scope.deleteRelatedStartup = function(indexToDelete) {
		$scope.toEdit.relatedStartups.splice(indexToDelete, 1);
	};
});
