## Description

Archive, analyze and display tweets retrieved from the public tweet stream based on specific search terms.

The idea behind the project is for researchers, data analysts and enthusiasts to get started easily analysing data from the twitter feed and/or displaying it in creative ways.

Archived tweets are processed for language, geolocation and sentiment and stored in mongodb. 

They can be streamed in real-time to the client and displayed as a twitter feed.

You can also see the location of the geotagged tweet on a Google Map either as markers or as a heatmap spanning the world.

I will try to keep an instance running for testing it out, but for research it's highly recommended to build your own. The process is greatly simplified as explained in the deployment section.


## Setup

```javascript
    remoteHost = 'yourHostName',
    username = 'username',
    port = 22,
    keyPath = 'pathToKey'
```

If you don't have a [Twitter app](https://dev.twitter.com/apps) create one to use the streaming API. 

In server/creds.js put your keys and access tokens

```javascript
var creds = {
	twitter: {
		"consumer_key": "xxx",
		"consumer_secret": "xxx",
		"token": "xxx",
		"token_secret": "xxx"
	}
};
```

To use Google Maps create a Google Maps key from the [Google Developer Console](https://console.developers.google.com/)

And put the key you got in public/app/js/creds.js

```javascript
var creds = {
	google_maps:'yourApiKey'
};
```
Then install the dependencies

```
	npm install
```

## Development
#### Gulp tasks
```
	gulp watch-all
```
When you're working on server and client-side coding.
Will run nodemon and gulp watch on css and client-side js files 

Also starts Mongodb instance on Port 27017

```
	gulp watch-scripts
```
When you're working on client-side code only.
Will gulp-watch css and js changes and recompile.	
```
	gulp nodemon
```
As the name suggests will run nodemon and listen to changes on server.js and files in ./server/

```
	gulp build-remote
```
Builds an environment on top of an empty Ubuntu Machine ready to start listening and archiving tweets. Installs all dependent software, clones repo, and prepares environment. For more details, see the [Deployment](#deployment) section

```
	gulp deploy --branch {{branch}}
```
After committing your changes and pushing them to the repo, deploy the new code on the server on the selected branch.
if the branch argument is not passed master will be used.



## Deployment

Put in your Twitter and Google Maps keys in the creds files : 

### Automatic Deployment

Automatic deployment is made for a remote ubuntu 14.04 machine with password-less ssh-login. (Will migrate to Docker when I have the time)

Create an ubuntu 14.04 machine get it's ip and in gulpfile.js set your hostname and username and the path to the ssh key you want to use to login. [How to login with ssh keys ?](http://askubuntu.com/questions/46930/how-can-i-set-up-password-less-ssh-login) 

```javascript
    remoteHost = 'yourHostName',
    username = 'username',
    port = 22,
    keyPath = 'pathToKey'
```
Then run 

```
	gulp build-remote
```
Go make a cup of coffee. <br />
Come back and you should have an instance running.
	
### Manual Deployment

1. ssh into your server. 
2. Clone repo : ```git clone https://github.com/RakanNimer/twitter-stream-display ```
3. ```cd twitter-stream-display```
4. ```npm install ```
5. ``` npm install -g pm2 ```
5. ``` gulp start-prod ```

Requirements : 
Mongo should be installed on your system. [How to install mongo on Ubuntu](http://docs.mongodb.org/manual/tutorial/install-mongodb-on-ubuntu/)


### Credits

Thanks To [Keen.io (an excellent analytics company)](http://keen.io) for the Bootstrap theme.