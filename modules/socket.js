var io;
var five;

exports.InitSocket = function(httpServer, initFive){
    five = initFive;
    io = require('socket.io')(httpServer);
    
    io.on('connection', function (socket) {

        socket.on('nightMode:on', function(data) {
            five.SetNightMode(true);
        });

        socket.on('nightMode:off', function(data) {
            five.SetNightMode(false);
        });

        socket.on('breatheMode:on', function(data) {
            five.SetBreatheMode(true);
        });

        socket.on('breatheMode:off', function(data) {
            five.SetBreatheMode(false);
        });

        socket.on('rainbowMode:on', function(data) {
            five.SetRainbowMode(true);
        });

        socket.on('rainbowMode:off', function(data) {
            five.SetRainbowMode(false);
        });
        
        socket.on('bSlider', function(data) {
            five.SetIntensity(data);
        });

        socket.on('colorUpdate', function(data) {
            if (data.clr != '#000000'){
                five.SetColor(data.clr);
            }
        });

        socket.on('error', function(err) {
            console.log(err.stack);
        });
    });
}
