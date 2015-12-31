var five = require('johnny-five'),
    PushBullet = require('pushbullet'),
    time = require('time'),
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
    var breatheMode = true;
    var direction = "up";
    var curColor = colorMap["cyan"];

    var prevState = {
        breatheMode : false,
    }

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
    leds.color(colorMap['green']);



///////////////////////////////////////////////////////////////////////////////
//
//  stream events occur when pushbullet has been updated of a notification
//
//
//
///////////////////////////////////////////////////////////////////////////////


    stream.connect();

    stream.on('connect', function() {
        idleState(leds); 
        console.log('connected');
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
        idleState(leds);
    });

    stream.on('error', function() {
        leds.color(colorMap["red"]);
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
        }
    }, 90);

});

var idleState = function(leds) {
    breatheMode = prevState.breatheMode;
    if (nightMode === true) {
        leds.stop().off();
    } else {
        leds.stop();
        leds.intensity(2);
        leds.color(curColor);
    } 
}

var notificationState = function(leds, color) {
    prevState.breatheMode = breatheMode;
    breatheMode = false;
    leds.on();
    leds.intensity(100);
    leds.color(colorMap[color]);
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
