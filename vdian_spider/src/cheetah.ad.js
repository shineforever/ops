var fs = require("fs"),
	util = require("util"),
	Crawler = require("node-webcrawler");

var c = new Crawler({
	maxConnections:1,
	userAgent:"Mozilla/5.0"
});

var params = {
	"params[audience_language]":"",
	"params[audience_country]":"US",
	"params[audience_city]":"",
	"params[audience_sex]":"",
	"params[audience_age]":"",
	"params[audience_interest]":"",
	"params[audience_hot_apps]":"",
	"params[audience_behavior]":"",
	"params[audience_device_band]":"",
	"params[audience_device_os]":"",
	"params[audience_max_device_os]":"",
	"params[audience_net_type]":0,
	"params[audience_network]":"",
	"params[audience_country_flag]":1,
	"params[add_audence_tpl]":"",
	"params[audience_name]":"",
	"texts[country][label]":"Locations",
	"texts[country][data][]":"United States of America",
	"texts[country][country_flag]":1
}

function buildQuery(params) {
	var result = [];
	Object.keys(params).forEach(function(key){
		result.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
	});
	return result.join("&");
}

c.queue({
	uri:util.format("https://ori.cmcm.com/api/audience/puv?%s", buildQuery(params)),
	headers:{
		Cookie:"PHPSESSID=usqi57bof1mg95q87lld5v1pq5"
	},
	callback:function(error, result) {
		console.log(result.body);
	}
})