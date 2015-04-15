## Description
Web app that displays a tweet stream based on given keywords. 
It uses NodeJS to listen to a tweet stream and emits tweets to the browser using Socket.io.


## Installation
```
npm install
	
```



## Usage


If you don't have a [Twitter app](https://dev.twitter.com/apps) create one to use the streaming API. 

In server/creds.js put your keys and access tokens

Then 

```
gulp start

```

You can access the app via localhost:8080 

## What it looks like

![Example ](http://i.imgur.com/pFXoq1B.png)

## Styling

You can completely change the styling by changing the css in public/app/css/tweet-dom-creator.css 
the html in public/app/templates/tweet-dom.html

## Client-side editing

For client-side editing & debugging run : 

```
gulp watch-scripts

```