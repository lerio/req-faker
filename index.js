var config = require('config'),
    CronJob = require('cron').CronJob,
    faker = require('faker')
    fs = require('fs'),
    request = require('request');

function generateOrder() {
  var requestBody = {
    billing_address: {
      country: faker.address.country(),
      street: faker.address.streetAddress(),
      zip: faker.address.zipCode()
    },
    external_id: faker.random.number(),
    placed: faker.date.past,
    shipping_address: {
      country: faker.address.country(),
      street: faker.address.streetAddress(),
      zip: faker.address.zipCode()
    },
    uuid: faker.random.uuid()
  };

  return requestBody;
}

function logUUID(uuid) {
  fs.appendFile(config.get('uuid_log_file'), uuid+"\n", function(err) {
    if (err) {
      return console.log('Error writing file: ' + err);
    }
  });
}

function postRequest(requestBody) {
  request.post(
    config.get('es_endpoint'),
    {json: requestBody},
    function (error, response) {
      if (response.statusCode === 201) {
        logUUID(requestBody.uuid)
      }
    }
  );
}

new CronJob('*/'+config.get('wait_between_request_blocks')+' * * * * *', function() {
  for (var i = 0; i < config.get('requests_per_block'); i++) {
    postRequest(generateOrder());
  }
}, null, true, "Europe/Berlin");
