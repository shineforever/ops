var fs = require("fs"),
	util = require("util"),
	godot = require("godot"),
	RotateLogger = require("./rotateLogger"),
	path = require("path")
	ReadWriteStream = godot.common.ReadWriteStream;

var FileReactor = function FileReactor(filename, rotateOptions) {
	ReadWriteStream.call(this);
	var dir = path.dirname(filename);
	if(!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
	this.file = filename;
	rotateOptions = rotateOptions || {
		logFile:filename,
		count:2,
		size:"500m",
		buffer:"25k"
	}
	this.logger = new RotateLogger(rotateOptions);
}

util.inherits(FileReactor, ReadWriteStream);

FileReactor.prototype.write = function(data) {
	// console.log(typeof data);
	if(this.logger) {
		this.logger.log(JSON.stringify(data)+"\n");
	} else {
		fs.appendFileSync(this.file, JSON.stringify(data)+"\n");
	}
}

godot.reactor.register("file", FileReactor);

module.exports = FileReactor;