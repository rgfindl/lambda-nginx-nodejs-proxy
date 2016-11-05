'use strict';

module.exports.users = function(event, context, callback) {
  try {

    var AWS = require('aws-sdk');
    AWS.config.update({
      region: "us-east-1"
    });
    var _ = require('lodash');
    var docClient = new AWS.DynamoDB.DocumentClient();

    var functions = {};

    functions.put = function(user, callback) {
      var params = {
        TableName:'usersTable',
        Key:{
          "email": _.toLower(user.email)
        },
        UpdateExpression: "set user_name = :name",
        ExpressionAttributeValues:{
          ':name':user.name
        },
        ReturnValues:"ALL_NEW"
      };
      console.log(JSON.stringify(params));
      docClient.update(params, function(err, data) {
        if (!err) {
          var data = data.Attributes;
          data.name = data.user_name;
          delete data.user_name;
        }
        callback(err, data);
      });
    };

    functions.get = function(email, callback) {
      var params = {
        TableName:'usersTable',
        Key:{
          email: email
        }
      };
      console.log(JSON.stringify(params));
      docClient.get(params, function(err, data) {
        if (!err && !_.isEmpty(data)) {
          var data = data.Item;
          data.name = data.user_name;
          delete data.user_name;
        }
        callback(err, data);
      });
    };

    console.log('EVENT');
    console.log(JSON.stringify(event));
    if (_.isEqual(event.httpMethod, 'GET')) {
      console.log('GET');
      var email = event.queryStringParameters.email;
      console.log(email);
      functions.get(email, function(err, data) {
        if (err) {
          console.log(err);
          var response = {
            statusCode: 500,
            body: JSON.stringify(err)
          };
        } else {
          console.log(data);
          if (_.isEmpty(data)) {
            var response = {
              statusCode: 404,
              body:'Not found'
            };
            callback(null, response);
          } else {
            var response = {
              statusCode: 200,
              body: JSON.stringify(data)
            };
            callback(null, response);
          }
        }
      });
    } else {
      console.log('POST');
      var user = JSON.parse(event.body);
      console.log(event.body);
      functions.put(user, function(err, data) {
        if (err) {
          console.log(err);
          var response = {
            statusCode: 500,
            body: JSON.stringify(err)
          };
        } else {
          console.log(data);
          var response = {
            statusCode: 200,
            body: JSON.stringify(data)
          };
          callback(null, response);
        }
      });
    }
  } catch (err) {
    console.log('ERROR');
    console.log(err);
    var response = {
      statusCode: 500,
      body: JSON.stringify(err)
    };
    callback(null, response);
  }
};
