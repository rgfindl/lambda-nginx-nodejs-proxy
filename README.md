# lambda-nginx-nodejs-proxy
API Proxy to AWS Lambda's, using nginx, nodejs, and running on EC2.

## User Data
```
#!/bin/bash
# Instal nginx, git and start
yum update -y
sudo yum install -y nginx git
service nginx start

# Install node & npm
sudo yum install -y --enablerepo=epel npm
sudo npm install -g forever

# Pull down code, install deps, and run
sudo git clone https://github.com/rgfindl/lambda-nginx-nodejs-proxy
sudo cd lambda-nginx-nodejs-proxy
sudo npm install
sudo npm start

# Configure nginx


```

```
#!/bin/bash
# Install node.js
# 1. update any out of date packages
sudo apt-get update

# 2. install nodejs
sudo apt-get install nodejs

# 3. install node package manager
sudo apt-get install npm

# 4. add node to command line
sudo ln -s /usr/bin/nodejs /usr/bin/node

# Install nginx
# 1. install nginx
sudo apt-get install nginx

``