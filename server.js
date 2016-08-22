var express = require('express');
var bodyParser = require('body-parser');
var kue = require('kue');

var app = express();
var jobs = kue.createQueue({
  disableSearch: false,
  redis: {
    port: 6379,
    host: 'localhost'
  }
});

var PORT = process.env.PORT || 8080;

app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

// POST: localhost:8080/offering
app.post('/offering', function(req, res, next) {
  console.log(req.body.jsonDoc);
  var job = jobs.create('indexing-es', {
    title: 'ES indexing',
    id: req.body.id,
    jsonDoc: req.body.jsonDoc
  }).searchKeys(['id', 'title'])
    .attempts(5)
    .backoff({delay: 60000, type: 'fixed'})
    .removeOnComplete(true) //just remove the jobs successfully completed
    .save(function(err){
      if (err) {
        console.log('error: ' + job.id);
        job.log({key: job.id, type: 'jobError', data: err});
        res.status(500).send('something go wrong with the job: ' + job.id + ', for more info see the logs');
      }
  });

  console.log({key: job.id, course: req.body.id, type:'inQueue', data: req.body.jsonDoc});
  job.log({key: job.id, course: req.body.id, type:'inQueue', data: req.body.jsonDoc});
  res.status(200).send({key: job.id, course: req.body.id, type: 'inQueue', data: req.body.jsonDoc});

  job.on('complete', function(result) {
    console.log(result);
    job.log(result)
  });

  job.on('failed', function(result) {
    console.log(result);
    job.log(result)
  });

});

app.listen(PORT, function () {
  console.log('server listening on port: ' + PORT);
});
