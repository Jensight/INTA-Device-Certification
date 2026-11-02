const urllib = require("urllib");
const fs = require("fs");
const axios = require("axios");
var formstream = require("formstream");
var FormData = require("form-data");
var config = require("../config");
let logger =require('./logger')
const errLogger = require('./errorLogger');
const { getProxyDispatcher } = require("./proxy");

/* authenticateUser*/
module.exports.authenticateUser = async (userName, password) => {
    try {
        var result = await urllib.request(`${config.JIRA_URL}/rest/auth/1/session`, {
            timeout: [10000, 1800000],
            method: "POST",
            data: { username: userName, password: password },
            contentType: "json",
            dispatcher: getProxyDispatcher()
        });
        return result.res.headers["set-cookie"].join(";");
    } catch (error) {
        errLogger.error('Error occurred while authenticating user');
        throw error;
    }
};
/* getExecutions*/
module.exports.getExecutions = async (cookie, tcId) => {
    try {
        var allExecutions = await urllib.request(
            `${config.JIRA_URL}/rest/zapi/latest/zql/executeSearch?maxRecords=2000&zqlQuery=executionStatus IN ('UNEXECUTED','FAIL') AND issue = ${tcId}`,
            {
                timeout: [10000, 1800000],
                method: "GET",
                contentType: "json",
                headers: { cookie: cookie },
                dispatcher: getProxyDispatcher()
            }
        );
        exports.setWorkInProgress(JSON.parse(allExecutions.data.toString()), cookie);
        return JSON.parse(allExecutions.data.toString());
    } catch (error) {
        errLogger.error('Error in setting Work in get executions');
        throw error;
    }
};
/* setWorkInProgress*/
module.exports.setWorkInProgress = async (executions, cookie) => {
    executions = executions.executions;
    try {
        for (let index = 0; index < executions.length; index++) {
            const executionId = executions[index]["id"];
            try {
                var response = await urllib.request(`${config.JIRA_URL}/rest/zapi/latest/execution/${executionId}/execute`, {
                    timeout: [10000, 1800000],
                    method: "PUT",
                    contentType: "json",
                    headers: { cookie: cookie },
                    data: { status: 3 },
                    dispatcher: getProxyDispatcher()
                });
            } catch (error) {
                throw new Error("Error in setting Work in Progress")
            }
        }
    } catch (error) {
        errLogger.error('Error in setting Work in Progress');
        throw error;
    }
};
/*setPassFailStatus */
module.exports.setPassFailStatus = async (executions, cookie, result, path) => {
    executions = executions.executions;
    try {
        for (let index = 0; index < executions.length; index++) {
            const executionId = executions[index]["id"];
            try {
                var response = await urllib.request(`${config.JIRA_URL}/rest/zapi/latest/execution/${executionId}/execute`, {
                    method: "PUT",
                    contentType: "json",
                    headers: { cookie: cookie },
                    data: { status: result ? 1 : 2 },
                    dispatcher: getProxyDispatcher()
                });
                var form = new FormData();
                var splitArray = path.split("/");
                var fileName = splitArray[splitArray.length - 1] || "log.html";
                form.append("file", fs.createReadStream(path), fileName);
                var axiosConfig = {
                    headers: { cookie, ...form.getHeaders() }
                };
                if (config.PROXY_STATUS) {
                    const { HttpsProxyAgent } = require("https-proxy-agent");
                    axiosConfig.httpsAgent = new HttpsProxyAgent(config.PROXY_URL);
                    axiosConfig.proxy = false;
                }
                var attachmentResponse1 = await axios.post(
                    `${config.JIRA_URL}/rest/zapi/latest/attachment?entityId=${executionId}&entityType=Execution`,
                    form,
                    axiosConfig
                );
            } catch (error) {
                errLogger.error('Error occurred while updating pass fail status');
                throw new Error("Error in updating Log file")
            }
        }
    } catch (error) {
        errLogger.error('Error occurred while updating pass fail status');
        throw error;
    }
};
/*getProjectDetails */
module.exports.getProjectDetails = async (projectKey, cookie) => {
    try {
        var projectDetail = await urllib.request(`${config.JIRA_URL}/rest/api/2/project/${projectKey}`, {
            timeout: [10000, 1800000],
            method: "GET",
            contentType: "json",
            headers: { cookie: cookie },
            dispatcher: getProxyDispatcher()
        });
        var projectDetails = JSON.parse(projectDetail.data.toString());
        if (projectDetails.hasOwnProperty("id")) {
            return projectDetails.id;
        } else if (projectDetails.hasOwnProperty("errorMessages")) {
            throw new Error(projectDetails["errorMessages"]);
        }
    } catch (error) {
        errLogger.error('Error occurred while getting project details');
        throw error;
    
    }
};
/*createCycleForAProject */
module.exports.createCycleForAProject = async (cookie, projectId, cycleName) => {
    try {
        var projectDetail = await urllib.request(`${config.JIRA_URL}/rest/zapi/latest/cycle`, {
            timeout: [10000, 1800000],
            method: "POST",
            contentType: "json",
            headers: { cookie: cookie },
            data: {
                name: cycleName,
                startDate: getJIRADateFormat(),
                endDate: getJIRADateFormat(),
                projectId: projectId,
                versionId: "-1"
            },
            dispatcher: getProxyDispatcher()
        });
        var projectDetails = JSON.parse(projectDetail.data.toString());
        if (projectDetails.hasOwnProperty("id")) {
            return projectDetails.id;
        } else if (projectDetails.hasOwnProperty("errorMessages")) {
            throw new Error(projectDetails["errorMessages"]);
        } else {
            errLogger.error('Error occurred while Creating cycle for a project');

        }
    } catch (error) {
        errLogger.error('Error occurred while Creating cycle for a project');
        throw error;
    }
};
/*addTestcasesToCycle */
module.exports.addTestcasesToCycle = async (cookie, tcIds, projectId, cycleId) => {
    try {
        var projectDetail = await urllib.request(`${config.JIRA_URL}/rest/zapi/latest/execution/addTestsToCycle/`, {
            timeout: [10000, 1800000],
            method: "POST",
            contentType: "json",
            headers: { cookie: cookie },
            data: {
                issues: tcIds,
                versionId: -1,
                cycleId: cycleId,
                projectId: projectId,
                method: "1"
            },
            dispatcher: getProxyDispatcher()
        });
        var projectDetails = JSON.parse(projectDetail.data.toString());
        if (projectDetails.hasOwnProperty("jobProgressToken")) {
            return projectDetails.jobProgressToken;
        } else {
            throw new Error(projectDetails["errorMessages"] || "Some Error Occurred");
        }
    } catch (error) {
        errLogger.error('Error occurred while add testcases to cycle');
        throw error;
    }
};


/*getExecutionsFromCycle */
module.exports.getExecutionsFromCycle = async (cookie, tcId, cycleId) => {
    try {
        var allExecutions = await urllib.request(
            `${config.JIRA_URL}/rest/zapi/latest/zql/executeSearch?maxRecords=2000&zqlQuery=executionStatus IN ('UNEXECUTED','FAIL') AND issue = ${tcId} AND cycleId = ${cycleId} `,
            {
                timeout: [10000, 1800000],
                method: "GET",
                contentType: "json",
                headers: { cookie: cookie },
                dispatcher: getProxyDispatcher()
            }
        );
        exports.setWorkInProgress(JSON.parse(allExecutions.data.toString()), cookie);
        return JSON.parse(allExecutions.data.toString());
    } catch (error) {
        errLogger.error('Error occurred while in Executions From cycle %s',tcId);
        throw error;
    }
};
/*getJIRADateFormat */
function getJIRADateFormat() {
    var currentDate = new Date()
        .toDateString()
        .split(" ")
        .slice(1);
    var date = currentDate[1].startsWith(0) ? currentDate[1].slice(1) : currentDate[1];
    var month = currentDate[0].toLocaleUpperCase();
    var year = currentDate[2].slice(2);
    return date + "/" + month + "/" + year;
}


// module.exports.getProjectDetails("ICNA", "");
