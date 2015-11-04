var EventSource = require('eventsource')
var fs = require('fs')
var Crawler = require("node-webcrawler")
var moment = require("moment")
var util = require("util")

var logger = require("winston")
var godotTransport = require("winston-godot")
var godot = require("godot")
var env = process.env.NODE_ENV || "development"

var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"cheyipai.bidding"});

logger.add(logger.transports.File, { filename: '../../log/cheyipai.bidding.log' ,logstash:true,level:'info',handleExceptions:true});
logger.cli();
if(env==="production"){
    logger.remove(logger.transports.Console);
}

function Cheyipai() {
	this.cookie = 'cypweblog=2dd67ab1-2aaa-f2cd-6dd2-df0823a6f2b0; ASP.NET_SessionId=xen2ifrygqlzzd0thxip2y0f; __utmt=1; __utma=64730606.1911101343.1427090650.1428977075.1428981784.22; __utmb=64730606.1.10.1428981784; __utmc=64730606; __utmz=64730606.1427090650.1.1.utmcsr=mail.qq.com|utmccn=(referral)|utmcmd=referral|utmcct=/cgi-bin/mail_spam; sid=e9ed9023-bd06-436f-b569-274a1a525f89; logininfo=pGM72YxKGoGNHQMqj+8SNh3zGOT2kVv59mIHsUe/ilkoY9RA0WUE2/De7D0RZL3aXFjwUe598r8uoEb0pft0sCyvk/+TWoUiSCmkCCcmTepuljhTC/FYSDfMRViAM164RiMz3sYKsWuLvpTJIRYJdJ20VuQvcduFBSf7h5CwmWOiMU4V9torYlJjMTsdVk+qen5MOaZbD+02AsxwrGY1u7M2+5sDBImYU4uMnduVAdfOVeXKBt99ca7UDwc5rU4ELChlJdIGeD8XKOLyHUiUW0wYM71vu/PK9voF58hZua9wUB7KU45i/19SMheUTFcvKeRIfdhEQSSG3UctmBsNqm1LpYosPgEpnQSay+Rhm9k+YnpnkLntSueipubzbXo/uB2ZZ4VjD1Wg6hUlTh0Ysw==; CYP_RememberMe=268vgxwx; Hm_lvt_eeb26141b6058af048112a2e0f4e6233=1428567260,1428892906,1428977094,1428981790; Hm_lpvt_eeb26141b6058af048112a2e0f4e6233=1428981790; NewbieCookie=layerNum=7&isNewbieShow=no';
	this.eventsourceHeader = {headers: {'Cookie':this.cookie}};
	this.connectionData = '%5B%7B%22name%22%3A%22auctioncenter%22%7D%5D';
	this.connectionToken = '';
	this.negotiateUrl = 'http://p.cheyipai.com/2014/signalr/negotiate?connectionData=%s&clientProtocol=1.3&_=%s';
	this.connectUrl = 'http://p.cheyipai.com/2014/signalr/connect?transport=serverSentEvents&connectionToken=%s&connectionData=%s&tid=%s';
	this.abortUrl = "http://p.cheyipai.com/2014/signalr/abort?transport=serverSentEvents&connectionToken=%s&connectionData=%s";
	this.pingUrl = 'http://p.cheyipai.com/2014/signalr/ping?connectionData=%s&_=%s';
	this.crawler = new Crawler({
		maxConnections:1,
		jQuery:false,
		userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"
    });
    this.resultDir = "../../result/";
    this.resultFile = "cheyipai_" + moment().format("YYYY-MM-DD") + ".csv";
    fs.writeFileSync(this.resultDir+this.resultFile, "\ufeffAucId,CarId,Brand,Manufacturer,Model,Finaloffer,WinnerId,WinnerIdNonlocal,Mileage,RegDate,RegArea,RegareaTotal,CarSourceId,Rootid,CaptureTime\n");
}

Cheyipai.prototype.negotiate = function() {
	var url = util.format(that.negotiateUrl, that.connectionData, Cheyipai.getCurrentTimeStamp());
	console.log(url);
	that.crawler.queue({
		uri:url,
		callback:that.callback,
		headers:{Cookie:that.cookie}
	});
}

Cheyipai.prototype.callback = function(error, result) {
	if(error) {
		logger.error(error);
		return;
	}
	if(typeof result.body == 'string') {
		try {
			var resp = JSON.parse(result.body);
		} catch(e) {
			logger.error("Error parsing json for negotiate");
			logger.error(result.body);
			return;
		}
		that.connectionToken = resp.ConnectionToken;
		// console.log(that.connectionToken);
		// console.log(resp);
		that.connect();
	}
}

Cheyipai.prototype.connect = function() {
	var es = new EventSource(util.format(that.connectUrl, encodeURIComponent(that.connectionToken), that.connectionData, Cheyipai.getRandomTid()), this.eventsourceHeader);
	es.onmessage = function(message) {
		if(new Date().getHours() > 21) {
			logger.info("Job done.");
			client.close();
			es.close();
			return;
		}
		try {
			if(message.data == "initialized") {
				logger.info("Initialization message.");
				return;
			}
			var data = JSON.parse(message.data);
			if(data.M.length == 0) {
				logger.info("Empty message %s", moment().format("YYYY-MM-DD HH:mm:ss"));
				return;
			}
			if(data.M[0].M == "updatePrice") {
				logger.info("Update message %s", moment().format("YYYY-MM-DD HH:mm:ss"));
				return;
			}
			if(data.M[0].M == "TransMsg") {
				var data = data.M[0].A;
				var type = data[1];
				logger.info("Transaction message. Type = ", type);
				if(type == "4") {
					data = JSON.parse(data[0]);
					fs.appendFileSync(that.resultDir+that.resultFile, [
							data.AucId,data.CarId,data.Brand,data.Manufacturer,data.Model,
							data.Finaloffer,data.WinnerId,data.WinnerIdNonlocal,data.Mileage,
							data.RegDate,data.RegArea,data.RegareaTotal,data.CarSourceId,
							data.Rootid,data.RootName,moment().format("YYYY-MM-DD HH:mm:ss")
						].join()+"\n");
				}
			}
		} catch(e) {
			logger.error("Unwanted message %s", moment().format("YYYY-MM-DD HH:mm:ss"));
		}
	}
	es.onerror = function(e) {
		if(new Date().getHours() > 21) {
			logger.info("Job done.");
			client.close();
			es.close();
			return;
		}
		logger.error("Error receiving message from SignalR Server");
		logger.error(e);
		es.close();
		that.crawler.queue({
			uri:util.format(that.abortUrl, encodeURIComponent(that.connectionToken), that.connectionData),
			callback:function(error, result) {
				that.negotiate();
			}
		});
	}
}

Cheyipai.prototype.ping = function() {
	this.crawler.queue({
		uri:util.format(that.pingUrl, that.connectionData, Cheyipai.getCurrentTimeStamp()),
		callback:function(error, result, $) {
			if(error) {
				console.log(error);
				// what if ping goes wrong
				return;
			}
			if(typeof result == 'string') {
				try {
					var resp = JSON.parse(result.body);
				} catch(e) {
					console.log('[ERROR] error parsing json for ping');
					return;
				}
				if(resp.Response == 'pong') {
					setTimeout(that.ping(), 30000);
					return;
				} else {
					// what if ping goes wrong
				}
			}
		}
	})
}

Cheyipai.getCurrentTimeStamp = function() {
	return new Date().getTime();
}

Cheyipai.getRandomTid = function() {
	return Math.floor(Math.random()*11);
}

var that = new Cheyipai();
that.negotiate();
