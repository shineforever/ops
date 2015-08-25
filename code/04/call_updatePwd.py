# -*- coding: UTF-8 -*-
import sys
import updatePwd
type = sys.getfilesystemencoding()
print updatePwd.updatePassword().decode('UTF-8').encode(type)
