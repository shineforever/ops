var fs = require("fs")

var pointFile = "./appdata/didipoints.txt";
var resultFile = "58daojia.txt";

var cityToAdd = ["绵阳"/*"苏州市","无锡市","青岛市","大连市","长春市","郑州市","昆明市"*/];
var map = {
	"苏州市":{id:5,name:"Suzhou"},
	"无锡市":{id:93,name:"Wuxi"},
	"青岛市":{id:122,name:"Qingdao"},
	"大连市":{id:147,name:"Dalian"},
	"长春市":{id:319,name:"Changchun"},
	"郑州市":{id:342,name:"Zhengzhou"},
	"昆明市":{id:541,name:"Kunming"},
	"绵阳":{id:1057,name:"Mianyang"}
}
var cityAreaInfo = {};

fs.readFileSync(pointFile).toString().split("\n").forEach(function(line){
	var split = line.split("\t");
	if(cityToAdd.indexOf(split[0]) >= 0) {
		var topleft = {lat:Number(split[1].split(",")[0]),lng:Number(split[1].split(",")[1])};
		var bottomright = {lat:Number(split[2].split(",")[0]),lng:Number(split[2].split(",")[1])};
		cityAreaInfo[split[0]] = {
			topleft:topleft,
			bottomright:bottomright
		};
		cityAreaInfo[split[0]].latstep = (topleft.lat-bottomright.lat)/(split[6]/3);
		cityAreaInfo[split[0]].lngstep = (bottomright.lng-topleft.lng)/(split[5]/3);
	}
});

cityToAdd.forEach(function(cityname){
	var toWrite = [];
	var city = cityAreaInfo[cityname];
	for(var lat = city.bottomright.lat; lat < city.topleft.lat; lat += city.latstep) {
		for(var lng = city.topleft.lng; lng < city.bottomright.lng; lng += city.lngstep) {
			toWrite.push([map[cityname].name,"保洁","朝阳园",lng,lat,"城区","中",map[cityname].id].join("\t"));
		}
	}
	fs.appendFileSync(resultFile, toWrite.join("\n")+"\n");
	console.log("[INFO] %s done", cityname);
});