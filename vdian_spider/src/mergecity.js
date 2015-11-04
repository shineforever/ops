var fs = require('fs')

var lines = fs.readFileSync("../appdata/qunar_flight_hot_city.txt").toString().split('\n');
var pys = fs.readFileSync("../appdata/elong_city.txt").toString().split('\n');

var cities={};

for(var j=0;j<pys.length;j++){
    var ps = pys[j].split(' ');
    var k = ps[0];
    var id = ps[1];
    cities[k] = id;
}

for(var i=0;i<lines.length;i++){
    var l = lines[i];
    var data = l.split(' ');
    data[0] = data[0].replace(/\d+/,cities[data[1]]);
    console.log(data.join(' '));
    //var c = data[1].replace(/\(w+\)/,'');
    
    fs.appendFileSync("../appdata/elong_flight_hot_city.txt",data.join(' ')+'\n');
}
