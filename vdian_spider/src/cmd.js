var fs = require('fs')
var cmds=[];
var downs=[];
var sshCmds=[];
var cmds58 = [];
var killCmds=[];
//ec2-54-203-165-54.us-west-2.compute.amazonaws.com
var host = fs.readFileSync('../appdata/srvs.txt').toString().split('\n');
for(var i=0;i<host.length;i++){
    if(!host[i]) continue;
    var sshCmd = 'ssh -i bda2014032.pem ubuntu@'+host[i];
    sshCmds.push(sshCmd+' exit');
    var cmd = sshCmd+' \'sudo add-apt-repository ppa:chris-lea/node.js;sudo apt-get update;sudo apt-get install -y build-essential;sudo apt-get install -y git;mkdir spider;cd spider;git init;git pull https://github.com/mike442144/spider.git; sudo apt-get install -y nodejs;sudo apt-get install -y npm;mkdir node_modules;mkdir result;cd result;mkdir ganjijob;mkdir ganjicompany;mkdir 58job;mkdir 58company;cd ../;npm config set registry http://registry.npmjs.org/;sudo npm install -d;cd src;node pc_58_company.js '+i*2211+' 2211\'';
    cmds.push(cmd);
//    var downo = 'scp -i bda2014032.pem ubuntu@'+host[i]+':/home/ubuntu/spider/result/58job/*.html ./result/';
    var downc = 'scp -i bda2014032.pem ubuntu@'+host[i]+':/home/ubuntu/spider/appdata/58.company.txt ./58/58.'+i+'.company.txt';
//   var downgj = 'scp -i bda2014032.pem ubuntu@'+host[i]+':/home/ubuntu/spider/result/ganji.original.txt ./ganji/ganji.'+i+'.original.txt';
  //  downs.push(downo);
    downs.push(downc);
//    downs.push(downgj);
    cmds58.push(sshCmd+' \'cd spider/src;node pc_58_job.js '+i*5+' 25\'');
    killCmds.push(sshCmd+' \'sudo kill -9 $(pidof node);exit\'');
}
var strCommand = cmds.join(' &');
fs.writeFileSync("cmd.sh","#!/bin/bash\n");
fs.appendFileSync('cmd.sh',strCommand);
fs.writeFileSync("sshCmd.sh","#!/bin/bash\n");
fs.appendFileSync('sshCmd.sh',sshCmds.join('\n'));
fs.writeFileSync('cmds58.sh',"#!/bin/bash\n");
fs.appendFileSync('cmds58.sh',cmds58.join(' &'));
fs.writeFileSync("killCmds.sh","#!/bin/bash\n");
fs.appendFileSync("killCmds.sh",killCmds.join('\n'));
fs.writeFileSync('down.sh',"#!/bin/bash\n");
fs.appendFileSync('down.sh',downs.join(' &'));