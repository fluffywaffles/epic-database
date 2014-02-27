var app = angular.module("epicDatabase", ["ngRoute"],
function($routeProvider) {
	$routeProvider.when("/:id/edit", {
		templateUrl: "edit",
		controller: "Edit"			
	});
	
	$routeProvider.otherwise({
		templateUrl: "list",
		controller: "StartupList"
	});
});

app.factory("Model", ["$http", function($http) {
	var startups;
	var onLoadList;
	return {
		load: function(onLoad) {
			if(startups) {
				console.log("Returning cached startups");
				onLoad(startups);
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
				startups = data.reduce(function(previousValue, element, index, array) {
					previousValue[element._id] = element;
					return previousValue;
				}, {});
				onLoadList.forEach(function(onLoad) {
					onLoad(startups);
				});
				onLoadList = undefined;
			});
		},
		edit: function(startupToEdit, onEdited) {
			if(!startups[startupToEdit._id]) {
				console.log("Startup not found");
				return;
			}
			$http.post("/data/startup", startupToEdit).success(function(data) {
				console.log("success");
				startups[startupToEdit._id] = startupToEdit;
				onEdited(startups);
			}).error(function(data, status) {
				console.log("error "+ status);
			});
			
		}
	};
}]);

app.controller("Startup", function($scope) {
	
});

app.controller("StartupList", function($scope, Model) {
	Model.load(function(startups) {
		$scope.startups = startups;
		$scope.loaded = true;
	});
});

app.controller("Edit", function($scope, Model, $routeParams) {
	Model.load(function(startups) {
		$scope.startups = startups;
		var loadStartupToEdit = function() {
			$scope.toEdit = angular.copy($scope.startups[$routeParams.id]);
		};
		
		loadStartupToEdit();
		$scope.commitEdit = function() {
			Model.edit($scope.toEdit, function(startups) {
				console.log("Edited successfully");
			});
		};
		
		$scope.addFounder = function() {
			$scope.toEdit.founders.push("New Founder");
		};
		
		$scope.deleteFounder = function(indexToDelete) {
			$scope.toEdit.founders.splice(indexToDelete, 1);
		};
		
		$scope.addIndustry = function() {
			$scope.toEdit.industries.push("New industry");
		};
		
		$scope.deleteIndustry = function() {
			$scope.toEdit.industries.splice(indexToDelete, 1);
		};
		
		$scope.addRelatedStartup = function() {
			$scope.toEdit.relatedStartups.push("New related startup");
		};
		
		$scope.deleteRelatedStartup = function(indexToDelete) {
			$scope.toEdit.relatedStartups.splice(indexToDelete, 1);
		};
		
		$scope.revertEdit = loadStartupToEdit;
		
	});
});
