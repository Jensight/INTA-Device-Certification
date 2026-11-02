start cmd /k  "cd C:\Program Files\MongoDB\Server\7.0\bin && mongod --port 30000 --dbpath C:\data\db1 --replSet vAUTO --bind_ip_all"
start cmd /k  "cd C:\Program Files\MongoDB\Server\7.0\bin && mongod --port 40000 --dbpath C:\\data\\db2 --replSet vAUTO --bind_ip_all"
start cmd /k  "cd C:\Program Files\MongoDB\Server\7.0\bin && mongod --port 50000 --dbpath C:\\data\\db3 --replSet vAUTO --bind_ip_all"
timeout 20
node SCRIPT_MONGODB.js
timeout 20
exit

