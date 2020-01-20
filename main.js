// Jan Temmerman
var soundplayer = require("sound-player")
var fs = require('fs')
var txtomp3 = require("text-to-mp3")
const fetch = require("node-fetch");
var Gpio = require('onoff').Gpio;
const Oled = require('oled-disp');
const dotenv = require('dotenv');
dotenv.config();

const oled = new Oled({ width: 128, height: 64, dcPin: 23, rstPin : 24}); // 7pin spi, rasp
const button = new Gpio(26, 'in', 'rising', {debounceTimeout: 10})
const button2 = new Gpio(19, 'in', 'rising', {debounceTimeout: 10})

let isPlaying = false
let inCat = false
const categories = ['Jokes', 'Weather', 'News', 'Next Bus']
const cities = ['Mariakerke', 'Ghent', 'Antwerpen', 'Brussel', 'Rome', 'Moscow']
let catIndex = 0
let cityIndex = 0
let articleIndex = 0
let weather = []
let articles = []

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
    if(!inCat) {
        if(catIndex < categories.length - 1)
            ++catIndex
        else
            catIndex = 0
    }

    inCat = false
    cityIndex = 0
    weather = []

    updateMenu()
  });

var player = new soundplayer(options)

const handleSelectedCat = () => {
    let cat = categories[catIndex]

    switch(cat) {
        case 'Jokes':
            if(!isPlaying && inCat) {
                isPlaying = true
                fetchJoke()
            } else {
                drawOled('Press again for a dad joke.')
                inCat = true
            }
            break

        case 'Weather':
            if(!inCat) {
                inCat = true
                fetchWeather()
            } else {
                oled.begin(function(){
                    oled.clearDisplay();
                    oled.setCursor(1, 1);
                    oled.writeString(1, weather[cityIndex].city, 0, true, true);
                    oled.setCursor(1, 14);
                    oled.writeString(1, weather[cityIndex].temp + '°C', 0, true, true);
                    oled.setCursor(1, 27);
                    oled.writeString(1, weather[cityIndex].description, 0, true, true);
                    oled.update();
                });
                if(cityIndex < weather.length - 1)
                    ++cityIndex
                else
                    cityIndex = 0
            }
            break

        case 'Next Bus':
            drawOled('Hier komt de volgende bus')
            inCat = true
            break

        case 'News':
            if(!inCat) {
                inCat = true
                fetchNews()
            } else {
                drawOled(articles[articleIndex].title)
                if(articleIndex < articles.length - 1)
                    ++articleIndex
                else
                    articleIndex = 0
            }
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
            drawOled('Press again for a dad joke.')
    });
    
    player.on('error', function(err) {
        console.log('Error occurred:', err);
    });
}

const fetchWeather = () => {
    drawOled('Fetching Weather...')

    new Promise((resolve, reject) => {
        cities.forEach((city, index) => {
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${process.env.WEATHER_API_KEY}`)
            .then(response => response.json())
            .then((responseJson)=> {
                if(responseJson.weather) {
                    weather.push({
                        city: city,
                        temp: responseJson.main.temp,
                        description: responseJson.weather[0].description,
                    
                    })
                    if (index === cities.length - 1) resolve()
                }
            })
            .catch(error=>console.log(error))
        })
    })
    .then(() => {
        handleSelectedCat()
    })
}

const fetchNews = () => {
    drawOled('Fetching News...')

    fetch(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${process.env.NEWS_API_KEY}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
    })
    .then((resp) => resp.json()) // Transform the data into json
    .then((data) => {
        articles = data.articles
        handleSelectedCat()
    })
}

const fetchJoke = () => {
    drawOled('Fetching Joke...')

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
        oled.setCursor(0, 0);
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