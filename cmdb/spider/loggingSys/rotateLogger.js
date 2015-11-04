var byt = require("byt")
var fs = require("fs")
var path = require("path")
var StringBuffer = require("sb-js").StringBuffer

module.exports = RotateLogger;

function RotateLogger(options) {
	this.logFileFullName = options.logFile;
	this.rotateCount = options.count || 3;
	this.rotateSize = byt(options.size) || byt("50m");
	this.currentFileSize = 0;
	this.bufferSize = byt(options.buffer) || byt("50k");
	this.currentFileNo = 0;
	this.logFile = this._findStartLogFile();
	this.buffer = new StringBuffer();
	this.currentBufferSize = 0;
}

RotateLogger.prototype.log = function(data) {
	if(this.currentBufferSize + Buffer.byteLength(data) < this.bufferSize) {
		this._addToBuffer(data);
		return;
	}
	var content;
	if(this.currentBufferSize == 0) {
		content = data;
	} else {
		content = this.buffer.toString();
		this._resetBuffer();
		this._addToBuffer(data);
	}
	var size = Buffer.byteLength(content);
	if(this.currentFileSize + size > this.rotateSize) {
		this._rotate();
		this.currentFileSize = 0;
	}
	fs.appendFile(this.logFile, content);
	this.currentFileSize += size;
}

RotateLogger.prototype._findStartLogFile = function() {
	var self = this;
	var dir = path.dirname(self.logFileFullName),
		name = path.basename(self.logFileFullName),
		count = self.rotateCount,
		reg = new RegExp(name + "\\.\\d+");
	var files = fs.readdirSync(dir).filter(function(file){
		return reg.test(file);
	});
	files = files.filter(function(file){
		var num = file.split(".");
		num = parseInt(num[num.length-1]);
		if(num >= self.rotateCount) {
			fs.unlink(dir+"/"+file, function(){console.log("Successfully unlinked: ", file)});
			return false;
		}
		return true;
	});
	if(files.length == 0) {
		self.currentFileNo = 0;
		return self.logFileFullName+".0";
	}
	var minSizeIndex = 0;
	var minSize = fs.statSync(dir+"/"+files[0]).size;
	for(var i = 1; i < files.length; i++) {
		var size = fs.statSync(dir+"/"+files[i]).size;
		if(size < minSize) {
			minSize = size;
			minSizeIndex = i;
		}
	}
	var file = files[minSizeIndex];
	var split = file.split(".");
	self.currentFileNo = parseInt(split[split.length-1]);
	self.currentFileSize = minSize;
	return self.logFileFullName + "." + self.currentFileNo;
}

RotateLogger.prototype._resetBuffer = function() {
	this.buffer = new StringBuffer();
	this.currentBufferSize = 0;
}

RotateLogger.prototype._addToBuffer = function(data) {
	this.buffer.add(data);
	this.currentBufferSize += Buffer.byteLength(data);
}

RotateLogger.prototype._rotate = function() {
	 this.currentFileNo = (this.currentFileNo + 1) % this.rotateCount;
	 this.logFile = this.logFileFullName + "." + this.currentFileNo;
	 // console.log(this.logFile);
	 fs.writeFileSync(this.logFile, "");
}
