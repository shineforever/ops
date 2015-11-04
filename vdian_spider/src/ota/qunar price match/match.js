var getPixels = require("get-pixels");
var fs = require("fs");

function Matcher() {
	this.resultFile = "../../../result/ota/qunar_price_result.txt";
	this.imagesToMatchDirectory = "../../../result/ota/qunar_imgs/";
	this.templates = [
		{path:"../qunar price match/template/0.png", val:0},
		{path:"../qunar price match/template/1.png", val:1},
		{path:"../qunar price match/template/2.png", val:2},
		{path:"../qunar price match/template/3.png", val:3},
		{path:"../qunar price match/template/4.png", val:4},
		{path:"../qunar price match/template/5.png", val:5},
		{path:"../qunar price match/template/6.png", val:6},
		{path:"../qunar price match/template/7.png", val:7},
		{path:"../qunar price match/template/8.png", val:8},
		{path:"../qunar price match/template/9.png", val:9}
		];
	this.tasks = [];
	this.task = "";
}

Matcher.prototype.init = function() {
	fs.readdirSync(this.imagesToMatchDirectory)
			.reduce(function(pre, cur){
				if(cur) {
					pre.push(that.imagesToMatchDirectory + cur);
				}
				return pre;
			}, that.tasks);
	this.loadTemplate(0);
}

Matcher.prototype.run = function() {
	this.doNextMatch();
}

Matcher.prototype.doNextMatch = function() {
	that.task = that.tasks.shift();
	if(!that.task) {
		console.log("[INFO] Job done");
		return;
	}
	getPixels(that.task, function(error, image) {
		var filename = that.task.match(/qunar_imgs\/(.*?\.png)/)[1];
		if(error) {
			console.log("[ERROR] error matching ", filename);
			console.log(error);
			setTimeout(that.doNextMatch, 0);
			return;
		}
		var imageToMatch = Matcher.prototype.convertBinary(image);
		var result = Matcher.prototype.match(imageToMatch);
		fs.appendFileSync(that.resultFile, filename + "\t" + result + "\n");
		console.log("[INFO] done ", filename);
		that.doNextMatch();
	});
}

Matcher.prototype.match = function(binaryImage) {
	var offset = 0;
	var result = [];
	while(offset <= binaryImage[0].length - 6) {
		var flag = 0;
		var templateWidth = 6;
		for(var i = 0; i < that.templates.length; i++) {
			if(Matcher.prototype.isMatch(that.templates[i].binary, binaryImage, offset)) {
				result.push(that.templates[i].val);
				flag = 1;
				templateWidth = that.templates[i].binary[0].length;
				break;
			}
		}
		if(flag) {
			offset += templateWidth;
		} else {
			++offset;
		}
	}
	return result.join("");
}

Matcher.prototype.isMatch = function(template, binaryImage, offset) {
	if(offset + template[0].length > binaryImage[0].length) {
		return false;
	}
	var diff = 0;
	for(var row = 0; row < template.length; row++) {
		for(var col = 0; col < template[0].length; col++) {
			diff += Math.abs(template[row][col] - binaryImage[row][col+offset]);
		}
	}
	if(diff > 3) {
		return false;
	}
	return true;
}

Matcher.prototype.loadTemplate = function(num) {
	if(num > 9) {
		console.log("[INFO] done loading template.");
		that.run();
		return;
	}
	var template = that.templates[num];
	getPixels(template.path, function(error, image) {
		if (error) {
			console.log(error);
		} else {
			template.image = image;
			template.binary = Matcher.prototype.convertBinary(image);
		}
		that.loadTemplate(num+1);
	});
}

Matcher.prototype.convertGreyScale = function(image) {
	var result = [];
	var depth = image.shape[2];
	for(var i = 0; i < image.data.length; i+=depth) {
		var row = parseInt(i/(image.shape[0]*depth));
		if(!result[row]) {
			result[row] = [];
		}
		var grey = (image.data[i] + image.data[i+1] + image.data[i+2] + 0.0)*(image.data[i+3]/255)/3;
		result[row].push(grey);
	}
	return result;
}

Matcher.prototype.convertBinary = function(image) {
	var result = [];
	var depth = image.shape[2];
	for(var i = 0; i < image.data.length; i+=depth) {
		var row = parseInt(i/(image.shape[0]*depth));
		if(!result[row]) {
			result[row] = [];
		}
		var grey = (image.data[i] + image.data[i+1] + image.data[i+2] + 0.0)*(image.data[i+3]/255)/3;
		if(grey > 100) {
			result[row].push(1);
		} else {
			result[row].push(0);
		}
	}
	return result;
}

var that = new Matcher();
that.init();
