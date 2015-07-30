require("date-format-lite");

var config = require('config'),
    CronJob = require('cron').CronJob,
    faker = require('faker')
    fs = require('fs'),
    request = require('request');

function getRandomAmount(min, max) {
  const TAX_RATE = 19;

  var amount = {};

  amount.net = Math.round((Math.random() * (max - min) + min) * 100) / 100;
  amount.gross = Math.round(amount.net * (TAX_RATE));
  amount.tax_amount = Math.round(amount.gross - amount.net);
  amount.tax_rate = TAX_RATE;

  return amount;
}

function generateOrder() {
  var orderAmount = getRandomAmount(10, 100);
  var consumerName = {
    first_name: faker.name.firstName,
    last_name: faker.name.lastName
  };
  var orderDate = new Date(faker.date.past()).format("iso");
  var requestBody = {
    external_id: faker.random.uuid(),
    sales_order_items: [],
    net: orderAmount.net,
    gross: orderAmount.gross,
    tax_amount: orderAmount.tax_amount,
    tax_rate: orderAmount.tax_rate,
    currency: "EUR",
    shipping_address: {
      first_name: consumerName.first_name,
      last_name: consumerName.last_name,
      country: faker.address.country(),
      street: faker.address.streetAddress(),
      zip: faker.address.zipCode()
    },
    billing_address: {
      first_name: consumerName.first_name,
      last_name: consumerName.last_name,
      country: faker.address.country(),
      street: faker.address.streetAddress(),
      zip: faker.address.zipCode()
    },
    placed: orderDate
  }

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
  request({
    method: 'POST',
    url: config.get('es_endpoint'),
    headers: {
      'Authorization': config.get('auth_token'),
      'Content-Type': 'application/json'
    },
    json: requestBody
  },
  function (error, response) {
    if (response.statusCode === 201) {
      console.log(response);
      logUUID(requestBody.uuid)
    } else {
      console.log(response);
    }
  });
}

new CronJob('*/'+config.get('wait_between_request_blocks')+' * * * * *', function() {
  for (var i = 0; i < config.get('requests_per_block'); i++) {
    postRequest(generateOrder());
  }
}, null, true, "Europe/Berlin");
