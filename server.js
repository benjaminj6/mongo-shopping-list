var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var app = express();
var config = require('./config');

app.use(bodyParser.json());
app.use(express.static('public'));

var Item = require('./models/item');

app.get('/items', function(req, res) {
	Item.find(function(err, items) {
		if(err) {
			return res.status(500).json({ message: 'Internal Server Error' });
		}

		res.json(items);
	});
});

app.post('/items', function(req, res) {
	Item.create({ name: req.body.name }, function(err, item) {
		if(err) {
			return res.status(500).json({ message: 'Internal Server Error'});
		}

		return res.status(201).json(item.name);
	});
});

app.put('/items/:id', function(req, res) {

	Item.findOneAndUpdate({ _id: req.params.id }, { name: req.body.name }, function(err, item) {
		
		// TODO -- figure out validation thorugh Mongoose
		if(err || !req.body.name || typeof req.body.name !== 'string') {
			return res.status(500).json({ message: 'Internal Server Error' });
		}

		return res.status(200).json(item);
	});
});

app.delete('/items/:id', function(req, res) {

	Item.findOneAndRemove({ _id: req.params.id }, function(err, item) {
		if(err) {
			return res.status(500).json({ message: 'Internal Server Error' });
		}

		return res.status(200).json(item);
	});
});

app.use('*', function(req, res) {
	res.status(404).json({ message: 'Not Found' });
});

function runServer(callback) {
	mongoose.connect(config.DATABASE_URL, function(err) {
		if (err && callback) {
			return callback(err);
		}

		app.listen(config.PORT, function() {
			console.log('Listening on localhost:' + config.PORT);
			if(callback) {
				callback();
			}
		});
	});
}

if (require.main === module) {
	runServer(function(err) {
		if(err) {
			console.log(err);
		}
	});
}

exports.app = app;
exports.runServer = runServer;