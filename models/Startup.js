var mongoose = require('mongoose')
		, Schema = mongoose.Schema
		, passportLocalMongoose = require('passport-local-mongoose');



var startup = Schema({
	raw: [String],
	name: String,
	founders: [{
		type: Schema.Types.ObjectId,
		ref: "Person"
		}],
	tilePhoto: String,
	bannerPhoto: String,
	mission: String,
	industries: [{
		type: Schema.Types.ObjectId,
		ref: "Industry"
	}],
	northwesternConnections: [{ name: String, alum: String }],
	email: String,
	phone: String,
	stage: {
		type: Schema.Types.ObjectId,
		ref: "Stage"
		},
	location: {
		formatted_address: String,
		latitude: Number,
		longitude: Number
	},
	website: String,
	media: [String],
	relatedStartups: [Schema.Types.ObjectId],
	details: String
});
mongoose.model('Startup', startup);
