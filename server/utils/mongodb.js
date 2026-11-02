const config = require('../config');
const errLogger = require('./errorLogger');
const { MongoClient,ServerApiVersion } = require('mongodb');

// Opening MongoDb connection
module.exports.openDBConnection = async (callback) => {
    // Read database URL inside the function to ensure async config is ready
    const url = config.database;
    
    if (!url) {
        errLogger.error('Database URL is not configured. Check config.js initialization.');
        process.exitCode = 1;
        return;
    }

    try {
        const connectToDb = new MongoClient(url, {
            replicaSet: process?.env?.NODE_ENV && process?.env?.NODE_ENV !== 'development' ? 'INTA' : undefined,
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });
        const client = await connectToDb.connect();
        module.exports.client = client;
        // module.exports.dbValue = client;
        db = client;
        callback(null, client);
    } catch (e) {
        errLogger.error('Failed to connect to MongoDB. Try again.');
        process.exitCode = 1;
    }
};

