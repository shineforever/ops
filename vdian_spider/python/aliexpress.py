__author__ = 'zhushun0008'

import requests
import urllib2
import time
import sys
import getopt
from pyquery import PyQuery as pq
import math

def get_next_url(page):
    start_link = page.find('href=')
    if -1 == start_link:
        return None, 0
    start_quote = page.find('"', start_link)
    end_quote = page.find('"', start_quote + 1)
    url = page[start_quote + 1:end_quote]
    return url, end_quote


def union(p,q):
    for e in q:
        if e not in p:
            p.append(e)


def get_all_links(page):
    links = []
    while True:
        url, endpos = get_next_url(page)
        if url:
            links.append(url)
            page = page[endpos:]
        else:
            break
    return links




###########################################
###########################################
## Haddle first and second Catalogue
# Get all the urls and their names for rhe first Catalogue
# Get all the urls and their names for the second Catalogue



def getFirstCateName(page):

    startQuote = page.find('>')
    if -1 == startQuote:
        return None, 0
    endQuote = page.find('<', startQuote + 1)
    firstCateName = page[startQuote + 1:endQuote]
    return firstCateName, endQuote

def getSecCataNameUrls(pageContext):
    startLink = 0
    secCataUrl, urlEndpos = get_next_url(pageContext)
    startLink += urlEndpos
    startQuote = pageContext.find('>', startLink)
    endQuote = pageContext.find('<', startQuote + 1)
    secCataName = pageContext[startQuote + 1:endQuote]
    #endQuote += startLink
    print pageContext[startLink:endQuote]

    return secCataName, secCataUrl, endQuote

def getFirstCataNameSubUrls(pageContext):
    startLink = pageContext.find('<div class="sec-categories clearfix')
    if -1 == startLink:
        return None, None, None, -1
    endLink = pageContext.find('<div class="sec-categories clearfix',
                               startLink + 1)

    firstCataUrl, endpos = get_next_url(pageContext[startLink:])
    startLink += endpos
    firstCateName, endpos = getFirstCateName(pageContext[startLink:])
    startLink += endpos

    secCataPieceContext = pageContext[startLink:endLink]
    secStart = 0
    secCataList = []
    while True:
        if -1 != endLink:
            secCateName, secUrl, endpos = getSecCataNameUrls(secCataPieceContext[
                                                     secStart:])
            if None != secUrl:
                secStart += endpos
                if 'javascript:void(0)' != secUrl:
                    secCataList.append((secCateName, secUrl))
            else:
                break
        else:
            break

    return firstCateName, firstCataUrl, secCataList, endLink


def getAllFirstSecCataInfo(pageContext):
    firstSecCataUrlList = []

    while True:
        firstCateName, firstCataUrl, secCataList, endpos = \
        getFirstCataNameSubUrls(pageContext)
        if -1 != endpos:
            firstSecCataUrlList.append([firstCateName, firstCataUrl, secCataList])
            pageContext = pageContext[endpos:]
        else:
            firstSecCataUrlList.append([firstCateName, firstCataUrl, secCataList])
            break
    return firstSecCataUrlList


###########################################
###########################################







def crawlItemListForOnePage(sellOrderPage):

    itemUrlList = []
    try:
       page = urllib2.urlopen(sellOrderPage)
    except:
        pass
        print "Some Error happened in urlopen, the url :" + sellOrderPage
    else:
        pageContext = page.read()
        startLink = pageContext.find('list-item-180')
        endLink = pageContext.find('list-item-180', startLink + 1)

        while -1 != startLink:
            tempItemPage = pageContext[startLink:endLink]
            itemName, itemUrl, totalOrders = getItemUrl(tempItemPage)
            itemUrlList.append((itemName, itemUrl, totalOrders))
            startLink = endLink
            endLink = pageContext.find('list-item-180', startLink + 1)

    return itemUrlList

def getItemUrl(page):

    start_link = page.find('href=')
    if -1 == start_link:
        return None, 0
    start_quote = page.find('"', start_link)
    end_quote = page.find('"', start_quote + 1)
    url = page[start_quote + 1:end_quote]

    itemNameMarked = page.find('alt=')
    itemNameStart = page.find('"', itemNameMarked + 1)
    itemNameEnd = page.find('"', itemNameStart + 1)
    itemName = page[itemNameStart + 1:itemNameEnd]

    totalOrderMarked = page.find('Total Orders')
    totalOrderStart = page.find('(',totalOrderMarked + 1)
    totalOrderEnd = page.find(')', totalOrderStart + 1)
    totalOrders = page[totalOrderStart + 1:totalOrderEnd]
    return itemName, url, totalOrders




### Test
# sellOrderPage = 'http://www.aliexpress.com/category/200000528/baby-boys' \
#                     '-clothing.html?' \
#                    'site=glo&shipCountry=US&SortType=total_weight_score_desc'
# itemUrlList = crawlItemListForOnePage(sellOrderPage)
#
#


#######


def crawlSellOrderedSecCataPageList(page, numPagesToCrawl):
    prefixPage = page[:page.find('.html')]
    suffixPage = '?site=glo&shipCountry=US&SortType=total_weight_score_desc'
    pageList = []
    pageList.append(page + suffixPage)
    i = 2
    while i <= numPagesToCrawl:

        pageList.append(prefixPage + '/' + str(i) + '.html' + suffixPage)
        i += 1
    return pageList

## Test Passed
# testUrl = 'http://www.aliexpress.com/category/200000528/baby-boys-clothing.html'
# pageList = crawlSellOrderedSecCataPageList(testUrl, 2)
# #


def crawlItemListForOrderedPages(page, numPagesToCrawl):
    sellOrderedUrlList = crawlSellOrderedSecCataPageList(page, numPagesToCrawl)
    itemList = []
    for i in range(len(sellOrderedUrlList)):
        tempUrl = sellOrderedUrlList[i]
        itemList.append(crawlItemListForOnePage(tempUrl))

    return itemList



# Test
#testUrl = 'http://www.aliexpress.com/category/200000528/baby-boys-clothing
# .html'
#itemList = crawlItemListForOrderedPages(testUrl, 1)
#testUrl
#


def CrawlItemInfo(itemUrl):

    try:
       page = urllib2.urlopen(itemUrl)
    except:
        pass
        print "Some Error happened in urlopen, the url :" + itemUrl
        firstCatalogue = ''
        secCatalogue = ''
        orders = ''
        price = ''
    else:
        pageContext = page.read()

        startLink = pageContext.find('detail-page')
        allCategoriesPointer = pageContext.find('All Categories', startLink + 1)
        firstCatalogueMarked = pageContext.find('title=', allCategoriesPointer + 1)
        firstCatalogueStart = pageContext.find('"', firstCatalogueMarked)
        firstCatalogueEnd = pageContext.find('"', firstCatalogueStart + 1)
        firstCatalogue = pageContext[firstCatalogueStart + 1:firstCatalogueEnd]

        secCatalogueMarked = pageContext.find('title=', firstCatalogueEnd)
        secCatalogueStart = pageContext.find('"', secCatalogueMarked + 1)
        secCatalogueEnd = pageContext.find('"', secCatalogueStart + 1)
        secCatalogue = pageContext[secCatalogueStart + 1:secCatalogueEnd]

        ordersMarked = pageContext.find('orders-count')
        ordersStart = pageContext.find('b>', ordersMarked + 1)
        ordersEnd = pageContext.find('</', ordersStart + 1)
        orders = pageContext[ordersStart + 2:ordersEnd]

        priceMarkOne = pageContext.find('priceCurrency')
        priceMarkTwo = pageContext.find('span id=', priceMarkOne + 1)
        priceMarkThree = pageContext.find('itemprop=', priceMarkTwo + 1)
        priceNameStart = pageContext.find('"', priceMarkThree + 1)
        priceNameEnd = pageContext.find('"', priceNameStart + 1)
        priceName = pageContext[priceNameStart + 1:priceNameEnd]
        if 'price' == priceName:
            priceStart = pageContext.find('>', priceNameEnd)
            priceEnd = pageContext.find('<', priceStart + 1)
            price = pageContext[priceStart + 1:priceEnd]
        elif 'lowPrice' == priceName:
            lowPriceStart = pageContext.find('>', priceNameEnd)
            lowPriceEnd = pageContext.find('<', lowPriceStart + 1)
            lowPrice = pageContext[lowPriceStart + 1:lowPriceEnd]
            highPriceMarked = pageContext.find('highPrice', lowPriceEnd)
            highPriceStart = pageContext.find('>', highPriceMarked + 1)
            highPriceEnd = pageContext.find('<', highPriceStart + 1)
            highPrice = pageContext[highPriceStart + 1:highPriceEnd]
            price = lowPrice + ' - ' + highPrice

    return firstCatalogue, secCatalogue, orders, price


### Pass the following two cases
# testUrl = 'http://www.aliexpress.om/item/Baby-Infant-Animal-Crochet-Knitting
# -Costume-Soft-Adorable-Clothes-Photo-Photography-Props-for-0-6-Month
# /32271733197.html' firstCatalogue, secCatalogue, orders, price = CrawlItemInfo(testUrl)

# testUrl2 = 'http://www.aliexpress.com/item/Full-HD-1080P-2-7-G-Sensor-TFT-Car-DVR-Video-Recorder-Camera-Vehicle-Camcorder/32286250938.html'
# firstCatalogue, secCatalogue, orders, price = CrawlItemInfo(testUrl2)

######3


# def getAllItemInfo():
#     mainUrl = 'http://www.aliexpress.com/all-wholesale-products.html'
#     pageContext = urllib2.urlopen(mainUrl).read()
#     numPagesToCrawl = 10
#     countItem = 0
#
#     myfile = open('myfile.txt', 'w')
#     firstLine = 'ItemName' + '\t' + 'FirstCatalogue' + '\t' + \
#                 'SecondCatalogue' + '\t' + 'Price'+ '\t' + \
#                 'SixMonthOrders' + '\t' + 'TotalOrders\n'
#     myfile.writelines(firstLine)
#    # print pageContext
#     firstSecCataUrlList = getAllFirstSecCataInfo(pageContext)
#     numFirstCatagolue = len(firstSecCataUrlList)
#     for firstIndex in range(numFirstCatagolue):
#         tempFirstCata = firstSecCataUrlList[firstIndex]
#         tempSecCata = tempFirstCata[2]
#         numSecCatagolue = len(tempSecCata)
#         for secIndex in range(numSecCatagolue):
#             tempPageUrl = tempSecCata[secIndex][1]
#             itemLists = crawlItemListForOrderedPages(tempPageUrl,
#                                                     numPagesToCrawl)
#             for pageIndex in range(numPagesToCrawl):
#                 tempItemListForOnePage = itemLists[pageIndex]
#                 numItems = len(tempItemListForOnePage)
#                 for itemIndex in range(numItems):
#                     tempItem = tempItemListForOnePage[itemIndex]
#                     itemName = tempItem[0]
#                     itemUrl = tempItem[1]
#                     totalOrders = tempItem[2]
#                     firstCatalogue, secCatalogue, sixMonthOrders, price = \
#                         CrawlItemInfo(itemUrl)
#                     tempLine = itemName + '\t' + firstCatalogue + '\t'\
#                                + secCatalogue + '\t' + price + '\t' + \
#                                sixMonthOrders + '\t' + totalOrders + '\n'
#                     myfile.writelines(tempLine)
#                     countItem += 1
#                     print(countItem)
#                     if 50 == countItem:
#                         myfile.close()
#                         return 0
#     myfile.close()
#     return 0
# start = time.clock()
#
# getAllItemInfo()
# elapsed = (time.clock() - start)
# print("Time used:", elapsed)




def getAllItemInfoByFirstCatalogue(computeIndex, numComputers, numPagesToCrawl):


    mainUrl = 'http://www.aliexpress.com/all-wholesale-products.html'
    try:
       page = urllib2.urlopen(mainUrl)
    except:
        pass
        print "Some Error happened in urlopen, the url :" + mainUrl
    else:
        pageContext = page.read()
        countItem = 0
       # print pageContext
        firstSecCataUrlList = getAllFirstSecCataInfo(pageContext)
        numFirstCatagolue = len(firstSecCataUrlList)
        numTasksForEachComputer = int(math.ceil(float(
            numFirstCatagolue)/numComputers))

        if computeIndex + 1 > numComputers:
            print 'You may use wrong index of the computer!\n'
            return 0
        startIndex = computeIndex * numTasksForEachComputer
        if numComputers == computeIndex + 1:
            firstSecCataUrlListForComputer = firstSecCataUrlList[startIndex:]
        else:
            endIndex = (computeIndex + 1) * numTasksForEachComputer
            firstSecCataUrlListForComputer = firstSecCataUrlList[startIndex:endIndex]

        for taskIndex in range(len(firstSecCataUrlListForComputer)):
            filename = 'myfile' + str(taskIndex + computeIndex *
                                      numTasksForEachComputer) +'.txt'

            myfile = open(filename, 'w')
            firstLine = 'ItemName' + '\t' + 'FirstCatalogue' + '\t' + \
                'SecondCatalogue' + '\t' + 'Price'+ '\t' + \
                'SixMonthOrders' + '\t' + 'TotalOrders\n'
            myfile.writelines(firstLine)


            tempFirstCata = firstSecCataUrlListForComputer[taskIndex]
            tempSecCata = tempFirstCata[2]
            numSecCatagolue = len(tempSecCata)
            for secIndex in range(numSecCatagolue):
                tempPageUrl = tempSecCata[secIndex][1]
                itemLists = crawlItemListForOrderedPages(tempPageUrl,
                                                    numPagesToCrawl)
                for pageIndex in range(numPagesToCrawl):
                    tempItemListForOnePage = itemLists[pageIndex]
                    numItems = len(tempItemListForOnePage)
                    for itemIndex in range(numItems):
                        tempItem = tempItemListForOnePage[itemIndex]
                        itemName = tempItem[0]
                        itemUrl = tempItem[1]
                        totalOrders = tempItem[2]
                        firstCatalogue, secCatalogue, sixMonthOrders, price = \
                            CrawlItemInfo(itemUrl)
                        tempLine = itemName + '\t' + firstCatalogue + '\t'\
                               + secCatalogue + '\t' + price + '\t' + \
                               sixMonthOrders + '\t' + totalOrders + '\n'
                        myfile.writelines(tempLine)
                        countItem += 1
                        print(countItem)
                        # if 5 == countItem:
                        #     myfile.close()
                        #     return 0
            myfile.close()

    return 0





def getAllItemInfo():
    mainUrl = 'http://www.aliexpress.com/all-wholesale-products.html'
    pageContext = urllib2.urlopen(mainUrl).read()
    numComputers = 5
    numPagesToCrawl = 10
   # print pageContext
    firstSecCataUrlList = getAllFirstSecCataInfo(pageContext)
    numFirstCatagolue = len(firstSecCataUrlList)
    for computerIndex in range(numComputers):
        getAllItemInfoByFirstCatalogue(4, numComputers, numPagesToCrawl)

    return 0
#
#
#getAllItemInfo()

if __name__ == "__main__":
     #argv[1]: index of the worker [0-23]
     #argv[2]: number of pages to be crawled
    print 'Number of arguments:', len(sys.argv), 'arguments.'
    print 'Argument List:', str(sys.argv)
    computerIndex = int(sys.argv[1])
    numComputers = int(sys.argv[2])
    numPagesToCrawl = int(sys.argv[3])
    print(computerIndex, numComputers, numPagesToCrawl)

    getAllItemInfoByFirstCatalogue(computerIndex, numComputers, numPagesToCrawl)



### Write file Testing

def writeItemInfoToFile():
    myfile1 = open('../result/aliexpress.txt', 'w')
    firstLine = ['ItemName'.ljust(180), 'FirstCatalogue'.ljust(30),
                 'SecondCatalogue'.ljust(30), \
                 'Price\t\t', 'Orders\n']
    secLine = 'Soft Handmade Crochet Cotton Newborn Photography Props Knitted Beanies Costume Set For 0~3 Months Clothes And Accessories KF498(China (Mainland))'.ljust(180) + 'fasa'.ljust(30)
    myfile1.writelines(firstLine)
    myfile1.writelines(secLine)
    myfile1.close()
# writeItemInfoToFile()
