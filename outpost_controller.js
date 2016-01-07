var five = require('johnny-five'),
    PushBullet = require('pushbullet'),
    time = require('time'),
    express = require('express'),
    app = express(),
    httpServer = require('http').createServer(app),
    io = require('socket.io')(httpServer);
    Forecast = require('forecast'),
    colorMap = require('./leds/leds-colors.js'),
    keys = require('./keys.js');

var board = new five.Board(),
    pusher = new PushBullet(keys.pushbullet_key),
    now = new time.Date(),
    stream = pusher.stream(),
    forecast = new Forecast({
        service: 'forecast.io',
        key: keys.forecast_key,
        units: 'farenheit',
        cache: true,
        ttl: { hours: 3},
    });

    var nightMode = false;
    var nightModeOveride = false;
    var lastIntensity = 0;
    var curIntensity = 0;
    var curPos = 0;
    var endPos = colorMap.rainbow.length;
    var bVal = 2;
    var breatheMode = true;
    var rainbowMode = true;
    var direction = "up";
    var curColor = colorMap.color["cyan"];
    var port = 3000;
    var prevState = {
        breatheMode : false,
        rainbowMode : false,
    }

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

httpServer.listen(port);

now.setTimezone('America/New_York');

board.on("ready", function() {
    
    var leds = new five.Led.RGB({
        pins: {
            red: 3,
            green: 5,
            blue: 6,
        }
    });

    this.repl.inject({
        leds: leds,
    });

    
    leds.on();
    leds.color(colorMap.color['green']);

///////////////////////////////////////////////////////////////////////////////
///  stream events occur when pushbullet has been updated of a notification
//
//
//
///////////////////////////////////////////////////////////////////////////////


    stream.connect();

    stream.on('connect', function() {
        idleState(leds); 
        console.log('connected');
        console.log(time.localtime(Date.now()/1000).hours);

    });
     
    stream.on('push', function(push) {
        switch(push.type) {
            case 'sms_changed':
                    if (push.notifications.length != 0) {
                        notificationState(leds, "green");
                    }
                    break;
            case 'mirror':
                    switch(push.application_name) {
                        case 'Clock':
                            notificationState(leds, "red");
                            break;
                        case 'Phone':
                            if (push.body === 'Incoming call\n') {
                                notificationState(leds, "blue"); 
                            }
                            break;
                        case 'Hangouts':
                            notificationState(leds, "green");
                            break;    
                        default:
                            console.log(push);
                    }
                    break;
            case 'dismissal':
                idleState(leds);                
                break;
            default:
                console.log(push);
        }
    });

    stream.on('nop', function() {
        if(!rainbowMode) {
            idleState(leds);
        }
    });

    stream.on('error', function() {
        leds.color(colorMap.color["red"]);
        leds.strobe(100);
        console.log('error');
    });

    /*forecast.get([39.1343,-84.5117], function(err, weather) {
        if(err) return console.dir(err);

        //var curTemp = weather.currently.temperature;
        var curTemp = 60;

        if (curTemp <= 0) {
            currColor = colorMap["white"];   
        } else if ( curTemp > 0 && curTemp <= 35 ) { 
            currColor = colorMap["icyblue"];
        } else if ( curTemp > 35 && curTemp <= 50 ) {
            currColor = colorMap["blue"];
        } else if ( curTemp > 50 && curTemp <= 70) {
            currColor = colorMap["yellow"];
        } else if ( curTemp > 70 && curTemp <= 85) {
            currColor = colorMap["orange"]; 
        } else {
            currColor = colorMap["red"];
        }
        leds.color(curColor);
        leds.intensity(2);
    });*/

    var count = 0;

    io.on('connection', function (socket) {
        //console.log(socket);

        socket.on('nightMode:on', function(data) {
            nightModeOveride = false;
            leds.stop().off();
            console.log('NightMode On Received');
        });

        socket.on('nightMode:off', function(data) {
            nightModeOveride = true;
            leds.on();
            console.log('NightMode Off Received');
        });

        socket.on('breatheMode:on', function(data) {
            breatheMode = true;
            prevState.breatheMode = true;
            rainbowMode = false;
            prevState.rainbowMode = false;
            console.log('breatheMode On Received');
        });

        socket.on('breatheMode:off', function(data) {
            breatheMode = false;
            prevState.breatheMode = false;
            console.log('breatheMode Off Received');
        });

        socket.on('rainbowMode:on', function(data) {
            rainbowMode = true;
            prevState.rainbowMode = true;
            breatheMode = false;
            prevState.breatheMode = false;
            console.log('rainbowMode On received')
        });

        socket.on('rainbowMode:off', function(data) {
            rainbowMode = false;
            prevState.rainbowMode = false;
        });
        
        socket.on('bSlider', function(data) {
            bVal = data;
            leds.intensity(bVal);
        });

        socket.on('colorUpdate', function(data) {
            if (data.clr != '#000000'){
                curColor = data.clr;
                leds.color(data.clr);
            }
            leds.intensity(bVal);
        });

        socket.on('error', function(err) {
            console.log(err.stack);
        });
    });



///////////////////////////////////////////////////////////////////////////////
//
//  Timers, the below functions cause events to occur at specific times.
//
//
//
//
///////////////////////////////////////////////////////////////////////////////

    setInterval(function(){ // every minute check what time it is
        if (!nightModeOveride) {
            var curHour = time.localtime(Date.now()/1000).hours;
            if (curHour >= 0 && curHour < 8) {
                nightMode = true;
            } else {
                nightMode = false;
            }
        }
    }, 60000);

   setInterval(function() {
        if (breatheMode) {
            breathe(leds);
        } else if (rainbowMode) {
            rainbow(leds);
        }
    }, 90);


});

var idleState = function(leds) {
    breatheMode = prevState.breatheMode;
    rainbowMode = prevState.rainBowMode;
    if (nightMode === true) {
        console.log('sleepy time.. ZZZzzz..');
        leds.stop().off();
    } else {
        leds.stop();
        if (breatheMode) {
            leds.intensity(curIntensity);
        } else {
            leds.intensity(bVal);
        }
        leds.color(curColor);
    } 
}

var notificationState = function(leds, color) {
    prevState.breatheMode = breatheMode;
    prevState.rainbowMode = rainbowMode;
    breatheMode = false;
    leds.on();
    leds.intensity(100);
    leds.color(colorMap.color[color]);
    leds.strobe(500);
}

var breathe = function(leds) {
    if (lastIntensity === 20) {
        direction = "down";
    } else if (lastIntensity === 0) {
        direction = "up";
    }

    if (direction === "up") {
        curIntensity = lastIntensity + 1;
        lastIntensity = curIntensity;
        leds.intensity(curIntensity);
    } else {
        curIntensity = lastIntensity - 1;
        lastIntensity = curIntensity;
        leds.intensity(curIntensity);
    }
}

var rainbow = function(leds) {
        if (curPos >= endPos - 1) {
            curPos = 0; // iterate to next color  
        } else {
            curPos++;
        }
        leds.color(colorMap.rainbow[curPos]);
}
