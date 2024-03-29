var five = require('johnny-five');
var colorMap = require('./led-colors.js');
var hardwareSupport = require('../config/hardware.js');


var leds;
var board;
var toggle;
var silentMode = false;
var prevState = {
    breatheMode : false,
    rainbowMode : false,
}

var curColor = colorMap.color["cyan"];
var nightMode = false;
var lastIntensity = 0;
var curIntensity = 0;
var curPos = 0;
var endPos = colorMap.rainbow.length;
var bVal = 2;
var breatheMode = true;
var rainbowMode = true;
var direction = "up";

exports.initBoard = function(callback){
    board = new five.Board();
    board.on("ready", function() {
        if(hardwareSupport.toggle_enabled){
           toggle = new five.Switch(8);
           silentMode = !toggle.isClosed;
           
           toggle.on("close", function(){
                console.log("notifications enabled. Silent Mode Off");
                silentMode = false;
                leds.on();
            });
            
            toggle.on("open", function(){
                console.log("notifications disabled. Silent Mode on");
                silentMode = true;
                leds.off();
            });
        }

        leds = new five.Led.RGB({
        pins: {
            red : 3,
            green: 5,
            blue: 6,
        }
    });
    console.log(leds);
    this.repl.inject({
       leds: leds,
    });
    
    if(!silentMode){
        leds.on();
    leds.color(colorMap.color['green']);
    setInterval(function() {
        if (breatheMode) {
            breathe(leds);
        } else if (rainbowMode) {
            rainbow(leds);
        }
    }, 90);
    }  
    callback();
    });
  
}

exports.notificationState = function(color){
    if (!nightMode) {
        prevState.breatheMode = breatheMode;
        prevState.rainbowMode = rainbowMode;
        breatheMode = false;
        rainbowMode = false;
        leds.on();
        leds.intensity(100);
        leds.color(colorMap.color[color]);
        leds.strobe(500);
    }
};

exports.idleState = function(){
    breatheMode = prevState.breatheMode;
    rainbowMode = prevState.rainBowMode;
    leds.stop();
    if (!nightMode) {
        if (breatheMode) {
            leds.intensity(curIntensity);
        } else {
            leds.intensity(bVal);
        }
        leds.color(curColor);
    } 
};

var breathe = function(){
    if (bVal > 0) {
        if (lastIntensity >= bVal) {
            direction = "down";
        } else if (lastIntensity <= 0) {
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
};

var rainbow = function(){
      if (curPos >= endPos - 1) {
            curPos = 0; // iterate to next color  
        } else {
            curPos++;
        }
        leds.color(colorMap.rainbow[curPos]);
};

exports.SetNightMode = function(nightModeSetting){
    nightMode = nightModeSetting;
    if(nightModeSetting){
        console.log('Nightmode On Received');
    } else {
        leds.on();
        console.log('NightMode Off Received');
    }
};

exports.SetBreatheMode = function(breatheModeSetting){
    breatheMode = breatheModeSetting;
    prevState.breatheMode = breatheModeSetting;
    if(breatheModeSetting){
        rainbowMode = false
        prevState.rainbowMode = false;
        console.log('breatheMode On Received');
    } else {
      console.log('breatheMode Off Received'); 
    }
};

exports.SetRainbowMode = function(rainbowModeSetting){
    rainbowMode = rainbowModeSetting;
    prevState.rainbowMode = rainbowModeSetting;
    
    if(rainbowMode){
        breatheMode = false;
        prevState.breatheMode = false;
        console.log('rainbowMode On received')
    } else{
        breatheMode = true;
        prevState.breatheMode = true;
        console.log('rainbowMode Off received');
    }
};

exports.SetIntensity = function(intensity){
    bVal = intensity;
    leds.intensity(bVal);
};

exports.SetColor = function(color){
    curColor = color;
    leds.color(curColor);
    leds.intensity(bVal);
};

exports.SetTemp = function (temp){

        if (temp <= 0) {
            curColor = colorMap["white"];   
        } else if ( temp > 0 && temp <= 35 ) { 
            curColor = colorMap["icyblue"];
        } else if ( temp > 35 && temp <= 50 ) {
            curColor = colorMap["blue"];
        } else if ( temp > 50 && temp <= 70) {
            curColor = colorMap["yellow"];
        } else if ( temp > 70 && temp <= 85) {
            curColor = colorMap["orange"]; 
        } else {
            curColor = colorMap["red"];
        }
        leds.color(curColor);
        leds.intensity(2);
};

exports.SetError = function(){
    leds.color(colorMap.color["red"]);
        leds.strobe(100);
        console.log('error');
};

exports.setNop = function(){
    if(!rainbowMode) {
            this.idleState();
        }
};
