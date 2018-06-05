FROM amazonlinux

WORKDIR /tmp
#install the dependencies
RUN yum -y install gcc-c++ && yum -y install findutils

RUN touch ~/.bashrc && chmod +x ~/.bashrc

RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.5/install.sh | bash

RUN source ~/.bashrc && nvm install 6.10

RUN source ~/.bashrc; npm init -f -y; npm install sharp --save; npm install querystring --save; npm install --only=prod ; npm install -g lambda-local

WORKDIR /build