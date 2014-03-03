var mongoose = require('mongoose')
		, Schema = mongoose.Schema
		, passportLocalMongoose = require('passport-local-mongoose');

var Industry = Schema({
	name: String
});

mongoose.model("Industry", Industry);
