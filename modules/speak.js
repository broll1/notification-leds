var say = require('say') // This module is designed for linux. Change the name to Alex to run it on mac.


exports.speakMessage = function(sender, message){
    say.speak('', 'Message from ' + sender, function () {
        setTimeout(function() {
            say.speak('', message);
        }, 3000);  
    });
}

exports.speakCall = function(caller){
     say.speak('', 'Call from ' + caller);
}