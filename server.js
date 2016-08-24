var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var kue = require('kue');
var log4js = require('log4js');
var axios = require('axios');

const config = require('./config');

var PORT = process.env.PORT || 8080;

var app = express();
var jobs = kue.createQueue({
  disableSearch: false,
  redis: {
    port: config.REDIS_PORT,
    host: config.REDIS_HOST
  }
});

const date = new Date();
const filename = date.getFullYear() + '' + (date.getMonth() + 1) + '' + date.getDate();
log4js.configure({
  appenders: [
    { type: 'console' },
    { type: 'file', filename: `/var/log/kue-server-${filename}.log`, category: 'error' }
  ]
});
var logger = log4js.getLogger('error');

app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

// POST: localhost:8080/offering
app.post('/offering', function(req, res, next) {

  var job = jobs.create('cs-indexing', {
    title: 'ES indexing',
    id: req.body.id,
    documentId: req.body.documentId,
    jsonDoc: req.body.jsonDoc
  }).searchKeys(['id', 'title'])
    .attempts(5)
    .backoff({delay: 20000, type: 'fixed'})
    .removeOnComplete(true) //just remove the jobs successfully completed
    .save(function(err){
      if (err) {
        job.log({key: job.id, type: 'jobError', data: err});
        res.status(500).send('something go wrong with the job: ' + job.id + ', for more info see the logs');
      }
  });

  res.status(200).send({documentId: req.body.documentId, type: 'InQueue'});

  job.on('complete', function(result){
    axios.delete(`${config.API_QUEUE_ENDPOINT}?id=${result.id}`);
  });

  jobs.on('job failed', function(id, result){
    kue.Job.get(id, function(err, job){
      job.log(result);
      axios.patch(`${config.API_QUEUE_ENDPOINT}?id=${job.data.id}`, {
        status: 'PENDING'
      });
      logger.setLevel('ERROR');
      logger.error(result);
    });
  })

});

app.listen(PORT, function () {
  console.log('server listening on port: ' + PORT);
});
