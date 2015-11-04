
fr = open("ganji.ershouche.txt", 'r')
fw = open("tmp.txt", 'w')

for line in fr:
    tmp = line.strip().split(',')
    tmp1 = ''
    if len(tmp) == 5:
        tmp1 += tmp[0] + ','
        tmp1 += tmp[1] + ','
        tmp1 += ','
        tmp1 += tmp[2] + ','
        tmp1 += tmp[3] + ','
        tmp1 += tmp[4] + '\n'
        print tmp1
        fw.write(tmp1)
    else:
        fw.write(line)
