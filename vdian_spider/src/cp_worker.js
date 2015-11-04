var http = require('http')
//var zlib = require('zlib')
var fs = require('fs')
//var helper = require('../helpers/webhelper.js')
//var $ = require('../jquery')
//var entity = require('../models/entity.js')
//var sprintf = require("sprintf-js").sprint

process.on('message',function(m){
    console.log(m);
});