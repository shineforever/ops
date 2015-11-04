var logger = require("winston")
var godotTransport = require("winston-godot")
var godot = require("godot")
var env = process.env.NODE_ENV || "development"
var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"test"});

for(var i = 1; i < 100; i++) {
	logger.info(i);
}
