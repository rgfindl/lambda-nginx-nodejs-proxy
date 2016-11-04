# nginx + node.js proxy to AWS Lambda
API Proxy to AWS Lambda's, using nginx, nodejs, and running on EC2.

This package is mainly used to test the latency between an EC2 and Lambda.

Why not use API Gateway?  We tried that as well.  The results are below.  At the time of testing
API Gateway uses CloudFront (public url) which added latency.

The results of the API Gateway + Lambda results are below, as are the results of the EC2 + Lambda load test.

## EC2 Setup
Spin up an EC2 running Amazon Linux and use the User Data below.

### EC2 IAM Role
Create an IAM Role that has permission to Invoke Lambda functions.
Use this Instance role when creating your EC2.

### User Data
```
#!/bin/bash
# Instal nginx, git and start
sudo yum update -y
sudo yum install -y nginx git
service nginx start

# Install node & npm
sudo yum install -y --enablerepo=epel npm
sudo npm install -g forever

# Pull down code, install deps, and run
sudo git clone https://github.com/rgfindl/lambda-nginx-nodejs-proxy
cd lambda-nginx-nodejs-proxy
sudo npm install
sudo npm start
cd /

# Configure nginx
sudo cp /lambda-nginx-nodejs-proxy/node_backend.conf /etc/nginx/conf.d/.
sudo cp /lambda-nginx-nodejs-proxy/api.conf /etc/nginx/default.d/.
service nginx restart
```

## Lambda Setup
Using serverless.com deploy the lambda found in /lambda.
```
cd lambda
npm install
serverless deploy
```

## Test your lambda

### Add data
```
curl -X POST -H "Content-Type: application/json" -d '{
"email":"<test_email>",
"name":"<test_name>"
}' "http://ec2-52-91-227-139.compute-1.amazonaws.com/api?lambda=<lambda_name>"
```

### Fetch data
```
http://ec2-52-91-227-139.compute-1.amazonaws.com/api?lambda=<lambda_name>&email=<test_email>"
```

## Load test results
A cold start was used with both tests.  Lambda requires some time to load after the method has been terminated or it is new.

### EC2 -> Lambda
Executed from local machine.

Path: Local machine -> EC2 -> Lambda

```
[Fri Nov 04 2016 12:09:43 GMT-0400 (EDT)] INFO Target URL:          http://ec2-52-91-227-139.compute-1.amazonaws.com/api?lambda=serverless-test-dynamodb-token-dev-hello&email=rgfindley@gmail.com
[Fri Nov 04 2016 12:09:43 GMT-0400 (EDT)] INFO Max time (s):        60
[Fri Nov 04 2016 12:09:43 GMT-0400 (EDT)] INFO Concurrency level:   1
[Fri Nov 04 2016 12:09:43 GMT-0400 (EDT)] INFO Agent:               none
[Fri Nov 04 2016 12:09:43 GMT-0400 (EDT)] INFO Requests per second: 10
[Fri Nov 04 2016 12:09:43 GMT-0400 (EDT)] INFO
[Fri Nov 04 2016 12:09:43 GMT-0400 (EDT)] INFO Completed requests:  591
[Fri Nov 04 2016 12:09:43 GMT-0400 (EDT)] INFO Total errors:        0
[Fri Nov 04 2016 12:09:43 GMT-0400 (EDT)] INFO Total time:          60.005051103 s
[Fri Nov 04 2016 12:09:43 GMT-0400 (EDT)] INFO Requests per second: 10
[Fri Nov 04 2016 12:09:43 GMT-0400 (EDT)] INFO Total time:          60.005051103 s
[Fri Nov 04 2016 12:09:43 GMT-0400 (EDT)] INFO
[Fri Nov 04 2016 12:09:43 GMT-0400 (EDT)] INFO Percentage of the requests served within a certain time
[Fri Nov 04 2016 12:09:43 GMT-0400 (EDT)] INFO   50%      102 ms
[Fri Nov 04 2016 12:09:43 GMT-0400 (EDT)] INFO   90%      131 ms
[Fri Nov 04 2016 12:09:43 GMT-0400 (EDT)] INFO   95%      160 ms
[Fri Nov 04 2016 12:09:43 GMT-0400 (EDT)] INFO   99%      698 ms
[Fri Nov 04 2016 12:09:43 GMT-0400 (EDT)] INFO  100%      3155 ms (longest request)
```

Average time as measured from the EC2 (node backend) to Lambda.
```
Execution avg: 83.27027027027027ms
```

### API Gateway + Lambda
```
[Tue Nov 01 2016 10:53:51 GMT-0400 (EDT)] INFO Target URL:          https://dm67hnzxkd.execute-api.us-east-1.amazonaws.com/dev/users?email=rgfindley@gmail.com
[Tue Nov 01 2016 10:53:51 GMT-0400 (EDT)] INFO Max time (s):        60
[Tue Nov 01 2016 10:53:51 GMT-0400 (EDT)] INFO Concurrency level:   1
[Tue Nov 01 2016 10:53:51 GMT-0400 (EDT)] INFO Agent:               none
[Tue Nov 01 2016 10:53:51 GMT-0400 (EDT)] INFO Requests per second: 10
[Tue Nov 01 2016 10:53:51 GMT-0400 (EDT)] INFO
[Tue Nov 01 2016 10:53:51 GMT-0400 (EDT)] INFO Completed requests:  591
[Tue Nov 01 2016 10:53:51 GMT-0400 (EDT)] INFO Total errors:        0
[Tue Nov 01 2016 10:53:51 GMT-0400 (EDT)] INFO Total time:          60.005699264 s
[Tue Nov 01 2016 10:53:51 GMT-0400 (EDT)] INFO Requests per second: 10
[Tue Nov 01 2016 10:53:51 GMT-0400 (EDT)] INFO Total time:          60.005699264 s
[Tue Nov 01 2016 10:53:51 GMT-0400 (EDT)] INFO
[Tue Nov 01 2016 10:53:51 GMT-0400 (EDT)] INFO Percentage of the requests served within a certain time
[Tue Nov 01 2016 10:53:51 GMT-0400 (EDT)] INFO   50%      143 ms
[Tue Nov 01 2016 10:53:51 GMT-0400 (EDT)] INFO   90%      184 ms
[Tue Nov 01 2016 10:53:51 GMT-0400 (EDT)] INFO   95%      221 ms
[Tue Nov 01 2016 10:53:51 GMT-0400 (EDT)] INFO   99%      840 ms
[Tue Nov 01 2016 10:53:51 GMT-0400 (EDT)] INFO  100%      3352 ms (longest request)
```