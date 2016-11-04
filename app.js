var http = require('http');
http.createServer(function(request, response) {
    var body = [];
    var url = request.url;
    request.on('error', function(err) {
        console.error(err);
    }).on('data', function(chunk) {
        body.push(chunk);
    }).on('end', function() {
        body = Buffer.concat(body).toString();

        response.on('error', function(err) {
            console.error(err);
        });

        response.statusCode = 200;
        response.write('Hello World 2!');
        response.end();
    });
}).listen(3000);