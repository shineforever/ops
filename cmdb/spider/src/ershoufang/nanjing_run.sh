#!/bin/bash
today=`date +%d`
last_day=`cal | xargs | awk '{print $NF}'`

echo "today :", $today
echo "last day :", $last_day

if [ "$today" != "$last_day" ];then   
	#echo "today is not last day"
	exit 1
fi
# other codes start from here

basepath=$(cd `dirname $0`; pwd)
#echo $basepath
cd $basepath
node nanjing_ershoufang.js > ../../log/nanjing_ershoufang.txt
