var godot = require("godot")
var FileReactor = require("./fileReactor")
var config = require("./config.json")

var reactors = [];

config.forEach(function(serviceConfig){
	reactors.push(
		godot.reactor()
			.where("service", serviceConfig.service)
			.file(serviceConfig.logFile, serviceConfig.rotateOptions)
	);
});

godot.createServer({
	type:"udp",
	reactors:reactors
}).listen(1337);
