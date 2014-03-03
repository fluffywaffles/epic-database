var mongoose = require('mongoose')
		, Schema = mongoose.Schema
		, passportLocalMongoose = require('passport-local-mongoose');

var Stage = new Schema({
	name: String,
	rank: Number
});

mongoose.model("Stage", Stage);
