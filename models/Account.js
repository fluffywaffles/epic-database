var mongoose = require('mongoose')
		, Schema = mongoose.Schema
		, passportLocalMongoose = require('passport-local-mongoose');

var account = Schema({});

account.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', account);