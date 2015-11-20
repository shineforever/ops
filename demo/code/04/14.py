def a(x):
    def b(y):
        return x+y
    return b

print a(1)(2)
print a(6)
