var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var cheerio = require('cheerio')
var URL = require('url')
var Crawler = require("node-webcrawler")
var moment = require("moment")
var logger = require("winston")
var seenreq = require("seenreq")

var env = process.env.NODE_ENV || "development"
logger.add(logger.transports.File, {  filename: '../../log/athmec.log',  logstash: true,  handleExceptions: true});
if (env === "production") {
  logger.remove(logger.transports.Console);
}

var godotTransport = require("winston-godot")
var godot = require("godot")
var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {  godot: client,  service: "athmec"}); //service名称需要更改

var Dealer = function() {
    this.resultDir = "../../result/auto/";
    this.dataDir = '../../appdata/';
    this.resultFile = "athmec_" + moment().format("YYYY-MM-DD") + ".csv";
    this.done = {};
    this.curPageIdx = 1;
    this.cities = [];
    this.seen = new seenreq();
    this.c = new Crawler({
      maxConnections: 1,
      callback: function(error, result, $) {
        if (error) {
          logger.error(error);
        } else {
          that.processDetail(result, $);
        }
      },
      forceUTF8: true,
      //  debug:true,
      onDrain: function() {
        logger.info("Job done.");
        logger.remove(godotTransport);
        client.close();
      },
      logger: logger
    });
  }
  //http://deal.autohome.com.cn/china/?k=2, 综合经销商

Dealer.prototype.wgetShop = function() {

}

Dealer.prototype.init = function() {
  fs.writeFileSync(that.resultDir + that.resultFile,
    "\ufeff城市,品牌,车型,标题,促销内容,价格,适用车型,促销信息,标题（搜索页）,促销标题（搜索页）,抵扣券,进口,分期,一口价,日期\n");
  this.getCity();
}

//获取城市path
Dealer.prototype.getCity = function() {
  this.c.queue({
    uri: "http://mall.autohome.com.cn/list/",
    callback: function(err, result, $) {

try{
      logger.info($("title").text());
      $("div.selectcity-content dl dd a").each(function(idx) {
              if (idx < 1) {
                  return;
              }
              var path = $(this).attr("href");
              var name = $(this).text().trim();
              // logger.info("city: %s, path: %s", name, path);
              that.cities.push({"name": name,"path": path
              });
      });
      logger.info("city count:%d", that.cities.length);
      that.wgetList();
}
catch(e){
      logger.error("error:%s", result?result.uri:"N/A");
      logger.error(e);
}


    }
  });
}

Dealer.prototype.start = function() {
  this.init();
}

//对每个城市，加队列
Dealer.prototype.wgetList = function() {
  this.cities.forEach(function(c) {
    var u = "http://mall.autohome.com.cn" + c.path;
    if (!that.seen.exists(u)) {
      //logger.info(u);
      that.c.queue({
        uri: u,
        callback: function(err, result, $) {
          if (err) {
            logger.error(err);
            return;
          } else {
            that.processList(result, $);
          }
        },
        c: c
      });
    }
  });
}

Dealer.prototype.processDetail = function(result, $) {
  if (!$) {
    logger.error("$ is null or undefined");
    return;
  }

try{
    var arg = result.options,
    city = arg.c.name,
    info = arg.info,
    name = arg.name,
    tip = arg.tip,
    loan = arg.loan,
    im = arg.im,
    coupon = arg.coupon,
    oneprice = arg.oneprice,
    model = $("div.breadnav ul").text().replace(/[\s,]/g, '').split(">"),
    tit = $("h2.detail-info-title").text(),
    desc = $("p.detail-info-description").text().replace(/[\s,]/g, ''),
    price //$("div.detail-info-banner-main").text().replace(/[\s,]/g,'')
    , records = [];

  if (model.length < 2) {
    return;
  }

  if (im || coupon) {
    var ms = info.match(/(\d+元)\d+/);
    price = (ms && ms.length > 1) ? ms[1] : 'N/A';
  } else {
    var txt = $("#detailInfoPrice");
    price = txt.eq(0).attr('price');
  }

  logger.info("%s, %s", city, tit);
  if (im || loan) {
    records.push([city, model[0], model[1], tit, desc, price, "", info, name, tip, coupon ? "Y" : "N", im ? "Y" : "N", loan ? "Y" : "N", oneprice ? "Y" : "N"].join());
  }
  
  $("#select-car .select-list ul li").each(function() {
    var dtit = $(this).text().replace(/[\s,]/g, '');
    records.push([city, model[0], model[1], tit, desc, price, dtit, info, name, tip, coupon ? "Y" : "N", im ? "Y" : "N", loan ? "Y" : "N", oneprice ? "Y" : "N", moment().format("YYYY-MM-DD")].join());
  });
  if (records.length > 0) {
    var r = records.join("\n") + "\n";
    fs.appendFileSync(this.resultDir + this.resultFile, r);
  };
}//try
catch(e){
  logger.error("error:%s",result?result.uri:"N/A");
  logger.error(e);
}//catch
}//function

Dealer.prototype.processList = function(result, $) {
  if (!$) {
    logger.error("$ is null or undefined");
    return;
  }
try{
  logger.info("Got %s list, %s", result.options.c.name, result.uri);
  // var records = [];
  $("div#list > ul > li > a").each(function() {
    var name = $(".carbox-title", this).text().trim();
    name = name && name.replace(/[\s,]/g, '');
    var tip = $(".carbox-tip", this).text();
    tip = tip && tip.replace(/[\s,]/g, '');
    var info = $(".carbox-info", this).text();
    info = info && info.replace(/[\s,]/g, '');
    var coupon = false;
    var im = false;
    var loan = false;
    var oneprice = false;
    var typelist = $(".carbox-producttype", this);
    // logger.info("typelist: %d", typelist.length);
    for (var i = 0; i < typelist.length; i++) {
      switch (typelist.eq(i).text().trim()) {
        case '抵扣券':
          coupon = true;
          break;
        case '一口价':
          oneprice = true;
          break;
      }
    };

    var link = $(this).attr("href");
    if (link && !URL.parse(link).host) {
      link = "http://mall.autohome.com.cn" + link;
    }
    if (!that.seen.exists(link)) { //coupon:抵扣券, im: 进口, loan: 分期
      that.c.queue({uri: link, c: result.options.c,  name: name, tip: tip,info: info,coupon: coupon,im: im,loan: loan,oneprice: oneprice,priority: 3});
    }
  });
  $(".pager-pageindex a").each(function() {
    var pageUrl = "http://mall.autohome.com.cn" + $(this).attr("href");
    // logger.info("pageUrl:"+pageUrl);//test
    if (!that.seen.exists(pageUrl)) {
      that.c.queue({
        uri: pageUrl,
        c: result.options.c,
        callback: function(err, result, $) {
          if (err) {
            logger.error(err);
          } else {
            that.processList(result, $);
          }//else
        }//callback
      });
    }//if
  });
}//try
catch(e){
  logger.error("error: %s",result?result.uri:"N/A");
  logger.error(e);
}//catch
}

var instance = new Dealer();
var that = instance;
instance.start();