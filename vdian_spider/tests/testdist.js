var fs = require("fs")
var client = require("../../dist/client.js")
var _ = require("lodash")
var moment = require("moment")

var appclient = {
    name:"sofang",
    seed:{
	uri:'http://www.github.com/',
    },
    onInit:function(done){
	done();
    },
    onData:function(data){
	console.log(data);
    },
    
}

client(appclient)
