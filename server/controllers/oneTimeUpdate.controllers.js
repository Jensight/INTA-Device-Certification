var logger = require("../utils/logger");
const {updateManyToDb } = require("../model/regressionModel");


/**
 * Remove specified keys from all documents in the device collection
 * POST /oneTimeUpdate/removeKeys/:teamName
 * Body: { "keys": ["key1", "key2", "key3"] }
 */
exports.removeKeysFromCollection = async (req, res) => {
    const teamName = req.params.teamName;
    const { keys } = req.body;
    const collectionName = teamName + '_Devices';

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
        return res.status(400).send({
            status: false,
            message: 'Provide an array of keys to remove',
            example: { keys: ["key1", "key2"] }
        });
    }
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
        const unsetObj = {};
        keys.forEach(key => unsetObj[key] = "");
        // const result = await db.collection(collectionName).updateMany({}, { $unset: unsetObj });
        const result = await updateManyToDb(dbType, client, collectionName, {}, { $unset: unsetObj });
        logger.info('[%s] Removed keys [%s] from %s. Modified: %d docs',
            teamName, keys.join(', '), collectionName, result.modifiedCount);
        res.send({
            status: true,
            message: 'Keys removed successfully',
            keysRemoved: keys,
            documentsModified: result.modifiedCount
        });
    } catch (err) {
        logger.error('[%s] Error removing keys: %s', teamName, err.message);
        res.status(500).send({ status: false, message: 'Error removing keys', error: err.message });
    }
};

/**
 * Delete all records from Server_Hygiene_Data collection for a given serverIP
 * DELETE /oneTimeUpdate/deleteServerHygieneData
 * Body: { "serverIP": "172.30.27.68" }
 */
exports.deleteServerHygieneData = async (req, res) => {
    const { serverIP } = req.body;

    if (!serverIP) {
        return res.status(400).send({
            status: false,
            message: 'Provide a serverIP in the request body',
            example: { serverIP: "172.30.27.68" }
        });
    }

    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    const collectionName = 'Server_Hygiene_Data';

    try {
        if (dbType === 'MongoDB') {
            const db = client.db();
            const result = await db.collection(collectionName).deleteMany({ serverIP: serverIP });
            logger.info('Deleted %d records from %s for serverIP: %s', result.deletedCount, collectionName, serverIP);
            res.send({
                status: true,
                message: `Successfully deleted records for serverIP: ${serverIP}`,
                deletedCount: result.deletedCount
            });
        } else {
            res.status(400).send({ status: false, message: 'Unsupported DB type' });
        }
    } catch (err) {
        logger.error('Error deleting Server_Hygiene_Data for serverIP %s: %s', serverIP, err.message);
        res.status(500).send({ status: false, message: 'Error deleting records', error: err.message });
    }
};

/**
 * Remove the modelTCMatrix field from the settings collection
 * DELETE /oneTimeUpdate/deleteModelTCMatrix
 */
exports.deleteModelTCMatrix = async (req, res) => {
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;

    try {
        if (dbType === 'MongoDB') {
            const db = client.db();
            const result = await db.collection('settings').updateOne(
                { _id: 1 },
                { $unset: { modelTCMatrix: "" } }
            );
            logger.info('Removed modelTCMatrix from settings. Modified: %d doc(s)', result.modifiedCount);
            res.send({
                status: true,
                message: 'modelTCMatrix removed from settings successfully.',
                documentsModified: result.modifiedCount
            });
        } else {
            res.status(400).send({ status: false, message: 'Unsupported DB type' });
        }
    } catch (err) {
        logger.error('Error deleting modelTCMatrix from settings: %s', err.message);
        res.status(500).send({ status: false, message: 'Error deleting modelTCMatrix', error: err.message });
    }
};
