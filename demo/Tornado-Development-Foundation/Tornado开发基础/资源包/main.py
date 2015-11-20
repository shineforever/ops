#!/usr/bin/env python
#-*-coding: utf-8-*-

# Version: 0.1
# Author: Song Huang <huangxiaohen2738@gmail.com>
# License: Copyright(c) 2015 Song.Huang
# Summary: 

import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web

from tornado.options import define, options

define("port", default=8000, type=int)

class IndexHandler(tornado.web.RequestHandler):
    def get(self):
        res = self.get_argument('res', 'hello')
        self.write(res + 'world!')


if __name__ == '__main__':
    tornado.options.parse_command_line()
    app = tornado.web.Application(
            handlers = [(r'/', IndexHandler)]
            )

    http_server = tornado.httpserver.HTTPServer(app)
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()
