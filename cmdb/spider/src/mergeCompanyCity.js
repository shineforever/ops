var fs = require('fs')

var cmps = {};
fs.readFileSync("../result/58_company.txt").toString().split("\n").forEach(function(line){
    if(!line)
	return;
    var id = line.split(",")[0];
    cmps[id] = line;
});
var records = {};
fs.readFileSync("../result/58_jobs.lastest.txt").toString().split("\n").forEach(function(line){
    if(!line)
	return;
    var kvs = line.split(',');
    var url = kvs[6];
    if(!url)
	return;
    var matches = url.match(/\/(\d+)\//);
    var id = matches && matches[1];
    records[id] = kvs[0];
});
for(var id in cmps){
    var cmp = cmps[id];
    if(records[id]){
	fs.appendFileSync('../result/58_company_city.txt',cmp+','+records[id]+'\n');
    }
}

//console.log(cmps);

