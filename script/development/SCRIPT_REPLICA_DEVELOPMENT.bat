@echo off
SET Db_Version =7.0
start cmd /k  "cd C:\Program Files\MongoDB\Server\7.0\bin && mongod --port 30000 --dbpath C:\data\db1 --replSet vAUTO --bind_ip_all"
timeout 20
node SCRIPT_MONGODB_DEVELOPMENT.js
timeout 20
exit

