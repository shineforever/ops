var cp = require('child_process')
var child = cp.fork('./cp_worker.js');
var i=1000;
while(i-->0)
    child.send(i);
