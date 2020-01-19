// Jan Temmerman
const Oled = require('oled-disp');

const oled = new Oled({ width: 128, height: 64, dcPin: 23, rstPin : 24}); // 7pin spi, rasp

oled.begin(() => {
    oled.clearDisplay()
})