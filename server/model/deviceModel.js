const errlogger = require("../utils/errorLogger");
//fetch devices
const getAllDevices = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            db = client.db()
            const devices = await db
                .collection(collectionName)
                .find({}, { sort: { _id: -1 } })
                .toArray();
            return devices;
        } else {
            const errorMessage = "Db Type is not supported";
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error fetching devices: ${error.message}`);
        throw error; // Re-throw the error to be handled by the caller
    }
};

// add vendor
const addNewVendorToDB = async (dbType, client, collectionName, vendorData) => {
    try {
        if (dbType === "MongoDB") {
            const session = client.startSession();
            try {
                session.startTransaction();
                const db = client.db();
                const opts = {
                    session,
                    returnOriginal: false
                };

                await db.collection(collectionName).updateOne(
                    { vendors: { $exists: true } },
                    { $push: { vendors: vendorData } },
                    opts
                );

                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error adding new vendor in MongoDB: ${error.message}`);
                throw error;
            } finally {
                session.endSession();
            }
        } else {
            const errorMessage = "Db Type is not supported";
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error adding new vendor: ${error.message}`);
        throw error; // Re-throw the error to be handled by the caller
    }
}

// Delete vendor

const deleteExistingVendorFromDB = async (dbType, client, collectionName, vendor) => {
    try {
        if (dbType === "MongoDB") {
            const session = client.startSession();
            try {
                session.startTransaction();
                let db = client.db();
                const opts = {
                    session,
                    returnOriginal: false
                };
                await db.collection(collectionName).updateOne({
                    vendors: {
                        $exists: true
                    }
                }, {
                    $pull: {
                        vendors: vendor
                    }
                }, opts)

                await db.collection(collectionName).deleteMany({
                    $or: [{
                        deviceVendor: vendor
                    }, {
                        vendor: vendor
                    }]
                }, { multi: true, ...opts })
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error deleting vendor in MongoDB: ${error.message}`);
                throw error;
            } finally {
                session.endSession();
            }
        } else {
            const errorMessage = "Db Type is not supported";
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error deleting vendor: ${error.message}`);
        throw error;
    }
}

const editExisitingVendorFromDB = async (dbType, client, collectionName, vendor) => {
    try {
        if (dbType === "MongoDB") {
            const session = client.startSession();
            let db = client.db();
            try {
                session.startTransaction();
                const opts = {
                    session,
                    returnOriginal: false
                };
                await db.collection(collectionName).updateOne({
                    vendors: {
                        $exists: true
                    },
                    vendors: vendor.oldName
                }, {
                    $set: {
                        'vendors.$': vendor.newName
                    }
                }, opts);
                await db
                    .collection(collectionName)
                    .updateMany({
                        deviceVendor: vendor.oldName
                    }, {
                        $set: {
                            deviceVendor: vendor.newName
                        }
                    }, { multi: true, ...opts });
                await db
                    .collection(collectionName)
                    .updateMany({
                        vendor: vendor.oldName
                    }, {
                        $set: {
                            vendor: vendor.newName
                        }
                    }, { multi: true, ...opts })
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error editing vendor in MongoDB: ${error.message}`);
                throw error;
            } finally {
                session.endSession();
            }
        } else {
            const errorMessage = "Db Type is not supported";
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error editing vendor: ${error.message}`);
        throw error;
    }
}


// exports.getVendorListFromDB = getVendorListFromDB;
exports.getAllDevices = getAllDevices;
exports.addNewVendorToDB = addNewVendorToDB;
exports.deleteExistingVendorFromDB = deleteExistingVendorFromDB;
exports.editExisitingVendorFromDB = editExisitingVendorFromDB;