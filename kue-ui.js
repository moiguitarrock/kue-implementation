var kue = require('kue');

var jobs = kue.createQueue({
  redis: {
    port: 6379,
    host: 'localhost'
  }
});
var PORT = process.env.PORT || 3000;

kue.app.listen(3000, function(){
  console.log('kue UI listening on port: ' + PORT);
});
