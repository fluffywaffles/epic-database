exports.parse = function () {
	
	var fs = require('fs');
	var _  = require('lodash');
	var db = require('../models/Startup');

	var rawcsv;
	var output = {};

	fs.readFile('./raw-csv/file.csv', { encoding: 'utf8' }, function (err, data) {
		if (err) return console.log(err);
		
		rawcsv = data;
		console.log(rawcsv);
		console.log(!!rawcsv);
		
		// FIXME: doesn't manage undefined well
		
		if (rawcsv) {
			var lines = rawcsv.split('\n');
			console.log(lines);
			var headers = lines[0].match(/"((?:[^,"]+,[^,"]+))+"|([^,]+)/g);
			headers = headers.filter( function (el ) {
				return el.toLowerCase() !== 'timestamp';
			});
			console.log(headers);

			lines.slice(1).forEach( function (el, idx) {
				var data = el.match(/"((?:[^,"]+,[^,"]+))+"|([^,]+)/g);
				//console.log(data);
				//TODO: generalize by taking output[header] = value instead of explicit locations
				if (data !== null && data.length >= 5) {
					data = data.slice(1);
					//console.log(data);
					output.raw = data;
					output.name = data[0];
					output.founders = data[1];
					output.tilePhoto = data[2];
					output.bannerPhoto = data[3];
					output.mission = data[4];
					output.industries = data[5].split(',');
					output.northwesternConnections = data[6].split(',').map( function (el, idx) {
						return { name: el, alum: data[7].split(',')[idx].toLowerCase() === 'yes' || data[7].split(',')[idx].toLowerCase() };
					});
					output.email = data[8];
					output.phone = data[9];
					output.stage = data[10];
					output.location = data[11];
					output.website = data[12];
					output.media = data[13];
					output.relatedStartups = [ (' ' + data[14]).trim(), (' ' + data[15]).trim(), (' ' + data[16]).trim() ];
					output.details = (' ' + data[17]).trim();
					console.log(output);
					var newItem = new db(output);
					db.update({ name: output.name }, output, {upsert: true}, function (err) {
						console.log(err);
					});
				}
			});
		}
	});
}
