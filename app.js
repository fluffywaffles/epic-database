
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var db = require('./routes/db');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({secret: 'casanova killed the hostel bar'}));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
}

if ('production' == app.get('env')) {
	app.use(express.errorHandler());
}

app.use(passport.initialize());
app.use(passport.session());
//router MUST come after passport. IDK.
app.use(app.router);

var mongoose = require('mongoose');

// connect to db
// for local to work, mongod (mongodaemon) must be running on port 27017
var uristring =
	process.env.MONGOLAB_URI ||
	process.env.MONGOHQ_URL  ||
	'mongodb://localhost/epicdb';
	
mongoose.connect(uristring, function (err, res) {
	if (err) {
		console.log ('ERROR connecting to: ' + uristring + '. ' + err);
	} else {
		console.log ('Succeeded connecting to: ' + uristring);
		require('./util/parsecsv').parse();
	}
});

//set up passport (better auth) using passport-local-mongoose plugin
var Account = require('./models/Account.js');
passport.use(Account.createStrategy());
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/dump', express.basicAuth(function(user, pass) { return user === "admin" && pass === "my favorite giraffe apocalypse"; }), db.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
