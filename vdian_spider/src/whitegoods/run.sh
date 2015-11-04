#!/bin/sh

#pids=`ps --no-headers -p 20869|wc -l`
#echo "pid exist: $pids."
#pid=19771

while [ 0 ]
do
	pids=`ps --no-headers -p $pid|wc -l`
	echo "pid($pid) exist: $pids."
	if [ $pids -eq 0 ];then
		echo "pid($pid) not run"
		break
	fi
	sleep 10
done

echo "Suning'll go ..."
echo "icebox start..."
node suning_lost.js fri > sg_bx.log 2>&1
echo "icebox finished."

echo "washing machine start ..."
node suning_lost.js wm > sg_wm.log 2>&1
echo "washing machine finished."

echo "ac start ..."
node suning_lost.js ac > sg_ac.log 2>&1
echo "ac end."


