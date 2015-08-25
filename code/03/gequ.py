gequ=['爱，就是爱','全面通缉','离开那天','明天过后','见或者不见','莫失莫忘']
countStr=raw_input('你想让音乐循环播放的遍数：')
count=int(countStr)
qizhong=raw_input('输入您目前不想听的歌曲：')
tiaoguo=raw_input('输入您想跳过的歌曲：')
i=1
while i<=count:	
	i+=1
	print '---------------循环开始--------------'
	for danqu in gequ:
		if danqu==qizhong:
			break
		if danqu==tiaoguo:
			continue
		print '第',i-1,'次播放的歌曲',danqu
