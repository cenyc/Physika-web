# web.py
import sys
import os
#python文件中不能添加其他输出语句,会污染控制台输出
#print('#Hello from python#')
#print('First param: '+sys.argv[1])
#print(sys.argv[2])
#print(sys.argv[3])
#print(sys.argv[4])
path=os.getcwd()+"/data/user_file/localUser/0/sim_config_file.xml"
sys.stdout.write(path)
