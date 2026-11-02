cd "script/production"
start cmd /k "SCRIPT_REPLICA"
cd "../../"
SET NODE_ENV=production
SET DB_Naming=INTA
timeout 30
start cmd /k "node ./server/server.js"



