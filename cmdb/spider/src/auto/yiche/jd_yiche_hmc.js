var fs = require('fs')
var Crawler = require("node-webcrawler")

var logger = require('winston')
var env = process.env.NODE_ENV || "development"
logger.add(logger.transports.File, { filename: '../../log/jd_yiche_Hmc.log',logstash:true ,handleExceptions: true});
if(env==="production"){
    logger.remove(logger.transports.Console);
}

var godotTransport = require("winston-godot")
var godot = require("godot")
var godotServer = require("../../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"jd_yiche_Hmc"});//service名称需要更改

if(!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) { 
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

if(!Date.prototype.toDateStr) {
    Date.prototype.toDateStr = function() {
        var year = this.getFullYear();
        var month = this.getMonth() + 1;
        month = month < 10 ? "0" + month : month;
        var day = this.getDate();
        day = day < 10 ? "0" + day : day;
        return year + "_" + month + "_" + day;
    }
}

function Hmc() {
    this.resultFile = '../../../result/auto/jd_yiche_Hmc_' + new Date().toDateStr() + '.csv';
    this.contextFile = '../../../log/breakpoint/jd_yiche_hmc_processed.txt';
    this.tasks = [];
    this.processedHref = {};
    this.today = new Date().toString();
    this.Crawler = new Crawler({
        maxConnections:1,
        userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36",
        onDrain:function(){
            logger.info("Job done.");
            // logger.remove(godotTransport);
            // client.close();
        },
        forceUTF8:true
    });
}

Hmc.prototype.init = function() {
    if(fs.existsSync(this.contextFile)) {
        var hrefList = fs.readFileSync(this.contextFile).toString().split(';');
        hrefList.pop();
        hrefList.forEach(function(href){
            that.processedHref[href] = 0;
        });
        logger.info('[INFO] {0} hrefs already processed'.format(hrefList.length));
    }
    if(!fs.existsSync(this.resultFile)){
        fs.writeFileSync(this.resultFile, "\ufeff品牌,车系,年份,车型,颜色,价格,正在购买人数,节省金额,获得低价时间,认证商家,订金,优惠信息\n");
    }
    logger.info("[INFO] no context file found.");
}

Hmc.prototype.getSeriesList = function() {
    this.Crawler.queue({
        uri:'http://car.jd.com/hmc/select?ccode=201',
        callback:function(error, result, $) {
            if(error) {
                logger.error('[ERROR] error getting series list');
                logger.error(error);
                return;
            }
            if(typeof result.body == 'string') {
                var list = $('#carsWrap li');
                if(list.length == 0) {
                    logger.error('[ERROR] no series list found or Dom architecture changed');
                    return;
                }
                for(var i = 0; i < list.length; i++) {
                    var href = list.eq(i).find('a').attr('href').trim();
                    if(that.processedHref[href] != 0) {
                        that.tasks.push(href);
                    }
                }
                that.getNextSeriesDetail();
            }
        }
    });
}

Hmc.prototype.getNextSeriesDetail = function() {
    if(this.tasks.length <= 0) {
        logger.info('[INFO] Job Done!');
        logger.remove(godotTransport);
        client.close();
        return;
    }
    var href = this.tasks.shift();
    this.Crawler.queue({
        uri:href,
        callback:that.getDetail
    });
}

Hmc.prototype.getDetail = function(error, result, $) {
    try {
        var skuid = result.uri.match(/\d+/g)[0];
    } catch(e) {
        logger.error("Bad skuid");
        that.getNextSeriesDetail();
        return;
    }
    if(error) {
        logger.error('[ERROR] error getting detail for ', result.uri);
        that.getNextSeriesDetail();
        return;
    }
    if(typeof result.body == 'string') {
        try {
            var name = $('#name h1').text().trim().split(' ');
            var brandName = name[0].replace(/【.*?】/g, "");
            var seriesName = name[1].replace(/订金\d+元/g, "");
            var colorSizeReg = /colorSize : (\[\{.*\}])(?=,)/g;
            var colorSize = JSON.parse(colorSizeReg.exec(result.body)[1]);
            var year = colorSize[0].Color;
            var models = [];
            colorSize.forEach(function(size){
                models.push(size.Size);
            });
        } catch(e) {
            logger.error('[ERROR] error getting detail for {0}. This may due to the change of Dom structure or the lack of data.');
            that.getNextSeriesDetail();
            return;
        }
        var basicInfo = {};
        basicInfo['brand'] = brandName;
        basicInfo['series'] = seriesName;
        var carYearMap = {};
        var carYearInfo = {};
        carYearInfo['models'] = models;
        carYearInfo['colors'] = [];
        carYearMap[year] = carYearInfo;
        that.getCarDetail(skuid, basicInfo, carYearMap, year);
    }
}

Hmc.prototype.getCarDetail = function(skuid, basicInfo, carYearMap, year) {
    this.Crawler.queue({
        uri:'http://car.jd.com/huimaiche/car/CarDetail/{0}/1?callback=getCarDetailResult'.format(skuid),
        callback:function(error, result, $) {
            var skuid = result.options.skuid;
            var basicInfo = result.options.basicInfo;
            var carYearMap = result.options.carYearMap;
            var year = result.options.year;
            if(error) {
                logger.error('[ERROR] error getting car detail for ', skuid);
                that.getNextSeriesDetail();
                return;
            }
            if(typeof result.body == 'string') {
                var carDetailReg = /getCarDetailResult\((.*)\);/g;
                var carDetail = JSON.parse(carDetailReg.exec(result.body)[1]);
                basicInfo['MSRP'] = carDetail.Data.MSRP;
                basicInfo['Buyer'] = carDetail.Data.Buyer;
                basicInfo['AvgSaving'] = carDetail.Data.AvgSaving;
                basicInfo['PriceTime'] = carDetail.Data.PriceTime;
                basicInfo['Dealer'] = carDetail.Data.Dealer;
                var skuidToCapture = [];
                carDetail.Data.AllYearTypes.forEach(function(yearType){
                    if(yearType.YearTypeName == year) {
                        return;
                    }
                    skuidToCapture.push(yearType.SkuId);
                });
                carDetail.Data.Colors.forEach(function(color){
                    carYearMap[year]['colors'].push(color.Name);
                });
                that.getPromotion(skuid, basicInfo, carYearMap, year, skuidToCapture);
            }
        },
        skuid:skuid,
        basicInfo:basicInfo,
        carYearMap:carYearMap,
        year:year
    });
}

Hmc.prototype.getPromotion = function(skuid, basicInfo, carYearMap, year, skuidToCapture) {
    this.Crawler.queue({
        uri:'http://ad.3.cn/ads/mgets?skuids=AD_{0}&areaCode=1_0_0&callback=getAdResult&_={1}'.format(skuid, new Date().getTime()),
        callback:function(error, result) {
            var skuid = result.options.skuid;
            var basicInfo = result.options.basicInfo;
            var carYearMap = result.options.carYearMap;
            var year = result.options.year;
            var skuidToCapture = result.options.skuidToCapture;
            if(error) {
                logger.error('[ERROR] error getting promotion for ', skuid);
                basicInfo['promotion'] = 'ERROR';
                that.getDeposit(skuid, basicInfo, carYearMap, year, skuidToCapture);
                return;
            }
            if(typeof result.body == 'string') {
                try {
                    var data = JSON.parse(result.body.match(/getAdResult\(\[(.*?)]\)/)[1]);
                    basicInfo['promotion'] = data.ad.replace(/<a.*?<\/a>/g, "").replace(/,/g, ";");
                } catch(e) {
                    logger.error('[ERROR] error finding promotion using regexp');
                    basicInfo['promotion'] = 'ERROR';
                }
                that.getDeposit(skuid, basicInfo, carYearMap, year, skuidToCapture);
            }
        },
        jQuery:false,
        skuid:skuid,
        basicInfo:basicInfo,
        carYearMap:carYearMap,
        year:year,
        skuidToCapture:skuidToCapture
    })
}

Hmc.prototype.getDeposit = function(skuid, basicInfo, carYearMap, year, skuidToCapture) {
    this.Crawler.queue({
        uri:'http://p.3.cn/prices/get?skuid=J_{0}&type=1&area=1_0_0&callback=jQuery9527191&_={1}'.format(skuid, new Date().getTime()),
        callback:function(error, result, $) {
            var skuid = result.options.skuid;
            var basicInfo = result.options.basicInfo;
            var carYearMap = result.options.carYearMap;
            var year = result.options.year;
            var skuidToCapture = result.options.skuidToCapture;
            if(error) {
                logger.error('[ERROR] error getting deposit for ', skuid);
                basicInfo['deposit'] = '499[ERROR]';
                return;
            }
            if(typeof result.body == 'string') {
                try {
                    var depositReg = /"p":"(.*)","m"/g;
                    basicInfo['deposit'] = depositReg.exec(result.body)[1];
                } catch(e) {
                    logger.error('[ERROR] error finding deposit using regexp');
                    basicInfo['deposit'] = '499[ERROR]';
                }
                that.nextSkuid(skuid, basicInfo, carYearMap, skuidToCapture);
            }
        },
        skuid:skuid,
        basicInfo:basicInfo,
        carYearMap:carYearMap,
        year:year,
        skuidToCapture:skuidToCapture
    });
}

Hmc.prototype.nextSkuid = function(baseSkuid, basicInfo, carYearMap, skuidToCapture) {
    if(skuidToCapture.length <= 0) {
        var record = Hmc.generateRecord(basicInfo, carYearMap);
        fs.appendFileSync(this.resultFile, record);
        // fs.appendFileSync(this.contextFile, baseSkuid + ',');
        logger.info('[INFO] skuid={0} Done!'.format(baseSkuid));
        this.getNextSeriesDetail();
        return;
    }
    var skuid = skuidToCapture.shift();
    this.Crawler.queue({
        uri:'http://item.jd.com/{0}.html'.format(skuid),
        callback:function(error, result, $) {
            logger.info(result.uri);
            var basicInfo = result.options.basicInfo;
            var carYearMap = result.options.carYearMap;
            var skuidToCapture = result.options.skuidToCapture;
            var baseSkuid = result.options.baseSkuid;
            try {
                var skuid = result.uri.match(/\d+/g)[0];
            } catch(e) {
                logger.error("Bad SkuId");
                that.getNextSeriesDetail();
                return;
            }
            if(error) {
                logger.error('[ERROR] error getting detail for ', result.uri);
                that.getNextSeriesDetail();
                return;
            }
            if(typeof result.body == 'string') {
                try {
                    var colorSizeReg = /colorSize : (\[\{.*\}])(?=,)/g;
                    var colorSize = JSON.parse(colorSizeReg.exec(result.body)[1]);
                    var year = colorSize[0].Color;
                    var models = [];
                    colorSize.forEach(function(size){
                        models.push(size.Size);
                    });
                } catch(e) {
                    logger.error('[ERROR] error getting detail for {0}. This may due to the change of Dom structure or the lack of data.'. format(skuid));
                    logger.error(e);
                    that.getNextSeriesDetail();
                    return;
                }
                var carYearInfo = {};
                carYearInfo['models'] = models;
                carYearInfo['colors'] = [];
                carYearMap[year] = carYearInfo;
                that.getColor(skuid, basicInfo, carYearMap, year, skuidToCapture, baseSkuid);
            }
        },
        basicInfo:basicInfo,
        carYearMap:carYearMap,
        skuidToCapture:skuidToCapture,
        baseSkuid:baseSkuid
    });
}

Hmc.prototype.getColor = function(skuid, basicInfo, carYearMap, year, skuidToCapture, baseSkuid) {
    this.Crawler.queue({
        uri:'http://car.jd.com/huimaiche/car/CarDetail/{0}/1?callback=getCarDetailResult'.format(skuid),
        callback:function(error, result, $) {
            var skuid = result.options.skuid;
            var basicInfo = result.options.basicInfo;
            var carYearMap = result.options.carYearMap;
            var year = result.options.year;
            var skuidToCapture = result.options.skuidToCapture;
            var baseSkuid = result.options.baseSkuid;
            if(error) {
                logger.error('[ERROR] error getting car detail for ', skuid);
                that.getNextSeriesDetail();
                return;
            }
            if(typeof result.body == 'string') {
                var carDetailReg = /getCarDetailResult\((.*)\);/g;
                var carDetail = JSON.parse(carDetailReg.exec(result.body)[1]);
                carDetail.Data.Colors.forEach(function(color){
                    carYearMap[year]['colors'].push(color.Name);
                });
                that.nextSkuid(baseSkuid, basicInfo, carYearMap, skuidToCapture);
            }
        },
        skuid:skuid,
        basicInfo:basicInfo,
        carYearMap:carYearMap,
        year:year,
        skuidToCapture:skuidToCapture,
        baseSkuid:baseSkuid
    });
}

Hmc.generateRecord = function(basicInfo, carYearMap) {
    var result = '';
    Object.keys(carYearMap).forEach(function(key){
        var models = carYearMap[key]['models'];
        var colors = carYearMap[key]['colors'];
        for(var i = 0; i < models.length; i++) {
            for(var j = 0; j < colors.length; j++) {
                result = result + basicInfo['brand'] + ',' +
                    basicInfo['series'] + ',' + key + ',' +
                    models[i] + ',' + colors[j] + ',' +
                    basicInfo['MSRP'] + ',' + basicInfo['Buyer'] + ',' +
                    basicInfo['AvgSaving'] + ',' + basicInfo['PriceTime'] + ',' +
                    basicInfo['Dealer'] + ',' + basicInfo['deposit'] + ',' +
                    basicInfo['promotion'] + '\n';
            }
        }
    });
    return result;
}

Hmc.prototype.run = function() {
    this.init();
    this.getSeriesList();
}

var that = new Hmc();
that.run();