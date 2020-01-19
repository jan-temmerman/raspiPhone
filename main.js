// Jan Temmerman
var soundplayer = require("sound-player")
var fs = require('fs')
var txtomp3 = require("text-to-mp3")
const fetch = require("node-fetch");
var Gpio = require('onoff').Gpio;
const Oled = require('oled-disp');

const oled = new Oled({ width: 128, height: 64, dcPin: 23, rstPin : 24}); // 7pin spi, rasp
const button = new Gpio(26, 'in', 'rising', {debounceTimeout: 10})
let isPlaying = false

let options = {
    filename: "FileName.mp3",
    gain: 100,
    debug: false,
    player: 'mpg321'
}

button.watch((err, value) => {
  if (err) {
    throw err;
  }
 
  if(!isPlaying) {
    isPlaying = true
    fetchJoke()
  }
  console.log("button pushed")
});
//ok

var player = new soundplayer(options)



const writeAudioFile = (message) => {
    txtomp3.getMp3(message).then(function(binaryStream){
    var file = fs.createWriteStream("FileName.mp3"); // write it down the file
    file.write(binaryStream);
    file.end();
    playSound()
    })
    .catch(function(err){
        fetchJoke()
    });
}

const playSound = () => {
    player.play();

    player.on('complete', function() {
        isPlaying = false
    });
    
    player.on('error', function(err) {
        console.log('Error occurred:', err);
    });
}

const fetchJoke = () => {
    fetch("https://icanhazdadjoke.com/", {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
    })
    .then((resp) => resp.json()) // Transform the data into json
    .then((data) => {
        console.log(data.joke)
        drawOled(data.joke)
        writeAudioFile(data.joke)
    })
}

const drawOled = (text) => {
    oled.begin(function(){
        oled.clearDisplay();
        oled.setCursor(1, 1);
        oled.writeString(1, text, 0, true, true);
        oled.update();
    });
}

// Text example (kor and eng
// PNG example (128x64 png only)
/*pngtolcd("a.png", false, function(err, bitmap) {
  oled.buffer = bitmap;
  oled.update();
})*/