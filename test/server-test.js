global.DATABASE_URL = 'mongodb://localhost/shopping-list/test';

var chai = require('chai');
var chaiHttp = require('chai-http');

var server = require('../server.js');
var Item = require('../models/item');

var should = chai.should();
var app = server.app;

chai.use(chaiHttp);

function createSampleItems() {
	var items = [
		{ name: 'item1' },
		{ name: 'item2' },
		{ name: 'item3' }
	];

	before(function(done) {
		server.runServer(function() {
			Item.create(items[0], items[1], items[2], function() {
				done();
			});
		});
	});
}

function removeSampleItems() {
	after(function(done) {
		Item.remove(function() {
			done();
		});
	});
}

describe('GET Request on /items', function() {
	createSampleItems();

	it('valid request should return the list of items in JSON', function(done) {
		chai.request(app)
			.get('/items')
			.end(function(err, res) {
				should.equal(err, null);
				res.should.be.json;
				done();
			});
	});
	it('invalid endpoint should return 404 NOT FOUND', function(done) {
		chai.request(app)
			.get('/aaaa')
			.end(function(err, res) {
				res.should.have.status(404);
				done();
			});
	});

	removeSampleItems();
});

describe('POST request on /items', function() {
	createSampleItems();

	it('valid request should create item, return 201 ITEM CREATED and JSON', function(done) {
		chai.request(app)
			.post('/items')
			.send({ name: 'salad' })
			.end(function(err, res) {
				should.equal(err, null);
				res.should.have.status(201);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.name.should.equal('salad');
				done();
			});
	});

	function postError(endpoint, request, errorCode, done) {
		chai.request(app)
			.post(endpoint)
			.send(request)
			.end(function(err, res) {
				res.should.have.status(errorCode);
				done();
			});
	}


	it('invalid endpoint should return 404 NOT FOUND', function(done) {
		postError('/itemzzzz', { name: 'chicken nuggets' }, 404, done);
	});

	it('no body data should return 500 INTERNAL SERVER ERROR', function(done) {
		serverError({}, done);
	});

	function serverError(request, done) {
		return postError('/items', request, 500, done);
	}

	it('no JSON in body should return 500 INTERNAL SERVER ERROR', function(done) {
		serverError('string', done);
	});

	it('JSON without "name" property should return 500 INTERNAL SERVER ERROR', function(done) {
		serverError({ price: 'cheap' }, done);
	});

	it('A non-string in "name" property should return 500 INTERNAL SERVER ERROR', function(done) {
		serverError({ name: [] }, done);
	});





	removeSampleItems();
});


