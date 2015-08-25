def validate (usernames):
    if (len(usernames) > 4) and (len(usernames) < 12):
        return usernames
print filter(validate , ('admin','maxianglin','mxl','adm','wanglili'))
    
    