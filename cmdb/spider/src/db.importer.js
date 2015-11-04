var fs = require('fs')
var parse = require('csv-parse')
var mysql = require("mysql")
var moment = require("moment")
var path = require('path')
var stream = require('stream')
var ProgressBar = require('progress')
var Emitter = require('events').EventEmitter
var util = require('util')
var transform = require('stream-transform')

var ProgressStream = function(opts){
    if (!(this instanceof ProgressStream)) return new ProgressStream(opts);
    
    stream.Transform.call(this,opts);
}

util.inherits(ProgressStream, stream.Transform);

ProgressStream.prototype._transform = function(chunk, encoding, cb) {
    var self = this;
    process.nextTick(function(){
	self.emit('chunk',chunk.length);
    });
    
    cb(null, chunk);
};

function Importer(opt){
    if(!(this instanceof Importer)){return new Importer(opt);}
    Emitter.call(this);
    var database = {
	"database": opt.database || "bdadata",
	"user":opt.user || "root",
	"password":opt.password||"xiaokang2015",
	"host":opt.host ||"bda-server-2",
	"connectionLimit":opt.connectionLimit||30
    }
    
    this.conn = mysql.createPool(database);
    this.error = 0;
    this.normal = 0;
    this.queued = 0;

    this.options = opt;
    this.source = opt.source;
    this.currentSource;
    this._check(); // check for sources;
}

util.inherits(Importer,Emitter);

Importer.prototype.start = function(opt){
    this._import(this.source);
}

Importer.prototype._check = function _check(){
    var source = this.source;
    if(source instanceof String) {
        source = [source];
    }
    if(source instanceof Array) {
        this.source = source.reduce(function(pre, cur){
            if(fs.existsSync(cur)) {
                pre.push(cur);
            }
            return pre;
        }, []);
    } else {
        throw new Error("source should be file path, readable stream or array of them");
    }
    if(this.source.length == 0) {
        throw new Error("there should be at least one readable file");
    }
}

Importer.prototype._import = function(sources){
    var size = 0, self = this, input=null, source;
    if('string' === typeof sources){
	sources = [sources];
    }
    
    if(!(source = sources.shift())){
	return;
    }
    
    var filename=path.basename(source);
    self.currentSource = filename;
    size = fs.statSync(source).size;
    input = fs.createReadStream(source);
    
    console.log((size>>>20) + ' MB');
    
    if(size===0) {
        process.nextTick(function(){
            self._import(sources);
        });
	   return;
    }
    
    var barSize = new ProgressBar(filename + ' [:bar] :percent :etas',{
	complete: '=',
	incomplete: ' ',
	total: size
    });
    
    var parser = parse({delimiter: this.options.delimiter || ',',quote:this.options.quote||'"'})
    , transformer = transform(this.options.transform,{parallel:this.options.parallel||1000})
    , progressStream = new ProgressStream()
    , nil = fs.createWriteStream("/dev/null");
    
    progressStream.on('chunk',function(len){
	barSize.tick(len);
    });

    progressStream.on('end',function(){
	self.emit('done');
	process.nextTick(function(){
	    self._import(sources);
	});
    });
    
    input
	.pipe(parser)
	.pipe(transformer)
	.pipe(progressStream)
	.pipe(nil);
}

module.exports = Importer
