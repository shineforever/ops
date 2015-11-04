var fs = require("fs");
var cheerio = require("cheerio");
var path = require('path');
var infoParser = /carsource\:JSON\.parse\(\'([^\']+)\'/;

var dir = "../result/2";
fs.readdirSync(dir).forEach(function(file){
    if(file.indexOf(".")!=0&&fs.existsSync(path.join(dir,file))){
	var html = fs.readFileSync(path.join(dir,file)).toString();
	var x = html.match(infoParser);
	if(x && x.length > 1){
	    var y = JSON.parse(x[1]);
	}else{
	    return;
	}
	
	var $ = cheerio.load(html);
	var brand = $("#a_allbrand").text().trim();

	for(var j = 0, len = y.length; j < len; j++){
	    var year = y[j].CarYear;
	    var xx = y[j].Cars;
	    for(var k = 0, leng = xx.length; k < leng; k++){
		var yy = xx[k].Cars;
		for(var l = 0, lengt = yy.length; l < lengt; l++){
		    //{"CarID":"110623","CarName":"1.6L 手动 品尚型 VTS版",
		    //"CsID":2710,"CSName":"雪铁龙世嘉三厢","PV":100,
		    //"CarTransmissionType":"手动","SalePrice":"11.38",
		    //"HavePromise":false,"OneSalePrice":"9.58"}
		    fs.appendFileSync('../result/final_huimaiche_v3.txt',brand + ',' + year + '款 ' +  yy[l].CSName + ',' + yy[l].CarName + ',' + yy[l].SalePrice + ',' + yy[l].OneSalePrice + '\n');
		}
	    }
	}
	//console.log(y);
	
    }

});


var _len = 2659;
for(var i = 1; i < _len; i++){
    //var html = fs.readFileSync("../result/1/"+i+".html", "utf8").toString();
    
}