# -*- coding: utf-8 -*-

# Scrapy settings for meituan_hotel project
#
# For simplicity, this file contains only the most important settings by
# default. All the other settings are documented here:
#
#     http://doc.scrapy.org/en/latest/topics/settings.html
#

BOT_NAME = 'meituan_hotel'

SPIDER_MODULES = ['meituan_hotel.spiders']
NEWSPIDER_MODULE = 'meituan_hotel.spiders'

USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.93 Safari/537.36'
