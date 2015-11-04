var webdriver = require('selenium-webdriver');
var helper = require('../helpers/webhelper.js')
var fs = require('fs')

var driver = new webdriver.Builder().
//    usingServer(server.address()).
    withCapabilities(webdriver.Capabilities.chrome()).
    build();

driver.get('http://hotel.qunar.com');
driver.getTitle().then(function(title){
    console.log(title);
});
var toCityEle = driver.findElement(webdriver.By.name("toCity"));
toCityEle.clear();
toCityEle.sendKeys("北京");
var fdEle = driver.findElement(webdriver.By.name("fromDate"));
fdEle.clear();
fdEle.sendKeys("2014-05-01");
var tdEle =  driver.findElement(webdriver.By.name("toDate"));
tdEle.clear();
tdEle.sendKeys("2014-05-02");
var qEle =  driver.findElement(webdriver.By.name("q"));
qEle.clear();
qEle.sendKeys("北京金都假日酒店");
driver.findElement(webdriver.By.className("btn")).click();
var linkEle = driver.findElement(webdriver.By.xpath("//div[@class='b_hlistPanel']/div[@class='e_hlist_item js_list_block'][1]/div[@class='position_r']/div[@class='c2']/h2/a[1]"));
var detailUrl = linkEle.getAttribute("href");
driver.get(detailUrl);

driver.getPageSource().then(function(args){
    fs.writeFileSync('../result/baidu.txt',args);
});
driver.findElements(webdriver.By.className("btn_openPrc")).then(function(btns){
    for(var i=0;i<btns.length;i++){
	var b = btns[i].findElement(webdriver.By.tagName("b"));
	b.getText().then(function(txt){
	    console.log(txt);
	    //btn.getOuterHtml().then(function(html){
	    //console.log(html);
	    //});
	    if(txt=="展开报价"){
		var as = new webdriver.ActionSequence(driver);
		as.mouseMove(btn[i]).perform();
		btn[i].click();
		//btn.getTagName().then(function(tagName){
		//    console.log(tagName);
		//});
	    }
	});
    }
});

//driver.wait(function(){
//    return driver.getTitle().then(function(title) {
//	console.log(title);
//	return true;
// });
//},1000);
//driver.quit();
// var http = require("http")

// var url = "http://flight.elong.com/isajax/OneWay/S?DepartCityNameEn=wulumuqi&ArriveCityNameEn=shanghai&DepartCityName=乌鲁木齐&ArrivalCityName=上海&DepartCity=URC&ArriveCity=SHA&DepartDate=2014-04-01&IsReturn=false&PageIndex=0&FlightType=OneWay";

// http.get(url,function(res){
	// var chunks = [];
    // res.on('data',function(chunk){
        // chunks.push(chunk);
    // });
    // res.on('end',function(){
        // var buffer = Buffer.concat(chunks);
     	// console.log(buffer.toString());
    // });
    // res.on('error',function(e){
        // console.log(e.message);
    // });
// });
var url = "http://flights.ctrip.com/booking/BJS-SHA-day-1.html?DCity1=BJS&ACity1=SHA&DDate1=2014-04-01&passengerQuantity=1&PassengerType=ADU&SearchType=S&RouteIndex=1&RelDDate=&RelRDate=&IsSensitive=T&SendTicketCity=undefined"
var cityFile = "qunar_flight_hot_city.txt";
var departDate="2014-04-01";
//var cities = helper.get_cities(cityFile);
var cs = [];
var query = function(dcity,acity){
	this.DCity1 = dcity.code;
	this.ACity1 = acity.code;
	this.PassengerQuantity = 1;
	this.FlightSearchType = "S";
	this.DDate1 = departDate;
  // this.DepartCityNameEn = dcity.pinyin;
  // this.ArriveCityNameEn = acity.pinyin;
  // this.DepartCityName=dcity.cname;
  // this.ArrivalCityName=acity.cname;
  // this.DepartCity = dcity.code;
  // this.ArriveCity = acity.code;
  // this.DepartDate=departDate;
  // this.IsReturn="false";
  // this.PageIndex = 0;
  // this.FlightType='OneWay';
};
function start(){
	var doneFiles = fs.readdirSync("pc_ctrip_flight");
	var doneDict={};
	for(var i=0;i<doneFiles.length;i++){
		var id = doneFiles[i].replace(".html");
		doneDict[id]=true;
	}
	for(var j=0;j<cities.length;j++){
    var dep = cities[j];
    for(var k=0;k<cities.length;k++){
        var arr = cities[k];
        if(k==j || doneDict[dep.cname+"-"+arr.cname]) continue;
		cs.push({"dep":dep,"arr":arr});
    }
  }
  var cur = cs.pop();
	var pageName = cur.dep.code+"-"+cur.arr.code+"-day-1.html";
	var ctripQuery = new query(cur.dep,cur.arr);
	url = "http://flights.ctrip.com/booking/"+pageName+helper.toQuery(ctripQuery);
	requestdata(url,[cur.dep,cur.arr]);
}
function requestdata(url,args){
	//var args = ["北京","上海"];
	driver.get(url).then(
	function(){
		var source_code = driver.getPageSource();
		//var source_code = elem.get_attribute("outerHTML");
		fs.writeFileSync("pc_ctrip_flight/"+args[0].cname+'-'+args[1].cname+'.html',source_code);
		console.log(args[0]+"-"+args[1]+" done.");
		if(cs.length==0) return;
		var cur = cs.pop();
		var pageName = cur.dep.code+"-"+cur.arr.code+"-day-1.html";
        var ctripQuery = new query(cur.dep,cur.arr);
		url = "http://flights.ctrip.com/booking/"+pageName+helper.toQuery(ctripQuery);
		requestdata(url,[cur.dep,cur.arr]);
	});

}
//start();