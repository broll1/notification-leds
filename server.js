var express = require('express');
var app = express();
var httpServer = require('http').createServer(app);
var johnnyFive = require('./modules/five.js');
var forecaster = require('./modules/forecast.js');
var pushbullet = require('./modules/pushbullet.js');
var socket = require('./modules/socket.js');
var port = 3000;



app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

httpServer.listen(port);

// Init The Stuffs
johnnyFive.initBoard(function callback(){
    forecaster.InitForecast(johnnyFive);
    pushbullet.InitPushBullet(johnnyFive);
    socket.InitSocket(httpServer,johnnyFive);
});
