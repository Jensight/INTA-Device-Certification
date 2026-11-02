const urllib = require("urllib");
var config = require("../config");
const jsdom = require("jsdom");
const _ = require("lodash");
const tools = require("../utils/tools");
const axios = require("axios");
const errors = require("../errors");
const logger = require("../utils/logger");
const errLogger = require("../utils/errorLogger");
const { from } = require("form-data");
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const execution = require("./execution.controller");
const { ObjectId } = require('mongodb');
const { getUserByUsername, getJiraConfigFromDB, getExtraSystemConfigFromDB, getUserNamefromDb, settingsDataFromDb } = require("../model/userModel");
const { updateOneToDb } = require("../model/regressionModel");
const e = require("express");
const { getProxyDispatcher } = require("../utils/proxy");




/* Login Auth For XRAY*/
exports.getTestCaseDetail = async (req, res, next) => {
  var result = {};
  if (config.XRAY_ENABLE === true) {
    var testCaseId = req.params.id;
    var username = req.query.username;
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
      var allUsers = await getUserByUsername(dbType, client, username);
      if (allUsers != null) {
        var selectedUser = _.find(allUsers.users, (obj) => {
          return String(obj.username) === String(username);
        });
        var jira = _.find(allUsers.jiraConfig, (obj) => {
          return obj.jiraToken;
        });
      }



      var xrayPassword = await tools.decryptPassword(jira.jiraToken);
      //var response = await loginXray(testCaseId, selectedUser.email, xrayPassword);
      // var auth =
      //   "Basic " +
      //   Buffer.from(selectedUser.email + ":" + xrayPassword).toString("base64");
      var auth = "Bearer " + xrayPassword;



      var response = await urllib.request(
        config.XRAY_DOMAIN_API + "/rest/api/2/issue/" + req.params.id,
        {
          dispatcher: getProxyDispatcher(),
          timeout: [1000000, 1800000],
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: auth,
          },
          contentType: "json",
        }
      );
      console.log(
        "response in getTestCaseDetail => ",
        response.data.toString("utf8")
      );
      var resp = {};
      if (response.status !== 200) {
        response.error = 1;
        resp.error = 1;
      } else {
        response.error = 0;
        resp = JSON.parse(response?.data.toString("utf8"));
        resp.error = 0;

        if (resp?.fields?.issuetype?.name !== "Xray-Test") {

          resp.error = 1;
          resp.message = "The issue is not of type 'Xray-Test'.";
        }
      }
      res.send(resp);
    } catch (err) {
      errLogger.error(
        "[%s : %s] Error occured while getTestCaseDetail. " +
        req.query.username +
        err
      );
      result.error = 1;
      res.send(result);
    }
  } else {
    result.error = 1;
    errLogger.error(
      "[%s : %s] Error occured while getTestCaseDetail. " + req.query.username
    );
    res.send(result);
  }
};

module.exports.ssoLoginUser = async (postData) => {
  try {
    console.log("ssoLoginUser => ", postData);
    /**
     * Step - 1
     * Invoke API to get XSRF Token
     */
    /*var result = await urllib.request(config.XRAY_STEP_1_URL,
            {
                enableProxy: config.PROXY_STATUS,
                proxy: config.PROXY_URL,
                timeout: [1000000, 1800000],
                method: "GET",
                contentType: "json",
            }
        );
        var cookies = result.headers["set-cookie"];
        var cookiesData = await parseCookies(cookies);*/
    /**
     * Step - 2
     * Invoke API to Auth CSRF
     */
    /*var postBody = {
            username: postData.XRAY_USERNAME,
        };

        var result2 = await urllib.request(config.XRAY_STEP_2_URL,
            {
                enableProxy: config.PROXY_STATUS,
                proxy: config.PROXY_URL,
                timeout: [1000000, 1800000],
                method: "POST",
                content: JSON.stringify(postBody),
                headers: {
                    "Content-Type": "application/json",
                    cookie: cookies,
                },
            }
        );*/

    /**
     * Step - 3
     * Invoke API to get redirect URL, used to get cloud session token
     */
    /*var response1 = await axios.get('https://inhomeengineering.atlassian.net/rest/api/3/issue/DV-506', {
            headers: {
              'Accept': 'application/json'
            },
            auth: {
              username: 'gangad.palla@vodafoneziggo.com',
              password: 'ATATT3xFfGF0_tziGuzGmXlSu3wTnvdxWF3Fp279LY9PwcJRYcW-LpLKUP8Wecoa2rY0zashvNNPb3LP87nqLgtNu17wp9V3v-h7hOZA-_A2MiR3RVh8JXapawQ1WxWfoMJBm16-7MfCqULWe9WpxxIWgavs1RN-ZGxUh_okAaGRdNtoMXdK0jQ=63DAFCFE'
            }
        })
        console.log('response1 => ', response1.data);
        //var commentDataPost = {name: 'Test Name', status: "Pass"};
        var response2 = await axios.post('https://inhomeengineering.atlassian.net/rest/api/2/issue/DV-530',{
            /*"fields":
            {
                "project":
                {
                    "key": "DV"
                },
                "parent":
                {
                    "key": "DV-530"
                },
                //"summary": "Test Ticket using API 2 Apeksha___qy_1",
                //"description": "Don't forget to do this too.",
                "issuetype":
                {
                    //"id": "5"
                    'name': 'Epic'
                }
            }*
            //"add":["DV-416"]
          
                
            
        },{
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            auth: {
              username: 'apeksha.ankushpatil@vodafoneziggo.com',
              password: 'ATATT3xFfGF0shhO5jyGC8JRtau3HWHyx-6k39S152nJ85gr8sfs_HJtpIO9mNn8t1c3pAhgLdUNLzHPXrXh_ozaqm22vyABSa7Ob3zg-N7qZEjN5oZzIvUhlKV7r-QmMkId1tizcKQm293-4NRng4m8y4lxd90FVjd0B83QGVxOX9B5-EOLxm0=9C701B76'
            }
          })
          console.log('response2 => ', response2.data);*/
    //console.log('postData => ', postData)

    // var auth =
    //   "Basic " +
    //   Buffer.from(
    //     `${postData.XRAY_USERNAME.trim()}:${postData.XRAY_PASSWORD.trim()}`
    //   ).toString("base64");
    const auth = "Bearer " + postData.XRAY_PASSWORD.trim();
    console.log("auth => ", auth);
    let axiosOptions = {
      timeout: 1800000,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: auth,
      },
    };
    if (config.PROXY_STATUS) {
      const { HttpsProxyAgent } = require("https-proxy-agent");
      axiosOptions.httpsAgent = new HttpsProxyAgent(config.PROXY_URL);
      axiosOptions.proxy = false; // disable axios built-in proxy to use the agent
    }
    let response = await axios.get(config.XRAY_DOMAIN, axiosOptions);



    return { data: response.data, status: response.status };
  } catch (error) {
    console.log("error => ", error);
    errLogger.error(
      "[%s : %s] Error occured while ssoLoginUser. " +
      postData.XRAY_USERNAME +
      " " +
      JSON.stringify(error)
    );
    var response = {};
    if (error.status == -1) {
      response.error = true;
      response.errorMessage =
        "API is not Available/ Not Reachable from the Server. Contact Administrator";
    } else if (error.status == -2) {
      response.error = true;
      response.errorMessage =
        "Connection Timeout as there is No Response from API. Contact Administrator";
    } else {
      response.error = true;
      response.errorMessage =
        "Some Error Occurred in API. Contact Administrator";
    }
    return response;
  }
};

/*const loginXray = async (testCaseId, xrayEmail, xrayPassword) => {
    try {
        
         // Step - 1
         //Invoke API to get XSRF Token
         
        console.log('inside loginXray')
        var result = await urllib.request(config.XRAY_STEP_1_URL,
            {
                enableProxy: config.PROXY_STATUS,
                proxy: config.PROXY_URL,
                timeout: [1000000, 1800000],
                method: "GET",
                contentType: "json",
            }
        );
        var cookies = result.headers["set-cookie"];
        var cookiesData = await parseCookies(cookies);

        
          //Step - 2
          //Invoke API to Auth CSRF
         

        var postBody = {
            username: xrayEmail,
        };

        await urllib.request(config.XRAY_STEP_2_URL,
            {
                enableProxy: config.PROXY_STATUS,
                proxy: config.PROXY_URL,
                timeout: [1000000, 1800000],
                method: "POST",
                content: JSON.stringify(postBody),
                headers: {
                    "Content-Type": "application/json",
                    cookie: cookies,
                },
            }
        );

        
         // Step - 3
          //Invoke API to get redirect URL, used to get cloud session token
         

        var postBody2 = {
            username: xrayEmail,
            password: xrayPassword,
            state: {
                csrfToken:
                cookiesData["atlassian.account.xsrf.token"].split(";")[0],
                anonymousId: cookiesData["atlassian.account.ffs.id"].split(";")[0],
            },
            token: config.JIRA_AUTH_TOKEN,
            aaCompatible: true,
        };

        var resultStep3 = await urllib.request(config.XRAY_STEP_3_URL + xrayEmail + '&errorCode',
            {
                enableProxy: config.PROXY_STATUS,
                proxy: config.PROXY_URL,
                timeout: [1000000, 1800000],
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    cookie: cookies,
                },
                content: JSON.stringify(postBody2),
            }
        );
        
         // Step - 4
         //API Used to get cloud session token from cookies
         
        var resultStep4 = await urllib.request(
            JSON.parse(resultStep3.data.toString()).redirectUri,
            {
                enableProxy: config.PROXY_STATUS,
                proxy: config.PROXY_URL,
                timeout: [1000000, 1800000],
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    cookie: cookies,
                },
            }
        );

        var cookiesSession = resultStep4.res.headers["set-cookie"];
        var cookiesDataSession = await parseCookies(cookiesSession);

        // API to retrive Testcase details

        var resultStep5 = await urllib.request(config.XRAY_DOMAIN + '/rest/api/latest/issue/' +
            testCaseId,
            {
                enableProxy: config.PROXY_STATUS,
                proxy: config.PROXY_URL,
                timeout: [1000000, 1800000],
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    cookie:
                        "cloud.session.token=" +
                        cookiesDataSession["cloud.session.token"].split(";")[0],
                },
            }
        );
        //console.log('JSON.parse(resultStep5.data.toString()) 239', JSON.parse(resultStep5.data.toString()));
        return JSON.parse(resultStep5.data.toString());
    } catch (error) {
        if (error.status == -1) {
            throw new Error(
                "API is not Available/ Not Reachable from the Server. Contact Administrator"
            );
        } else if (error.status == -2) {
            throw new Error(
                "Connection Timeout as there is No Response from API"
            );
        } else {
            throw new Error("Some Error Occurred in API");
        }
    }
};*/

/**
 * Used to get Cookies from API
 * @param {*} request
 * @returns
 */

const parseCookies = async (request) => {
  var list = {},
    rc = request;

  for (let index = 0; index < rc.length; index++) {
    const element = rc[index];
    var parts = element.split("=");
    list[parts.shift().trim()] = decodeURI(parts.join("="));
  }
  return list;
};

exports.createJiraTestCase = async (req, res, next) => {
  try {
    let CreateJiraResult = await exports.createTestCase(req);
    console.log('CreateJiraResult', CreateJiraResult);
    res.status(200).send(CreateJiraResult);
  } catch (err) {

    errLogger.error(
      "[%s : %s] Error occured while createJiraTestCase. " + err,
      req.body.team,
      req.query.username
    );

    console.log("result in create test => ", result, err.error.message);
    res.status(400).send({ error: err.error.message })

  }
}

exports.CreateJiraExecution = async (req, res, next) => {
  if (req.body.jira.update && req.body.jira.tests.length > 0) {
    req.body.tests = req.body.jira.tests;

    req.body.team = req.params.teamName;

    req.body.user = req.query.username;

    let runId = await execution.generateRegressionId(
      req.body,
      req.body.startTime
    );

    req.body.summary = runId ? runId : "";
    try {
      const client = req.app.locals.client;
      const dbType = req.app.locals.dbType;
      var allUsers = await getUserByUsername(dbType, client, req.body.user);
      const selectedUser = allUsers?.users.find(
        (obj) => String(obj.username) === String(req.body.user)
      );
      req.body.email = selectedUser.email;
      //   const usersData = await xray.ValidateUser(req);
      if (req.params.isJiraUser) {
        let CreateJiraResult = await exports.createTestCase(req);

        if (CreateJiraResult["issueKey"]) {
          console.log("CreateJiraResult>>>>>", CreateJiraResult);
          res.locals.validateRequest = true;
          req.body.jira.key = CreateJiraResult["issueKey"];
          req.body.jira.type = "update";
          req.body.jira.ueId = CreateJiraResult["issueId"];
          req.body.jira.regType = "AR";
          req.body.jira.jiraKeyMsg =
            "Jira Ticket got created with key - " +
            CreateJiraResult["issueKey"];
          console.log("req>>>>>", req.body);
        }
      } else {
        req.body.jira.inValidUserMsg =
          "API User doesn’t have Jira access to update test execution results, proceeding with INTA Regression";
      }
      next();
    } catch (error) {

      console.error(error);

    }
  } else {
    next();
  }
};

// Create Testcase For XRAY
exports.createTestCase = async (req, jiraObj, modelName, next) => {
  console.log('inside createtestcase', req.params, req.query, req.body, jiraObj);
  const client = require("../utils/mongodb").client;
  const dbType = require("../server").dbType;
  let result = {};
  if (config.XRAY_ENABLE === true) {
    const username = req?.query?.username ? req.query.username : (req?.body?.user ? req.body.user : req.user);

    const teamName = req?.params?.teamName ? req.params.teamName : (req?.body?.team ? req.body.team : req.teamName);

    try {
      var allUsers = await getUserByUsername(dbType, client, username);
      const selectedUser = allUsers?.users.find(obj => String(obj.username) === String(username));
      const jira = allUsers?.jiraConfig.find(obj => obj.jiraToken);
      const xrayPassword = await tools.decryptPassword(jira.jiraToken);
      const response = await createXray(
        jiraObj,
        selectedUser.email,
        xrayPassword,
        teamName,
        modelName
      );

      response.error = 0;
      return response;
    } catch (err) {

      const errorMsg = err?.error?.message || String(err.error || err);

      errLogger.error(
        "[%s : %s] Error occured while create test execution in jira: %s",
        teamName,
        username,
        errorMsg
      );

      console.log("result in create test => ", result, errorMsg);
      return { error: errorMsg, errorDetail: errorMsg };

    }
  } else {

    result.error = 1;
    res.send(result);
  }
};

const createXray = async (postData, xrayEmail, xrayPassword, team, modelName) => {
  try {
    console.log(
      "inside createXray>>>",
      postData,
      xrayEmail,
      xrayPassword,
      team,
      modelName
    );


    var auth = "Bearer " + xrayPassword;
    //var cookiesDataSession = await loginCloudSessionToken(xrayEmail, xrayPassword);

    const testEnvLabel = await this.getCustomFieldIdByName("Test Environments", auth);
    console.log('testEnvLabel => ', testEnvLabel);
    const moduleId = await this.getCustomFieldIdByName("Module", auth);
    console.log('modelName => ', modelName, moduleId);
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType
    /**
     * Step - 2
     * Invoke API to Create Testcase in Jira
     */

    let allsetting = await getJiraConfigFromDB(dbType, client);
    console.log('allsetting => ', allsetting);
    let jiraConf = allsetting[0].jiraConfig[0].teams;

    var projectId;
    if (jiraConf) {
      for (let i = 0; i < jiraConf.length; i++) {
        if (team == jiraConf[i].teamname) {
          projectId = jiraConf[i].jira_project_id;
        }
      }
    }

    var postBody2 = {
      fields: {
        project: {
          key: projectId,
          //'key': 'DV'
        },
        summary: postData.summary,
        description: postData.summary,
        issuetype: {
          id: config.JIRA_TESTEXECUTION_ID,
          //'name': 'Test Execution'
        },
        labels: postData.labels,
        [testEnvLabel]: [postData.teamName],
        assignee: { name: xrayEmail },
        [moduleId]: modelName,
      },
    };

    var resultStep3 = await urllib.request(
      config.XRAY_DOMAIN_API + "/rest/api/2/issue",
      {
        dispatcher: getProxyDispatcher(),
        timeout: [1000000, 1800000],
        method: "POST",
        headers: {

          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: auth,
        },
        data: postBody2,
        contentType: "application/x-www-form-urlencoded",
      }
    );

    var resultData = JSON.parse(resultStep3.data);

    if (resultData.errors) {
      throw new Error(JSON.stringify(resultData.errors));
    }
    var issueKey = JSON.parse(resultStep3.data.toString()).key;
    var issueId = JSON.parse(resultStep3.data.toString()).id;
    console.log("issueId  === >>>> ", issueId, "issueKey ====>>> ", issueKey);

    /**
     * API to add tests to testcase
     */


    if (issueKey) {
      const test_CaseIds = {
        add: postData.tests
      };

      var resultaddTC = await urllib.request(
        config.XRAY_DOMAIN_API + "/rest/raven/1.0/api/testexec/" + issueKey + "/test",
        {
          dispatcher: getProxyDispatcher(),
          timeout: [1000000, 1800000],
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: auth,
            // "X-acpt": jwtToken,
          },

          data: JSON.stringify(test_CaseIds),

        }
      );
      console.log("resultaddTC => ", JSON.parse(resultaddTC.data.toString()));
      logger.info(
        "Creater xray execution ticket and add TC " + JSON.stringify(resultaddTC)
      );
    }

    return {
      error: "success",
      issueId: issueId,
      issueKey: issueKey,
    };
  } catch (error) {
    console.log("error>>>JSON => ", error);
    if (typeof error === 'object' && error !== null) {
      errLogger.error(
        "[%s : %s] Error occured while createXray. " + JSON.stringify(error),
        team,
        xrayEmail
      );
    } else {
      errLogger.error(
        "[%s : %s] Error occured while createXray. " + error,
        team,
        xrayEmail
      );
    }
    throw { error };
    if (error.status == -1) {
      throw new Error("API is not Available/ Not Reachable from the Server");
    } else if (error.status == -2) {
      throw new Error("Connection Timeout as there is No Response from API");
    } else {
      throw new Error("Some Error Occurred in API");
    }
  }
};

/**
 * Update function Status
 * @param {*} postData
 * @returns
 */
module.exports.updateXrayStatus = async (postData, username, team) => {

  console.log('postData 794 => ', postData);
  const client = require("../utils/mongodb").client;
  const dbType = require("../server").dbType;
  try {
    var allUsers = await getUserByUsername(dbType, client, username);
    if (allUsers != null) {
      var selectedUser = _.find(allUsers.users, (obj) => {
        return String(obj.username) === String(username);
      });
    }

    if (allUsers != null) {
      var jira = _.find(allUsers.jiraConfig, (obj) => {
        return obj.jiraToken;
      });

    }


    var xrayPassword = await tools.decryptPassword(jira.jiraToken);
    // var xrayPassword = await tools.decrypt(selectedUser.jiraPassword);
    var xrayEmail = selectedUser.email;
    //var cookiesDataSession = await loginCloudSessionToken(xrayEmail, xrayPassword);
    // var auth =
    //   "Basic " + Buffer.from(xrayEmail + ":" + xrayPassword).toString("base64");
    var auth = "Bearer " + xrayPassword;

    var dataPostUpdate = {
      filters: {
        testIssueIds: postData.tests,
      },
      fields: ["status"],
    };
    var resultStep5 = await urllib.request(config.XRAY_DOMAIN_API + "/rest/raven/1.0/api/testrun?testExecIssueKey=" + postData.executionKey + '&testIssueKey=' + postData.tests[0],
      {
        dispatcher: getProxyDispatcher(),
        timeout: [1000000, 1800000],
        method: "GET",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          "Authorization": auth
        },
        // content: JSON.stringify({
        //   add: dataPostUpdate.filters.testIssueIds, // Wrapping the array in an object with a key 'add'
        //   fields: dataPostUpdate.fields // Including fields in the request body
        // }),
      });

    var commentDataPost = ({} = dataPostUpdate);
    commentDataPost.name = postData.testsName;
    var result = {};
    if (resultStep5 && resultStep5.data) {
      result = JSON.parse(resultStep5.data);
      // Ensure postData.tests is an array and has at least one element
      if (Array.isArray(postData.tests) && postData.tests.length > 0) {
        result.testIssueId = postData.tests[0];
      } else {
        console.error("postData.tests is not an array or is empty");
      }
    }

    return [result];


    //console.log('commentDataPost  ===> ', commentDataPost);

    //Api is getting all the projects
    /*var resp = await urllib.request("https://inhomeengineering.atlassian.net/rest/api/3/project" ,
            {
                enableProxy: config.PROXY_STATUS,
                proxy: config.PROXY_URL,
                timeout: [1000000, 1800000],
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-acpt": jwtToken,
                    cookie:
                        "cloud.session.token=" +
                        cookiesDataSession["cloud.session.token"].split(";")[0],
                },
            })
            console.log('resp === >>> 743', resp);
            console.log('resp === >>> 743', JSON.parse(resp.data.toString()))*/
    //console.log('resultStep5 1004=> ' , resultStep5)
    //console.log('resultStep5.data.toString() => ', resultStep5.data.toString())
  } catch (error) {
    console.log(error);
    errLogger.error(
      "[%s : %s] Error occured while updateXrayStatus." + JSON.stringify(error),
      team,
      username
    );
    return { error };
    if (error.status == -1) {
      throw new Error("API is not Available/ Not Reachable from the Server");
    } else if (error.status == -2) {
      throw new Error("Connection Timeout as there is No Response from API");
    } else {
      throw new Error("Some Error Occurred in API");
    }
  }
};

/**
 * Update Status
 */

exports.updateTestCase = async (req, res, next) => {
  try {
    var response = await updateXray(req.body);
    res.send(response);
  } catch (err) {
    errLogger.error("[%s : %s] Error in update test case %s", err);
    res
      .status(500)
      .send({
        status: false,
        errorCode: errors.UPDATE_ERROR.code,
        message: errors.UPDATE_ERROR.message + " in update test case.",
        errorDetail: err.message,
        type: "problems/error",
      });
  }
};

/**
 * Update function
 * @param {*} postData
 * @returns
 */

module.exports.updateXray = async (postData, username, team, iteration) => {
  console.log('updateXray postData  ===> ', postData);
  const client = require("../utils/mongodb").client;
  const dbType = require("../server").dbType;
  try {
    var allUsers = await getUserByUsername(dbType, client, username);
    if (allUsers != null) {
      var selectedUser = _.find(allUsers.users, (obj) => {
        return String(obj.username) === String(username);
      });
    }
    if (allUsers != null) {
      var jira = _.find(allUsers.jiraConfig, (obj) => {
        return obj.jiraToken;
      });

    }

    var xrayPassword = await tools.decryptPassword(jira.jiraToken);
    // var xrayPassword = await tools.decrypt(selectedUser.jiraPassword);
    var xrayEmail = selectedUser.email;
    var auth = "Bearer " + xrayPassword;
    var resultStep5 = {};

    /**
     * API to add tests to testcase
     */
    var allsetting = await getExtraSystemConfigFromDB(dbType, client);
    var sysConf = allsetting[0].jiraConfig[0];
    var projectId;
    if (allsetting[0].jiraConfig[0].teams) {
      for (let i = 0; i < allsetting[0].jiraConfig[0].teams.length; i++) {
        if (team == allsetting[0].jiraConfig[0].teams[i].teamname) {
          let jira_config = allsetting[0].jiraConfig[0];
          let project_id_jira = jira_config.teams[i].jira_project_id;
          projectId = project_id_jira;
          //projectId = allsetting[0].systemConfig[0].teams[i].jira_project_id;
        }
      }
    }

    console.log('projectId>>>>', projectId);
    const tcStatus = postData.status == "PBV" ? "Warning" : postData.status;
    const options = {
      dispatcher: getProxyDispatcher(),
      timeout: [1000000, 1800000],
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      content: "Iteration " + iteration + " is completed with " + tcStatus,
    };

    const updateComment = await urllib.request(
      `${config.XRAY_DOMAIN_API}/rest/raven/1.0/api/testrun/${postData.id}/comment`,
      options
    );

    console.log('Test run comment updated:', updateComment.data);


    console.log('updateComment === >>> ', updateComment);
    //  if (jwtToken) {
    resultStep5 = await urllib.request(
      config.XRAY_DOMAIN_API + "/rest/raven/1.0/api/testrun/" +
      postData.id +
      "/status?status=" + postData.status,
      {
        dispatcher: getProxyDispatcher(),
        timeout: [1000000, 1800000],
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          //"X-acpt": jwtToken,
          Authorization: auth,
        },
        // content: JSON.stringify(dataPostUpdate),
      }
    );
    console.log('status update resultStep5  ==>>> ', resultStep5)
    // console.log('resultStep5.data.toString() 1185 ==>>> ',JSON.parse(resultStep5.data))
    // var result = {};
    // if (resultStep5 && resultStep5.data) {
    //   result = resultStep5.data;
    // }

    // return JSON.parse(result.toString());
    //   }
    //}
    //console.log('resp === >>> ', resp.data.toString());
  } catch (error) {

    console.log("error in update xray ==> ", error);
    console.log("error in update xray ==> ", resultStep5.data.toString());

    errLogger.error(
      "[%s : %s] Error occured while updateXray. " + JSON.stringify(error),
      team,
      username
    );
    return { error };
    if (error.status == -1) {
      throw new Error("API is not Available/ Not Reachable from the Server");
    } else if (error.status == -2) {
      throw new Error("Connection Timeout as there is No Response from API");
    } else {
      throw new Error("Some Error Occurred in API");
    }
  }
};

module.exports.updateMulTCForJiraIssueID = async (req, res, next) => {
  var result = {};
  var username = req.query.username;
  const client = req.app.locals.client;
  const dbType = req.app.locals.dbType;
  var teamName = "";
  try {
    var allUsers = await getUserByUsername(dbType, client, username);
    if (allUsers != null) {
      var selectedUser = _.find(allUsers.users, (obj) => {
        return String(obj.username) === String(username);
      });
    }

    var xrayPassword = await tools.decryptPassword(selectedUser.jiraPassword);
    var resAr = [];
    for (let i = 0; i < req.body.tc.length; i++) {

      // var auth =
      //   "Basic " +
      //   Buffer.from(selectedUser.email + ":" + xrayPassword).toString("base64");
      var auth = "Bearer " + xrayPassword;
      var response = await urllib.request(
        config.XRAY_DOMAIN_API + "/rest/api/2/issue/" + req.body.tc[i].tcId,
        {
          dispatcher: getProxyDispatcher(),
          timeout: [1000000, 1800000],
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: auth,
          },
          contentType: "json",
        }
      );
      //console.log('response 35 ', JSON.parse(response.data));
      //resAr.push(JSON.parse(response.data))
      var resp = {};
      if (response.status !== 200) {
        var tcId = req.body.tc[i].tcId.split("-");
        var tcd = tcId[1] == Number(tcId[1]) ? "number" : "string";

        if (
          JSON.parse(response.data).errorMessages[0] ==
          "Issue does not exist or you do not have permission to see it." &&
          tcd == "string" &&
          req.body.tc[i].issueId != ""
        ) {
          teamName = req.body.teamName + "_TestCase";
          var id = ObjectId.createFromHexString(req.body.tc[i]._id);
          var temp = req.body.tc[i];
          temp._id = id;
          temp.issueKey = "";
          try {
            await updateOneToDb(dbType, client, teamName, id, { issueKey: "", updatedAt: new Date().toISOString() }, opts);
          } catch (error) {
            errLogger.error(
              "[%s : %s] Error occured while editing %s: %s",
              req.body.teamName,
              req.query.username,
              error
            );
          }
        } else {
          console.log("inside else 1202");
        }
        resAr.push({
          key: req.body.tc[i].tcId,
          err: JSON.parse(response.data).errorMessages[0],
          status: "faild",
        });
        response.error = 1;
        resp.error = 1;
      } else {
        response.error = 0;
        resp = JSON.parse(response.data);
        resp.error = 0;
        resAr.push({ key: resp.key, issueId: resp.id, status: "pass" });
        if (!req.body.tc[i].issueKey || req.body.tc[i].issueKey !== resp.id) {
          teamName = req.body.teamName + "_TestCase";
          var id = ObjectId.createFromHexString(req.body.tc[i]._id);
          var temp = req.body.tc[i];
          temp._id = id;
          temp.issueKey = resp.id;
          temp.updatedAt = new Date().toISOString();
          let addNameOrGroup;
          try {
            var updres = await updateOneToDb(dbType, client, teamName, id, { issueKey: resp.id, updatedAt: new Date().toISOString() }, opts);
            logger.info(
              "[%s : %s] Updated %s successfully",
              req.body.teamName,
              req.query.username
            );
          } catch (error) {
            errLogger.error(
              "[%s : %s] Error occured while editing %s: %s",
              req.body.teamName,
              req.query.username,
              addNameOrGroup,
              error
            );
          }
        }
      }
    }
    res.send(resAr);
  } catch (err) {
    console.log("error===>", err);
    errLogger.error(
      "[%s : %s] Error occured while update multiple TC ID .",
      req.params.teamName,
      req.query.username
    );
    result.error = 1;
    res.send(result);
  }
};

module.exports.getDataForRunRegression = async (data) => {
  const client = require("../utils/mongodb").client;
  const dbType = require("../server").dbType;


  const axios = require('axios');
  const fs = require('fs');
  const path = require('path');
  const urllib = require('urllib');
  const FormData = require('form-data');

  try {
    var allUsers = await getUserNamefromDb(dbType, client, data.userDetails.username);
    if (allUsers != null) {
      var selectedUser = _.find(allUsers.users, (obj) => {
        return String(obj.username) === String(data.userDetails.username);
      });
    }
    var xrayPassword = await tools.decryptPassword(selectedUser.jiraPassword);
    var xrayEmail = selectedUser.email;
    // var auth =
    //   "Basic " + Buffer.from(xrayEmail + ":" + xrayPassword).toString("base64");
    var auth = "Bearer " + xrayPassword;
    var dataPost = {
      expand: ["names", "schema", "operations"],
      fields: ["summary", "status", "assignee"],
      fieldsByKeys: false,
      jql: "project = DV",
      maxResults: 15,
      startAt: 0,
    };
    var resp = await urllib.request(
      config.XRAY_DOMAIN_API + "/rest/api/2/search", //?jql=project%20%3D%20DV
      {
        dispatcher: getProxyDispatcher(),
        timeout: [1000000, 1800000],
        method: "POST",
        headers: {
          /*"Content-Type": "application/json",
                    "X-acpt": jwtToken,
                    cookie:
                        "cloud.session.token=" +
                        cookiesDataSession["cloud.session.token"].split(";")[0],*/
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: auth,
        },
        content: JSON.stringify({
          body: JSON.stringify(dataPost),
        }),
      }
    );
  } catch (err) {
    console.log(err);
  }
};

/** 
 * Attach  file to Jira ticket
 * @param {string} issueKey - Jira issue key
 * @param {string} filePath - Path to the HTML file
 * @returns {Promise} - Resolves with the attachment details if successful, rejects with an error if not
 */
module.exports.attachFileToJiraTicket = async (issueKey, filePath, username, teamName) => {

  try {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    var allUsers = await getUserByUsername(dbType, client, username);
    if (allUsers != null) {
      var selectedUser = _.find(allUsers.users, (obj) => {
        return String(obj.username) === String(username);
      });
    }
    if (allUsers != null) {
      var jira = _.find(allUsers.jiraConfig, (obj) => {
        return obj.jiraToken;
      });

    }


    var xrayPassword = await tools.decryptPassword(jira.jiraToken);
    //var xrayPassword = await tools.decrypt(selectedUser.jiraPassword);
    var xrayEmail = selectedUser.email;
    // var auth =
    //   "Basic " + Buffer.from(xrayEmail + ":" + xrayPassword).toString("base64");
    var auth = "Bearer " + xrayPassword;
    // Read the HTML file
    const fileData = fs.readFileSync(filePath);
    var fileName = filePath.split('/').pop();
    // Create form data
    const formData = new FormData();
    formData.append('file', fileData, {
      filename: fileName,
      contentType: 'text/html' // Set the content type for HTML files
    });

    // Convert form data to buffer
    const formDataBuffer = formData.getBuffer();
    const formDataHeaders = formData.getHeaders();

    // Set up the request options
    const options = {
      dispatcher: getProxyDispatcher(),
      timeout: [1000000, 1800000],
      method: 'POST',
      headers: {
        ...formDataHeaders,
        'Authorization': auth,
        'X-Atlassian-Token': 'no-check' // Required to bypass CSRF check
      },
      data: formDataBuffer,
      contentType: 'multipart/form-data'
    };

    // Make the request to attach the file
    const result = await urllib.request(
      `${config.XRAY_DOMAIN_API}/rest/api/2/issue/${issueKey}/attachments`,
      options
    );

    console.log("Attachment details:", result.data.toString());
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieve Custom Field ID by Custom Field Name
 * @param {string} fieldName - Custom Field Name
 * @returns {Promise<string>} - Resolves with the Custom Field ID if successful, rejects with an error if not
 */
module.exports.getCustomFieldIdByName = async (fieldName, auth) => {

  try {

    const response = await urllib.request(
      config.XRAY_DOMAIN_API + "/rest/api/2/field",
      {
        dispatcher: getProxyDispatcher(),
        timeout: [1000000, 1800000],
        method: "GET",
        headers: {

          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: auth,
        },

      });

    const fields = JSON.parse(response.data.toString());
    const customField = fields.find(field => field.name === fieldName);

    if (customField) {
      return customField.id;
    } else {
      throw new Error(`Custom Field '${fieldName}' not found`);
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Update Test Execution Ticket in JIRA Server
 * @param {string} issueKey - JIRA issue key
 * @param {string} status - Test execution status
 * @param {string} auth - JIRA authentication token
 * @returns {Promise} - Resolves with the updated test execution details if successful, rejects with an error if not
 */
module.exports.updateTestExecutionTicket = async (issueKey, tcsWithJIRA, username, teamName, labelsValue) => {
  try {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    let allUsers = await getUserByUsername(dbType, client, username);
    let jira = "";
    if (allUsers != null) {
      let selectedUser = _.find(allUsers.users, (obj) => {
        return String(obj.username) === String(username);
      });
      jira = _.find(allUsers.jiraConfig, (obj) => {
        return obj.jiraToken;
      });

    }

    let xrayPassword = await tools.decryptPassword(jira.jiraToken);

    let auth = "Bearer " + xrayPassword;

    // Update issue with new labels
    const updateResult = await urllib.request(
      `${config.XRAY_DOMAIN_API}/rest/api/2/issue/${issueKey}`,
      {
        dispatcher: getProxyDispatcher(),
        timeout: [1000000, 1800000],
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: auth,
        },
        content: JSON.stringify({
          fields: {
            labels: labelsValue,
          },
        }),
      }
    );


    if (tcsWithJIRA.length === 0) {
      const inprogressUpdate = await urllib.request(
        `${config.XRAY_DOMAIN_API}/rest/api/2/issue/${issueKey}/transitions`,
        {
          dispatcher: getProxyDispatcher(),
          timeout: [1000000, 1800000],
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: auth,
          },
          content: JSON.stringify({
            transition: {
              id: "11",
            },
          }),
        }
      );
    }


    const result = await urllib.request(
      `${config.XRAY_DOMAIN_API}/rest/api/2/issue/${issueKey}/transitions`,
      {
        dispatcher: getProxyDispatcher(),
        timeout: [1000000, 1800000],
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: auth,
        },
        content: JSON.stringify({
          transition: {
            id: '21',
          },
        }),
      }
    );
    console.log('Test execution ticket updated:', result.data);
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Validate Execution ID
 * @param {string} executionId - Execution ID to validate
 * @returns {boolean} - Returns true if the execution ID is valid, false otherwise
 */
module.exports.validateExecutionId = async (req, res, next) => {

  const client = req.app.locals.client;
  const dbType = req.app.locals.dbType;
  try {
    const executionId = req.params.executionId;
    //  const  allUsers=await db.collection('settings').findOne({});
    const allUsers = await settingsDataFromDb(dbType, client);
    const jira = allUsers?.jiraConfig.find(obj => obj.jiraToken);

    const xrayPassword = await tools.decryptPassword(jira.jiraToken);
    const response = await urllib.request(
      `${config.XRAY_DOMAIN_API}/rest/api/2/issue/${executionId}`,
      {
        dispatcher: getProxyDispatcher(),
        timeout: [1000000, 1800000],
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + xrayPassword,
        },
        contentType: "json",
      }
    );

    const issueData = JSON.parse(response.data.toString());

    if (issueData && issueData.fields && issueData.fields.issuetype) {
      const issueType = issueData.fields.issuetype.name;
      const isValidTestExecution = issueType === 'Test Execution';

      if (response.status === 200 && isValidTestExecution) {
        return res.status(200).json({ valid: true });
      } else {
        return res.status(200).json({ valid: false });
      }
    } else {
      return res.status(200).json({ valid: false });
    }

  } catch (error) {
    errLogger.error(
      "[%s : %s] Error occured while validate execution id : %s",
      req.params.teamName,
      req.query.username,
      error
    );
    if (error.response && error.response.status === 404) {
      return res.status(200).json({ valid: false });
    } else {
      return res.status(500).json({ error: 'Failed to validate JIRA execution ID' });
    }
  }
};

module.exports.validateEmailId = async (req, res, next) => {
  try {
    const usersData = await exports.ValidateUser(req);
    if (usersData && Object.keys(usersData).length > 0 && !Object.keys(usersData).includes('errorMessages')) {
      let activeUser = usersData.active;
      return res.status(200).json({ validUser: true, jiraReachable: true, activeUser: activeUser });
    } else {
      return res.status(200).json({ validUser: false, jiraReachable: true });
    }
  } catch (error) {
    errLogger.error(
      "[%s : %s] Error occurred while validating email: %s",
      req.params.teamName,
      req.query.username,
      error
    );
    if (error.response && error.response.status === 404) {
      return res.status(200).json({ jiraReachable: false, validUser: false });
    } else {
      return res.status(200).json({ error: "Failed to validate email", jiraReachable: false, validUser: false });
    }
  }
};

module.exports.ValidateUser = async (req) => {

  try {
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    let emailToValidate = req.body.email;
    const allUsers = await settingsDataFromDb(dbType, client);
    const jira = allUsers?.jiraConfig.find((obj) => obj.jiraToken);

    const xrayPassword = await tools.decryptPassword(jira.jiraToken);
    const response = await urllib.request(
      config.XRAY_DOMAIN_API + "/rest/api/2/user?username=" + emailToValidate,
      {
        dispatcher: getProxyDispatcher(),
        timeout: [1000000, 1800000],
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + xrayPassword,
        },
        contentType: "json",
      }
    );
    const usersData = JSON.parse(response.data.toString());
    return usersData;
  } catch (error) {
    errLogger.error(
      "[%s : %s] Error occurred while validating email: %s",
      req.params.teamName,
      req.query.username,
      error
    );
    throw error;
  }
}

/**
 * Update comment for a Jira test run
 * @param {string} testRunId - Test run ID
 * @param {string} comment - Comment to be added
 * @returns {Promise} - Resolves with the updated test run details if successful, rejects with an error if not
 */
module.exports.updateTestRunComment = async (testRunId, comment) => {
  try {
    const auth = "Bearer " + xrayPassword;
    const options = {
      dispatcher: getProxyDispatcher(),
      timeout: [1000000, 1800000],
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      content: JSON.stringify({
        comment: comment,
      }),
    };

    const result = await urllib.request(
      `${config.XRAY_DOMAIN_API}/rest/raven/1.0/api/testrun/${testRunId}/comment`,
      options
    );

    console.log('Test run comment updated:', result.data);
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
* Update Custom Fields for a Jira Test Run
 * @param {string} testRunId - Test run ID
 * @param {string} customFieldName - Custom field Name
 * @param {any} value - Value to update the custom field with
 * @returns {Promise} - Resolves with the updated custom field details if successful, rejects with an error if not
 */
module.exports.updateCustomFields = async (jiraKey, userName, teamName, customFieldName, value) => {
  try {
    const dbType = require("../server").dbType;
    const client = require("../utils/mongodb").client;
    const allUsers = await settingsDataFromDb(dbType, client);
    const jira = allUsers?.jiraConfig.find((obj) => obj.jiraToken);
    const xrayPassword = await tools.decryptPassword(jira.jiraToken);
    const auth = "Bearer " + xrayPassword;
    let customFieldId;
    // Standard JIRA fields that don't need custom field ID lookup
    const standardFields = ["summary", "description"];

    // Fetch custom field ID by name (skip for standard fields)
    if (!standardFields.includes(customFieldName)) {
      customFieldId = await this.getCustomFieldIdByName(customFieldName, auth);
    } else {
      customFieldId = customFieldName;
    }

    // Update the custom field value
    const result = await urllib.request(
      `${config.XRAY_DOMAIN_API}/rest/api/2/issue/${jiraKey}`,
      {
        dispatcher: getProxyDispatcher(),
        timeout: [1000000, 1800000],
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: auth,
        },
        content: JSON.stringify({
          fields: {
            [customFieldId]: value,
          },
        }),
      }
    );

    console.log("Custom field updated:", result.data.toString());
    return result.data.toString() === "" ? "success" : result.data.toString();
  } catch (error) {
    console.error("Error updating custom field:", error);
    errLogger.error(
      "[%s : %s] Error occurred while updating custom field: %s",
      userName,
      teamName,
      error
    );
    throw error;
  }
};

