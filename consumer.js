var kue = require('kue');
var axios = require('axios');

const config = require('./config');

var instance = axios.create({
  baseURL: config.API_BULK_POST
});
instance.defaults.headers.post['Content-Type'] = 'application/json';

var queue = kue.createQueue({
  redis: {
    port: 6379,
    host: 'localhost'
  }
});

queue.process('cs-indexing', 20, function(job, done){
  instance.post('/', {
    data: job.data.jsonDoc
  })
  .then(function(response){
    if (response.data.httpStatusCode !== 200 || response.data.httpStatusCode !== 400) {
      return done(null,
        { key: job.id,
          id: job.data.id,
          type: 'Complete with errors',
          status: response.data.httpStatusCode,
          data: response.data.debugInformation
        }
      );
    }
  })
  .catch(function (error) {
    console.log(error);
    if (error.response) {
      return done(
        new Error(`Unexpected error: The indexation to ES failed, document: ${job.data.documentId}, Queue id is: ${job.data.id}. error: ${error.response.statusText}`)
      );
    } else {
      return done(
        new Error(`Unexpected error: The indexation to ES failed, document: ${job.data.documentId}, Queue id is: ${job.data.id}. error: ${error.response.statusText}`)
      );
    }
  });
});
