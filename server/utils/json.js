var fs = require('fs');
const { nextTick } = require('process');
const config = require("../config");
let logger = require('./logger');
const errors = require('../errors');
const execution = require('../controllers/execution.controller');
const errLogger = require('./errorLogger');
// const { dbType } = require('../server');
// const { ObjectId } = require('mongodb');
const ObjectId = require("mongodb").ObjectId;
const { testBedForScheduleRegression, findOneDb, findFromDb, deleteOneFromDb, updateOneToDb, updateManyToDb, findOneandUpdateToDB, findProjectionFromDb, deleteManyFromDB } = require("../model/regressionModel");


/* Logging Purpose*/
var logStreams = {};
var logCollector = {};
/* Create JSon Document */
module.exports.createJsonDocument = async (testcaseData, teamName) => {
    try {
        var folderName = config.LOG_PATH + testcaseData.tcId + "_" + testcaseData.tcName.replace(/:/g, '');
        //await createFolders(folderName);
        await execution.createFolders(folderName)
        logStreams[testcaseData._id] = {};
        logStreams[testcaseData._id]["text"] = fs.createWriteStream(`${folderName}/${testcaseData.tcName.replace(/:/g, '')}.txt`);
        logStreams[testcaseData._id]["path"] = folderName;
        logCollector[testcaseData._id] = {
            logs: []
        };
        return await logTestbedDetailsText(testcaseData._id, testcaseData, teamName);

    } catch (error) {
        errLogger.error('[%s : %s] Error occurred while create JSON Document: %s',teamName,testcaseData._id,error);
        throw new Error(error)
        // await session.abortTransaction();
        // session.endSession();
        // res.status(500);
        // res.end();
        // res.status(500).send({status: false, errorCode:errors.CREATE_ERROR.code, message:errors.CREATE_ERROR.message + " in create json documents.", 
        //     errorDetail: error.message, type: "problems/error"});
    }

}
/* logTestbedDetailsText */
async function logTestbedDetailsText(jobId, job, teamName) {
    const testbedData = job;
    var testGroup = await getTestGroup(teamName, testbedData.tcGroupId)
    for (let x = 0; x < testbedData.testSteps.length; x++) {
        delete testbedData.testSteps[x].apiId;
        delete testbedData.testSteps[x].api_id;
        let stepData = testbedData.testSteps[x].doHttp.postBody.bodyParameter
        for (let y = 0; y < stepData.length; y++) {
            stepData[y].argumentValue = await getVariableName(teamName, stepData[y].argumentValue);
        }

    }
    const deviceData = testbedData.testSteps.reduce((oldValue, newValue) => {
        const objKeys = Object.keys(newValue);
        var temp = oldValue;
        for (let index = 0; index < objKeys.length; index++) {
            const element = objKeys[index];
            if (element === 'doHttp') {
                for (let indexY = 0; indexY < newValue[element].postBody.bodyParameter.length; indexY++) {
                    temp += `${newValue[element].postBody.bodyParameter[indexY].argumentName.toLocaleUpperCase()} : ${newValue[element].postBody.bodyParameter[indexY].argumentValue} \r\n`;
                }
            } else {
                temp += `${element.toLocaleUpperCase()} : ${newValue[element]} \r\n`;
            }
        }
        return (temp += "------------------------------------ \r\n");
    }, "");
    await logStreams[jobId]["text"].write(
        `TESTCASE DETAILS \r\n
TESTCASE NAME: ${testbedData.tcName} \r
TESTCASE ID: ${testbedData.tcId} \r
TESTCASE GROUP: ${testGroup.testGroupName} \r
MANUAL EXECUTION TIME: ${testbedData.manualExectime} Mins \r
\r\n
***********TESTCASE STEPS**********\r\n
${deviceData}\r\n\r\n`
    );
}
/* createFolder */
// async function createFolders(...folderNames) {
//     for (let index = 0; index < folderNames.length; index++) {
//         const element = folderNames[index];
//         if (!fs.existsSync(element)) {
//             try {
//                 fs.mkdirSync(element, {
//                     recursive: true
//                 });
//             } catch (error) {
//                 errLogger.error(' Error occurred while Creating Creating Folders');
//                 throw error
//             }
//         }
//     }
// }

/* Get Test Group*/
async function getTestGroup(teamName, tcGroupId) {
    
    try {
        var collectionName = teamName + '_TestCase';
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    var id = ObjectId.createFromHexString(tcGroupId);
        var tcData = await findOneDb(dbType, client, collectionName, { _id: id });
        return tcData;
    } catch (error) {
        errLogger.error('[%s : %s] Error occurred while getting TestGroup details',teamName,tcGroupId);
    }
}

/* Get Test Group*/
async function getVariableName(teamName, tcGroupId) {
    try {
        var re = /[0-9A-Fa-f]{6}/g;
        var myArray = tcGroupId.split(/[.\:]/);
        var word1 = myArray[0];
        var word2 = myArray[1];
        let position = word1.search("MODEL");
        if (position >= 0) {
            var splitWord1 = word1.split(/[.\-]/);
            word1 = splitWord1[1];
        }
        var collectionName = teamName + '_TestBed';
        const client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType;
        var id = word1;

        if (word1 === 'GLOBAL' || word1 === 'RETURN_VAL' || word1 === 'ELEMENT') {
            id = word1;
        } else if (re.test(word1)) {
            id = ObjectId.createFromHexString(word1);
        } else {
            id = word1;
        }

        if (re.test(word2)) {
            var word2Id = ObjectId.createFromHexString(word2);
            var tcDataWord2 = await findOneDb(dbType, client, collectionName, { _id: word2Id });
            // if (!tcDataWord2) {
            //     console.error(`No data found for word2 ID151: ${word2Id}`);
            //     throw new Error(`No data found for word2 ID152: ${word2Id}`);
            // }
            word2 = tcDataWord2.nodeName;
        }

        var finalValue = word1 + ':' + word2;
        if (word1 === 'GLOBAL' || word1 === 'RETURN_VAL' || word1 === 'ELEMENT') {
            finalValue = word1 + ':' + word2;
        } else if (re.test(word1)) {
            var tcData = await findOneDb(dbType, client, collectionName, { _id: id });
            // if (!tcData) {
            //     console.error(`No data found for word1 ID163: ${id}`);
            //     throw new Error(`No data found for word1 ID164: ${id}`);
            // }
            finalValue = tcData.nodeName + ':' + word2;
        } else if (typeof word2 === 'undefined') {
            finalValue = word1;
        } else {
            finalValue = word1 + ':' + word2;
        }

        return finalValue;
    } catch (error) {
        errLogger.error('[%s : %s] Error occurred while getting variable name: %s', teamName, tcGroupId, error.message);
        throw new Error(error);
    }
}