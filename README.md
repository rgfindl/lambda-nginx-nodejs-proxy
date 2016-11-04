# lambda-nginx-nodejs-proxy
API Proxy to AWS Lambda's, using nginx, nodejs, and running on EC2.

##
Spin up an EC2 running Amazon Linux and use the User Data below.

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