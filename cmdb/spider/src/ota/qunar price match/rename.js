var fs = require("fs");

var dir = "../../../result/ota/qunar_imgs/";

var files = fs.readdirSync(dir);

files.forEach(function(file){
	console.log(file);
	fs.renameSync(dir+file, dir+file.replace(".gif", ".png"));
});