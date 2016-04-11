var PushBullet = require('pushbullet');
var keys = require('../../config/secrets.js')
var five;



exports.InitPushBullet = function(fiveBoard){
    five = fiveBoard;
    pusher = new PushBullet(keys.pushbulletKey);
    var stream = pusher.stream();
    stream.connect();
    stream.on('connect', function() {
        five.idleState(); 
        console.log('connectedpushbull');
    });
    
     stream.on('push', function(push) {
         console.log(push.type);
        switch(push.type) {
            case 'sms_changed':
                    if (push.notifications.length != 0) {
                        five.notificationState("green");
                    }
                    break;
            case 'mirror':
                    switch(push.application_name) {
                        case 'Clock':
                            five.notificationState("red");
                            break;
                        case 'Phone':
                            if (push.body === 'Incoming call\n') {
                                five.notificationState("blue"); 
                            }
                            break;
                        case 'Hangouts':
                            five.notificationState("green");
                            break;    
                        default:
                            console.log(push);
                    }
                    break;
            case 'dismissal':
                five.idleState();               
                break;
            default:
                console.log(push);
        }
    });

    stream.on('nop', function() {
        five.setNop();
    });

    stream.on('error', function() {
        five.SetError();
    });   
}