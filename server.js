var port = process.env.PORT || 8080;
var dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
var express = require('express');
var app = express();
var mongo = require('mongodb').MongoClient;
var bing = require('node-bing-api')({ accKey: "52d40438cf984550b6565be3e29675d8" });

app.get('/', function(req, res) {
   res.send('usage eamples');
});

app.get('/api/latest/imagesearch', function(req, res) {
    mongo.connect(dbUrl, function(err, db) {
        if (err) {
            throw err;
        } 
        var searchHist = db.collection('search-history');
        searchHist.find({}).toArray(function(err, docs) {
            if (err) {
                throw err;
            } 
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(docs, null, 3));
        });
    });
});

app.get('/api/imagesearch/:searchTerm', function(req, res) {
    var searchTerm = req.params.searchTerm;
    var offset = req.query.offset || 0;
    var searchResults;
    mongo.connect(dbUrl, function(err, db) { 
        if (err) {
            throw err;
        }
        var searchHist = db.collection('search-history');
        searchHist.insert(
            { 
                timeStamp: Date.now(), 
                searchTerm: searchTerm 
            },
            function(err, data) {
                if (err) {
                    throw err;
                }
            }
        );
    });
    bing.images(
        searchTerm, 
        {
            top: 50,   // Number of results (max 50) 
            skip: offset    // Skip first n result 
        }, 
        function(error, response, body) {
            var results = [];
            for (var i = 0; i < body.value.length; i++) {
                var result = {
                    snippet: body.value[i].name,
                    imageUrl: body.value[i].contentUrl,
                    pageUrl: body.value[i].hostPageDisplayUrl
                };
                results.push(result);
            }
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(results, null, 3));
        }
    );   
});

app.listen(port);