var mongoose = require('mongoose')
		, Schema = mongoose.Schema
		, passportLocalMongoose = require('passport-local-mongoose');

var startup = Schema({
	raw: [String],
	name: String,
	founders: [String],
	tilePhoto: String,
	bannerPhoto: String,
	mission: String,
	industries: [String],
	northwesternConnections: [{ name: String, alum: String }],
	email: String,
	phone: String,
	stage: String,
	location: String,
	website: String,
	media: String,
	relatedStartups: [Schema.Types.ObjectId],
	details: String
});

module.exports = mongoose.model('Startup', startup);