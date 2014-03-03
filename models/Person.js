var mongoose = require('mongoose')
	,Schema = mongoose.Schema
	,passportLocalMongoose = require('passport-local-mongoose');


var Person = Schema({
	name: String,
	email: String,
	registered: {
		type: Boolean,
		"default": false
	}
});

mongoose.model("Person", Person);

