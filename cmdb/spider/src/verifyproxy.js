var helper = require('./helpers/webhelper.js')
var http = require('http')

//http://www.iphai.com/apiProxy.ashx?un=mike442144&pw=mike442144&count=1000
//http://www.hungean.com/api.asp?
var proxyfile = "verified-03-03.txt";
helper.fetchProxys(proxyfile);




function getdata(){
    http.get(opt,function(res){
    var chunks = [];
    res.on('data',function(chunk){
        chunks.push(chunk);
    });
    res.on('end',function(){
        var buffer = Buffer.concat(chunks);
        var proxys = buffer.toString().split('\r\n');
		for(var proxy in proxys){
			var v = proxys[proxy].split(":");
			var ip = v[0];
			var port = v[1];
			console.log(proxys[proxy]);
			helper.verifyip(ip,port,"verified-03-01.txt");
		}
    
    });
    res.on('error',function(e){
        console.log(e.message);
    });
});

}
//getdata();
// helper.request_data(opt,null,function(data,args){
// 	if(!data) return;
// 	var proxys = data.split('\r\n');
// 	for(var proxy in proxys){
// 		var v = proxy.split(":");
// 		var ip = v[0];
// 		var port = v[1];
// 		console.log(proxy);
// 		helper.verifyip(ip,port,"verified-2-24.txt");
// 	}
// },{});
//helper.verifyproxy('proxys-2-24.txt','verified-2-24.txt');