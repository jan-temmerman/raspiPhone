// Jan Temmerman
var soundplayer = require("sound-player")
var fs = require('fs')
var txtomp3 = require("text-to-mp3")
const fetch = require("node-fetch");
var Gpio = require('onoff').Gpio;
const Oled = require('oled-disp');

const oled = new Oled({ width: 128, height: 64, dcPin: 23, rstPin : 24}); // 7pin spi, rasp
const button = new Gpio(26, 'in', 'rising', {debounceTimeout: 10})
const button2 = new Gpio(19, 'in', 'rising', {debounceTimeout: 10})

let isPlaying = false
let inCat = false
const categories = ['Jokes', 'Weather', 'Next Bus']
let catIndex = 0

fetch(`https://api.openweathermap.org/data/2.5/weather?q=mariakerke&units=metric&appid=f38af33bc60ddd081f0bf546afb23f4a`)
    .then(response => response.json())
    .then((responseJson)=> {
        if(responseJson.weather) {
            console.log(responseJson)
        }
    })
    .catch(error=>console.log(error))

const updateMenu = () => {
    oled.begin(() => {
        if(categories[catIndex] === 'Next Bus') {
            oled.clearDisplay();
            oled.setCursor(1, 16);
            oled.writeString(2, categories[catIndex], 0, true, true);
            oled.update();
        }  else {
            oled.clearDisplay();
            oled.setCursor(1, 26);
            oled.writeString(2, categories[catIndex], 0, true, true);
            oled.update();
        }
    })
}

let options = {
    filename: "FileName.mp3",
    gain: 100,
    debug: false,
    player: 'mpg321'
}

updateMenu()

button.watch((err, value) => {
  if (err) {
    throw err;
  }
 
  handleSelectedCat()
});

button2.watch((err, value) => {
    if (err) {
      throw err;
    }

    inCat = false

    if(catIndex < 2)
        ++catIndex
    else
        catIndex = 0

    updateMenu()
  });

var player = new soundplayer(options)

const handleSelectedCat = () => {
    let cat = categories[catIndex]

    switch(cat) {
        case 'Jokes':
            if(!isPlaying && inCat) {
                console.log('in cat')
                isPlaying = true
                fetchJoke()
            } else {
                oled.begin(function(){
                    oled.clearDisplay();
                    oled.setCursor(1, 1);
                    oled.writeString(1, 'Press again for a dad joke.', 0, true, true);
                    oled.update();
                });
                inCat = true
            }
            break

        case 'Weather':
            oled.begin(function(){
                oled.clearDisplay();
                oled.setCursor(1, 1);
                oled.writeString(1, 'Hier komt het weer', 0, true, true);
                oled.update();
            });
            inCat = true
            break

        case 'Next Bus':
            oled.begin(function(){
                oled.clearDisplay();
                oled.setCursor(1, 1);
                oled.writeString(1, 'Hier komt de volgende bus', 0, true, true);
                oled.update();
            });
            inCat = true
            break

        default:
            break
    }
}

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
        if(categories[catIndex] === 'Jokes')
            oled.begin(function(){
                oled.clearDisplay();
                oled.setCursor(1, 1);
                oled.writeString(1, 'Press again for a dad joke.', 0, true, true);
                oled.update();
            });
    });
    
    player.on('error', function(err) {
        console.log('Error occurred:', err);
    });
}

const fetchJoke = () => {
    oled.begin(function(){
        oled.clearDisplay();
        oled.setCursor(1, 1);
        oled.writeString(1, 'Fetching Joke...', 0, true, true);
        oled.update();
    });
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