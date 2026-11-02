#!/bin/bash
 
######################################################################
 
# export PATH=/bin:/usr/bin:/usr/local/bin
TODAY=`date +%F-%H%M`
 
######################################################################
######################################################################
LOGS_FOLDER_PATH='C:/ICAT/logs'
DB_BACKUP_PATH='C:/backup'
MONGO_HOST='localhost'
MONGO_PORT='30000'

DATABASE_NAMES='INTA'

BACKUP_RETAIN_DAYS=10
LOGS_RETAIN_DAYS=365 
 
mkdir -p ${DB_BACKUP_PATH}/${TODAY}

if [ ${DATABASE_NAMES} = "ALL" ]; then
	echo "You have choose to backup all databases"
	mongodump --host ${MONGO_HOST} --port ${MONGO_PORT} --out ${DB_BACKUP_PATH}/${TODAY}/ 
else
	echo "Running backup for selected databases"
	for DB_NAME in ${DATABASE_NAMES}
	do
	mongodump --host ${MONGO_HOST} --port ${MONGO_PORT} --db ${DB_NAME} --out ${DB_BACKUP_PATH}/${TODAY}/  
	done
fi

find ${DB_BACKUP_PATH}/* -mtime +${BACKUP_RETAIN_DAYS} -exec rm -rf {} \;
find ${LOGS_FOLDER_PATH}/* -mtime +${LOGS_RETAIN_DAYS} -exec rm -rf {} \;


