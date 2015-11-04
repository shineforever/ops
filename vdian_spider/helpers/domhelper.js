exports.getPrevElementSibling=function(node){
    if(!node) return null;
    var prev = node.previousSibling;
    while(prev){
	if(prev.nodeType=='1')
	    break;
	prev = prev.previousSibling;
    }
    return prev;
}
exports.getNextElementSibling=function(node){
    if(!node) return null;
    var next = node.nextSibling;
    while(next){
	if(next.nodeType=='1')
	    break;
	next = next.nextSibling;
    }
    return next;
}

