var fs = require('fs')
var Crawler = require("node-webcrawler")

if(!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined' ? args[number] : match;
    });
  };
}

function bl(){
    this.resultFile = '../result/bilibili.txt';
    this.contextFile = '../log/breakpoint/bili_failed.txt';
    this.subcatList = [];
    this.catMap = {};
    this.tasks = [];
    this.crawler = new Crawler({
        maxConnections:10,
        userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"
    });
}

bl.prototype.start = function(){
    console.log('[INFO] process starts');
    this.doNextTid();
}

bl.prototype.doNextTid = function() {
    var task = this.tasks.shift();
    if(task == undefined){
        console.log('[INFO] all tids done');
        console.log('[INFO] job done');
        return;
    }
    href = task['url'];
    this.crawler.queue({
        uri:href,
        task:task,
        callback:function(error, result, $) {
            if(error) {
                console.log('[ERROR] error visiting ', result.uri);
                console.log(error);
                return;
            }
            if(typeof result.body == 'string') {
                try {
                    var tidPattern = /var tid='(.*?)'/g;
                    var tid = tidPattern.exec(result.body)[1];
                    var task = result.options.task;
                    that.crawler.queue({
                        uri:'http://www.bilibili.com/list/default-{0}-1-2015-04-11~2015-04-18.html'.format(tid),
                        callback:function(error, result, $) {
                            var tid = result.options.tid;
                            if(error) {
                                console.log('[ERROR] error visiting page 1 for tid=', tid);
                                console.log(error);
                                return;
                            }
                            if(typeof result.body == 'string') {
                                try {
                                    var endpagePattern = /class="endPage" href="javascript:loadPage\((\d*)\)/g;
                                    var endPage = endpagePattern.exec(result.body)[1];
                                } catch(e) {
                                    console.log('[ERROR] error finding endpage for tid=', tid);
                                    return;
                                }
                                console.log('endPage: ', endPage);
                                for(var page = 1; page <= endPage; page++) {
                                    that.doPage(tid, page, endPage, task);
                                }
                            }
                        },
                        jQuery:false,
                        tid:tid,
                        task:task
                    });
                } catch(e) {
                    console.log('[ERROR] error finding tid for ', result.uri);
                    return;
                }
            }
        }
    });
}

bl.prototype.doPage = function(tid, page, endPage, task) {
    this.crawler.queue({
        uri:'http://www.bilibili.com/list/default-{0}-{1}-2015-04-11~2015-04-18.html'.format(tid, page),
        callback:function(error, result, $) {
            var tid = result.options.tid;
            var page = result.options.page;
            var endPage = result.options.endPage;
            var task = result.options.task;
            if(error) {
                console.log('[ERROR] error tid={0} page{1}'.format(tid, page));
                fs.appendFileSync(that.contextFile, result.uri);
                return;
            }
            if(typeof result.body == 'string') {
                try {
                    var videoList = $('ul.vd-list li');
                    var content = '';
                    for(var i = 0; i < videoList.length; i++) {
                        var video = videoList.eq(i);
                        var videoName = video.find('.title').text();
                        var videoLink = video.find('a.title').attr('href');
                        var videoWatch = video.find('.gk').text();
                        var videoLike = video.find('.sc').text();
                        var videoComment = video.find('.dm').text();
                        var videoDate = video.find('.date').text();
                        var videoUpper = video.find('div.w-info a').attr('title');
                        var videoUpperLink = video.find('div.w-info a').attr('href');
                        content = content+tid+'\t'+task.cat+'\t'+task.subcat+'\t' +'\t'+videoName+'\t'+videoLink+'\t'+videoWatch+'\t'+videoLike+'\t'+videoComment+'\t'+videoDate+'\t'+videoUpper+'\t'+videoUpperLink+'\n';
                    }
                    fs.appendFileSync(that.resultFile, content);
                    console.log('[INFO] done url=', result.uri);
                    if(page == endPage) {
                        console.log('[INFO] all pages done for tid=', tid);
                        that.doNextTid();
                        return;
                    }
                    return;
                } catch(e) {
                    console.log('[ERROR] error doPage url=', result.uri);
                    fs.appendFileSync(that.contextFile, result.uri + '\n');
                    return;
                }
            }
        },
        tid:tid,
        page:page,
        endPage:endPage,
        task:task
    })
}

bl.prototype.init = function(){
    try {
        if(!fs.existsSync(this.contextFile)) {
            fs.openSync(this.contextFile, 'w');
        }
    } catch(e) {
        console.log('[ERROR] error reading running context');
    }
    console.log('[INFO] current subcatHref={0} current page={1}'.format(this.curSubcatHref, this.curPage));
    this.crawler.queue({
        uri:'http://www.bilibili.com/',
        callback:function(error, result, $) {
            if(error) {
                console.log('[ERROR] error visiting index page, subcategory initialization failed.');
                console.log(error);
                return;
            }
            if(typeof result.body == 'string') {
                try {
                    var catList = $('div.menu-wrapper li.m-i').not('.home').not('.rank');
                    for(var i = 0; i < catList.length; i++) {
                        var catName = catList.eq(i).find('em').text();
                        var list = catList.eq(i).find('ul.i_num li');
                        for(var j = 0; j < list.length; j++) {
                            var subcatName = list.eq(i).text();
                            that.subcatList.push({url:'http://www.bilibili.com' + list.find('a').eq(j).attr('href'),cat:catName,subcat:subcatName});
                        }
                    }
                } catch(e) {
                    console.log('[ERROR] error parsing index page, subcategory initialization failed.');
                    console.log('Job finished with error.');
                    return;
                }
                that.assignTask();
            }
        }
    });
}

bl.prototype.assignTask = function() {
    var arguments = process.argv.splice(2);
    console.log(arguments);
    switch(arguments.length) {
        case 0:
            for(var i = 0; i < this.subcatList.length; i++) {
                this.tasks.push(this.subcatList[i]);
            }
            break;
        case 1:
            for(var i = 0; i < arguments[0]; i++) {
                this.tasks.push(this.subcatList[i]);
            }
            break;
        case 2:
            for(var i = arguments[0]-1; i < arguments[1]; i++) {
                this.tasks.push(this.subcatList[i]);
            }
            break;
        default:
            console.log('[ERROR] illegal arguments');
            break;
    }
    console.log(this.tasks);
    console.log('[INFO] total subcategory to process: ', this.tasks.length);
    this.start();
}

var that = new bl();
that.init();
