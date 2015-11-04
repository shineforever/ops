var Browser = require('zombie')
var browser = new Browser();

browser.visit("http://hotel.qunar.com/city/beijing_city/dt-17849/?tag=beijing_city#fromDate=2015-07-08&toDate=2015-07-09&q=&from=qunarHotel&fromFocusList=0&filterid=a3512ff0-bcba-4e50-a8a2-d67c12c573f7_A&showMap=0&qptype=&QHFP=ZSS_A40BBE42",{userAgent:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.65 Safari/537.36'},function(){
    console.log(browser.html());
})
