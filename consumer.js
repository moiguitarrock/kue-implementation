var kue = require('kue');
var axios = require('axios');

var instance = axios.create({
  baseURL: 'http://test.api.cebroker.com/v2'
});
instance.defaults.headers.post['Content-Type'] = 'application/json';

var queue = kue.createQueue({
  redis: {
    port: 6379,
    host: 'localhost'
  }
});


queue.process('indexing-es', 20, function(job, done){
  console.log(job.data);
  instance.post('/search/courses', {
    data: job.data.jsonDoc
  })
  .then(function(response){
    if (response.status === 200) {
      console.log('indexed the course #' + job.data.id + ' to ES...');
      done(null, {key: job.id, course: job.data.id, type: 'Complete', status: response.status, data: response.data});
    } else {
      //TODO: error flow
      done(null, {key: job.id, course: job.data.id, type: 'Incomplete', status: response.status, data: response.data});
    }

  })
  .catch(function (error) {
    if (error.response) {
      //TODO: error flow
      done(null, {key: job.id, course: job.data.id, type: 'Error', status: error.response.status, data: error.response.data});
    } else {
      //TODO: error flow
      done(null, {key: job.id, course: job.data.id, type: 'Error', status: 500, data: error.message});
    }
  });

});
