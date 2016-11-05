var http = require('http');
var URL = require('url');
var _ = require('lodash');
var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
var docClient = new AWS.DynamoDB.DocumentClient();

//
// DynamoDB functions.
//
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

//
// http server
//
http.createServer(function(request, response) {
    var body = [];
    var url = request.url;
    console.log(url);
    var url_parsed = URL.parse(url, true);
    console.log(JSON.stringify(url_parsed, null, 3));
    request.on('error', function(err) {
        console.error(err);
    }).on('data', function(chunk) {
        body.push(chunk);
    }).on('end', function() {
        body = Buffer.concat(body).toString();

        response.on('error', function(err) {
            console.error(err);
        });

        console.log(request.method);
        if (!_.isNil(url_parsed.query.ec2)) {
            //
            // Direct to DynamoDB.
            //
            if (request.method === 'GET') {
                functions.get(url_parsed.query.email, function(err, data) {
                    response.setHeader('Content-Type', 'application/json');
                    if (err) {
                        response.statusCode = 500;
                        response.write(JSON.stringify(err));
                        response.end();
                    } else {
                        console.log(data);
                        if (_.isEmpty(data)) {
                            response.statusCode = 404;
                            response.write('Not Found');
                            response.end();
                        } else {
                            response.statusCode = 200;
                            data.ec2=true;
                            response.write(JSON.stringify(data));
                            response.end();
                        }
                    }
                });
            } else {
                var user = JSON.parse(body);
                console.log(event.body);
                functions.put(user, function(err, data) {
                    response.setHeader('Content-Type', 'application/json');
                    if (err) {
                        response.statusCode = 500;
                        response.write(JSON.stringify(err));
                        response.end();
                    } else {
                        console.log(data);
                        response.statusCode = 200;
                        data.ec2=true;
                        response.write(JSON.stringify(data));
                        response.end();
                    }
                });
            }
        } else {
            //
            // Lambda then to DynamoDB.
            //
            if (request.method === 'GET') {
                var params = {
                    FunctionName: url_parsed.query.lambda, /* required */
                    Payload: JSON.stringify({
                        queryStringParameters: {
                            email: url_parsed.query.email
                        },
                        httpMethod: 'GET'
                    })
                };
            } else {
                var params = {
                    FunctionName: url_parsed.query.lambda, /* required */
                    Payload: JSON.stringify({
                        body: body,
                        httpMethod: 'POST'
                    })
                };
            }
            var lambda = new AWS.Lambda();
            lambda.invoke(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    response.setHeader('Content-Type', 'application/json');
                    response.statusCode = 500;
                    response.write(JSON.stringify(err));
                    response.end();
                } else {
                    console.log(data);
                    response.setHeader('Content-Type', 'application/json');
                    response.statusCode = data.StatusCode;
                    response.write(JSON.parse(data.Payload).body);
                    response.end();
                }
            });
        }
    });
}).listen(3000);