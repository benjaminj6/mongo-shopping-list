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
				res.body.should.be.a('string');
				res.body.should.equal('salad');
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

	it('no JSON in request should return 500 INTERNAL SERVER ERROR', function(done) {
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

function printItems(done) {
	chai.request(app)
		.get('/items')
		.end(function(err, res) {
			console.log(res.body);
			done();
		});
}

describe('PUT request on /items/:id', function() {
	createSampleItems();
	var validEndpoint = '/items/57b17fbcd78c07ceb69ecb64';

	it('valid request should edit the item and return 200', function(done) {
		chai.request(app)
			.put(validEndpoint)
			.send({ name: 'hot dogs' })
			.end(function(err, res) {
				res.should.have.status(200);
				res.should.be.json;
				done();
			});
	});

	it('invalid endpoint should return 404 NOT FOUND', function(done) {
		putError('/aaaa/bbb', { name: 'chicken wings' }, 404, done);
	});

	function putError(endpoint, request, error, done) {
		chai.request(app)
			.put(endpoint)
			.send(request)
			.end(function(err, res) {
				res.should.have.status(error);
				done();
			});
	}

	it('request to change item not in database should return 500 INTERNSAL SERVER ERROR', function(done) {
		serverError('/items/abcdefg', { name: 'beef' }, done);
	});

	function serverError(endpoint, request, done) {
		return putError(endpoint, request, 500, done);
	}

	// Having trouble making this one work... not sure what it is.
	it('request with nothing in body should return 500 INTERNAL SERVER ERROR', function(done) {
		serverError(validEndpoint, '', done);
	});

	it('request with invalid JSON in body should return 500 INTERNAL SERVER ERROR', function(done) {
		serverError(validEndpoint, 'string', done);
	});

	it('request without "name" property should return 500 INTERNAL SERVER ERROR', function(done) {
		serverError(validEndpoint, { price: 'twelve' }, done);
	});

	// TODO -- figure out Mongoose validation
	// it('request without a string in "name" property should return 500 INTERNAL SERVER ERROR', function(done) {
	// 	serverError(validEndpoint, { name: [] }, done);
	// });

	removeSampleItems();
});

describe('DELETE request on /items/:id', function() {
	createSampleItems();
	var validEndpoint = '/items/57b17fbcd78c07ceb69ecb64';

	it('valid request should return 200 and deleted item', function(done) {
		chai.request(app)
			.delete(validEndpoint)
			.end(function(err, res) {
				should.equal(err, null);
				res.should.have.status(200);
				done();
			});
	});

	it('request to delete nonexistent item should return 500 INTERNAL SERVER ERROR', function(done) {
		chai.request(app)
			.delete('/items/abcdefg')
			.end(function(err, res) {
				res.should.have.status(500);
				done();
			});
	});

	removeSampleItems();
});


