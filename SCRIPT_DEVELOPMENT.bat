cd "script/development"
start cmd /k "SCRIPT_REPLICA_DEVELOPMENT"
cd "../../"
SET NODE_ENV=development
SET DB_Naming=INTA
timeout 30
start cmd /k "node ./server/server.js"



