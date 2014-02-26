var app = angular.module("epicDatabase", []);

app.controller("Startup", function($scope, $http) {
	$http.get("/data/startup").success(function(data) {
		console.log(data);
		$scope.startups = data;
	});
	
});
