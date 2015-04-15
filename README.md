## Description
Web app that displays a tweet stream based on given keywords. 
It uses NodeJS to listen to a tweet stream and emits tweets to the browser using Socket.io.


## Usage


```
npm install
	
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

Then run :

```
gulp start

```


You can access the app via localhost:8080 

## What it looks like

![Example ](http://i.imgur.com/pFXoq1B.png)

## Styling

You can completely change the styling by changing the css in public/app/css/tweet-dom-creator.css and public/app/css/main.css
and the html in public/app/templates/tweet-dom.html

Run watch-scripts task to see the changes : 

```
gulp watch-scripts

```