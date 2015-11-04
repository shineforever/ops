var dgram = require('dgram');

function ControllerServer(){
    this.PORT = 4588;
    this.HOST = '127.0.0.1';
    this.server=null;
}

ControllerServer.prototype.loadFromFile=function(){
    this.todo=[];
    this.done=[];
    this.failed=[];
    this.proxy=[];
}
ControllerServer.prototype.init=function(){
    this.server = dgram.createSocket('udp4');
    //var address = this.server.address();
    var host = this.HOST;
    var port = this.PORT;
    this.server.on('listening', function () {
	console.log('UDP Server listening on ' +host + ":" + port);
    });
    var that = this;
    this.server.on('message',function(msg,remote){
	that.processMsg(msg,remote);
    });

    this.loadFromFile();
}
ControllerServer.prototype.start = function(){
    this.init();
    if(this.server)
	this.server.bind(this.PORT, this.HOST);
}
/*
Message Protocol
type:todo|done|failed|proxy|check
data:{}
stat:success|error
*/
ControllerServer.prototype.processMsg=function(msg,remote){
    if(!msg){
	console.log('msg empty');
    }
    var message = JSON.parse(msg);
    
    console.log(remote.address + ':' + remote.port +' - ' + message.type);
    
    var msg = new Buffer(JSON.stringify(this.createMsg(message.type)));
    this.server.send(msg,0,msg.length,remote.port,remote.address,function(err,bytes){
	if(err) throw err;
	console.log('udp msg back to '+remote.address+':'+remote.port);
    });
}
ControllerServer.prototype.createMsg=function(type){
    if(type=='check'){
	return {'stat':'success','type':'check'};
    }
}

var srv = new ControllerServer();
srv.start();
