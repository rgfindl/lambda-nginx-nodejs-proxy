var http = require('http');
var URL = require('url');
var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});

var execution_count = 0;
var execution_latency = 0;

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

        var lambda = new AWS.Lambda();
        console.log(request.method);
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
        var now = new Date();
        lambda.invoke(params, function(err, data) {
            if (err) {
                console.log(err, err.stack);
                response.setHeader('Content-Type', 'application/json');
                response.statusCode = 500;
                response.write(JSON.stringify(err));
                response.end();
            } else {
                var end = new Date();
                console.log('Execution time: '+(end.getTime()-now.getTime())+'ms');
                execution_count++;
                execution_latency += (end.getTime()-now.getTime());
                console.log('Execution avg: '+(execution_latency/execution_count)+'ms');
                console.log(data);
                response.setHeader('Content-Type', 'application/json');
                response.statusCode = data.StatusCode;
                response.write(JSON.parse(data.Payload).body);
                response.end();
            }
        });
    });
}).listen(3000);