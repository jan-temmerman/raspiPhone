var soundplayer = require("sound-player")
var fs = require('fs')
var txtomp3 = require("text-to-mp3")
const fetch = require("node-fetch");
var Gpio = require('onoff').Gpio;

const button = new Gpio(26, 'in', 'rising', {debounceTimeout: 10})
let isPlaying = false

let options = {
    filename: "FileName.mp3",
    gain: 100,
    debug: false,
    player: 'mpg321'
}

console.log(button)

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
        console.log("Error", err);
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
        writeAudioFile(data.joke)
    })
}