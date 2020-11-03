# web.py
import sys
import os
#python文件中不能添加其他输出语句,会污染控制台输出
#print('#Hello from python#')
#print('First param: '+sys.argv[1]+'#')
path=os.getcwd()+"/data/config_file/resload/output.xml"
sys.stdout.write(path)
