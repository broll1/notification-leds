var Forecast = require('forecast');
var five;
var keys = require('../config/keys.js');

var forecast;

exports.InitForecast  = function(initFive){
    five = initFive;
    
     forecast = new Forecast({
        service: 'forecast.io',
        key: keys.forecast_key,
        units: 'farenheit',
        cache: true,
        ttl: { hours: 3},
    });
}


exports.GetForecast = function(){
    forecast.get([39.1343,-84.5117], function(err, weather) {
        if(err) return console.dir(err);
        five.SetTemp(weather.currently.temperature);
    });
}