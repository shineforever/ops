var http = require('http')

function func(){
    
}

func.prototype.wgetList= function(){
    /*
      do work...
    */
    var that = this;
    http.get("www.google.com",function(){
	that.processList(args);
    });
}

func.prototype.processList = function(){
    /*
      do work...
    */
    var that = this;
    setTimeout(function(args){
	that.wgetList(args);
    },1000);
}

func.prototype.start = function(){
    this.init();
    this.wgetList();
}

func.prototype.init = function(){
    
}

var instance = new func();
instance.start();
