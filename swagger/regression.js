/**
 * @swagger
 * /regression/{teamName}:
 *  get:
 *    summary: Returns a list of All Regression.
 *    description: Use to request all Regression list
 *    tags:
 *          - Regression
 *    parameters:
 *       - in: path
 *         name: teamName
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *    responses:
 *      '200':
 *        description: A JSON array of Regression details and lists
 *        content:
 *         application/json:
 *          schema:
 *           type: array
 *           items:
 *            type: string
 */

/**
 * @swagger
*paths:
*  /regression/start/{teamName}:
*    post:
*      summary: Restart the regression.
*      tags:
*          - Regression
*      parameters:
*        - in: path
*          name: teamName
*          schema:
*            type: string
*          required: true
*        - in: query
*          name: username
*          schema:
*            type: string
*          required: true
*        - in: body
*          name: Vendor
*          description: Add a Vendor.
*          schema:
*            type: object
*            required:
*              - automatedMail
*            properties:
*              automatedMail:
*                  type: string
*                  example: N
*              cpuGraph:
*                  type: string
*                  example: N
*              failTC:
*                  type: number
*                  example: 0
*              jira:
*                  type: object
*                  example: {update: false, type: "update", ueId: ""}
*              job:
*                  type: array
*                  example: [{"testbedData": {"testBedName":"SNMP_Selenium_Exec","variables":[{"variableValue":"Chrome","variableName":"Browser"},{"variableValue":"public","variableName":"Community String"}],"devices":[{"deviceName":"TCH_CGM4140COM_01","vendor":"Technicolor","model":"CGM4140COM","profileName":"Cable Modem","reservedAPI":[],"IP":"192.168.1.1"},{"deviceName":"HP Offshore 101","vendor":"HP","model":"Elitebook 840","profileName":"LAPTOP","reservedAPI":[],"IPAddress":"127.0.0.1","Password":"Sathya"}]},"timeRequired": 9,"job_id": null,"teamName": "VFZ","totalTC": 2,"schedulerType": "SN","passTC": 0,"failTC": 0,"norunTC": 2,"testbed": {  "_id": "601a9b00d98d4c51ec32c6a2",  "testBedName": "SNMP/Selenium_Exec",  "nodes": [    {"nodeId": "601a58a143b3a30f046e9c0c","profileId": "601a56cc43b3a30f046e9c06","deviceId": "601a586543b3a30f046e9c0b"    },    {"nodeId": "602f3c20540fd916485d13db","profileId": "602f3b57540fd916485d13d8","deviceId": "602f3ba9540fd916485d13da"    }  ],  "variables": [    {"variableId": "601a9accd98d4c51ec32c6a1","variableValue": "Chrome"    },    {"variableId": "601a54fb43b3a30f046e9c03","variableValue": "public"    }  ]},"reRunOnFail": "N","numOfIteration": 1,"updateALM": "N","module": "CM_Dev_Test_Local","regressionType": "full","preExecution": [],"postExecution": [],"onExecution": [  {    "_id": "601a9d34d98d4c51ec32c6a8",    "tcGroupId": "601a9c6ad98d4c51ec32c6a7",    "tcId": "CM_03",    "tcName": "[CM_GUI] Verify WAN connection status via Admin GUI",    "tpId": "CM_03",    "autoExectime": null,    "manualExectime": 4,    "tcCreator": "Selva",    "tcEditor": "Gobinath",    "tcPriority": "High",    "testSteps": [{  "apiId": "selenium_1",  "api_id": "601a9b6ad98d4c51ec32c6a3",  "description": null,  "doHttp": {    "method": "POST",    "postBody": {"contentType": "application/json","bodyParameter": [  {    "argumentName": "IP_Address",    "argumentValue": "192.168.1.1"  },  {    "argumentName": "Browser",    "argumentValue": "Chrome"  }]    },    "url": "http://127.0.0.1:5000/selenium/cm_admin_gui_login"  },  "gotoOnFail": 0,  "gotoOnPass": 0,  "returnValue": null,  "step": 1,  "apiName": "cm_admin_gui_login"},{  "apiId": "selenium_2",  "api_id": "601a9bb5d98d4c51ec32c6a4",  "description": null,  "doHttp": {    "method": "POST",    "postBody": {"contentType": "application/json","bodyParameter": [  {    "argumentName": "Navigation Page",    "argumentValue": "Advanced"  }]    },    "url": "http://127.0.0.1:5000/selenium/cm_webpage_navigation"  },  "gotoOnFail": 0,  "gotoOnPass": 0,  "returnValue": null,  "step": 2,  "apiName": "cm_webpage_navigation"},{  "apiId": "selenium_3",  "api_id": "601a9bf9d98d4c51ec32c6a5",  "description": null,  "doHttp": {    "method": "POST",    "postBody": {"contentType": "application/json","bodyParameter": [  {    "argumentName": "Attribute Value",    "argumentValue": "IP Address"  }]    },    "url": "http://127.0.0.1:5000/selenium/cm_accessing_attribute_value"  },  "gotoOnFail": 0,  "gotoOnPass": 0,  "returnValue": null,  "step": 3,  "apiName": "cm_accessing_attribute_value"},{  "apiId": "selenium_4",  "api_id": "601a9c49d98d4c51ec32c6a6",  "description": null,  "doHttp": {    "method": "POST",    "postBody": {"contentType": "application/json","bodyParameter": [  {    "argumentName": "Status",    "argumentValue": "Logout"  }]    },    "url": "http://127.0.0.1:5000/selenium/cm_admin_gui_logout"  },  "gotoOnFail": 0,  "gotoOnPass": 0,  "returnValue": null,  "step": 4,  "apiName": "cm_admin_gui_logout"}    ],    "createdAt": "2021-02-03T12:52:43.509Z",    "updatedAt": "2021-02-03T12:52:43.509Z",    "issueKey": null,    "testSuiteId": "601a592c43b3a30f046e9c0e",    "testSuiteName": "CM TCs",    "tcStatus": "NoExec",    "execStatus": "queued",    "tcStartTime": "null",    "tcStopTime": "null",    "tcExecTime": "null",    "failReason": "null",    "tcGroup": "CM_ADMIN_GUI"  },  {    "_id": "602f3d92540fd916485d13e0",    "tcGroupId": "5b685b1b3b371b02b86743e2",    "tcId": "CM_04",    "tcName": "[CM_SNMP]Check_CPU_Utlization(less than 100)",    "tpId": "CM_04",    "autoExectime": null,    "manualExectime": 5,    "tcCreator": "ICNA_User",    "tcEditor": "vAUTO_User",    "tcPriority": "High",    "testSteps": [{  "apiId": "snmp_37",  "api_id": "602f3c7c540fd916485d13dc",  "description": null,  "doHttp": {    "method": "POST",    "postBody": {"contentType": "application/json","bodyParameter": [  {    "argumentName": "oid",    "argumentValue": ".1.3.6.1.2.1.25.3.3.1.2.4"  },  {    "argumentName": "IPAddress",    "argumentValue": "127.0.0.1"  },  {    "argumentName": "communityString",    "argumentValue": "public"  }]    },    "url": "http://127.0.0.1:5000/snmp/snmp_get"  },  "gotoOnFail": 0,  "gotoOnPass": 0,  "returnValue": null,  "step": 1,  "apiName": "snmp_get"},{  "apiId": "validate_1",  "api_id": "602f3d18540fd916485d13de",  "description": null,  "doHttp": {    "method": "POST",    "postBody": {"contentType": "application/json","bodyParameter": [  {    "argumentName": "firstValue",    "argumentValue": "RETURN_VAL:1"  },  {    "argumentName": "secondValue",    "argumentValue": "100"  },  {    "argumentName": "equalCheck",    "argumentValue": "true"  }]    },    "url": "http://127.0.0.1:4000/test-case/validate/isLesser"  },  "gotoOnFail": 0,  "gotoOnPass": 0,  "returnValue": null,  "step": 2,  "apiName": "isLesser"}    ],    "createdAt": "2021-02-19T04:24:00.927Z",    "updatedAt": "2021-02-19T04:24:00.927Z",    "testSuiteId": "601a592c43b3a30f046e9c0e",    "testSuiteName": "CM TCs",    "tcStatus": "NoExec",    "execStatus": "queued",    "tcStartTime": "null",    "tcStopTime": "null",    "tcExecTime": "null",    "failReason": "null",    "tcGroup": "SNMP"  }]}]
*              kibanaURL:
*                  type: string
*                  example: NA
*              norunTC:
*                  type: number
*                  example: 2
*              parentReg:
*                  type: string
*                  example: ARRIS_CM_TCs_partial_Gobinath_SL_2022-02-28_075748534
*              passTC:
*                  type: number
*                  example: 0
*              regStatus:
*                  type: string
*                  example: in progress
*              run_id:
*                  type: string
*                  example: null
*              startTime:
*                  type: string
*                  example: 2022-02-28T08:01:05.328Z
*              team:
*                  type: string
*                  example: VFZ
*              teamName:
*                  type: string
*                  example: VFZ
*              totalTC:
*                  type: number
*                  example: 2
*              user:
*                  type: string
*                  example: Gobinath
*      responses: 
*        '200':
*          description: Resturns device Details list.
*/

/**
 * @swagger
 * /regression/{teamName}/{regId}:
 *  delete:
 *    summary: Remove a Regression From list.  
 *    description: Use to delete Regression from list
 *    tags:
 *          - Regression
 *    parameters:
 *       - in: path
 *         name: teamName
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: regId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *    responses:
 *      '200':
 *        description: A JSON array of Regression details and lists
 *        content:
 *         application/json:
 *          schema:
 *           type: array
 *           items:
 *            type: string
 */

/**
 * @swagger
*paths:
*  /regression/download:
*    post:
*      summary: Download Regression logs.
*      tags:
*          - Regression
*      parameters:
*        - in: query
*          name: username
*          schema:
*            type: string
*          required: true
*        - in: body
*          name: Vendor
*          description: Add a Vendor.
*          schema:
*            type: object
*            required:
*              - regressionId
*            properties:
*              regressionId:
*                  type: string
*                  example: ARRIS_CM_TCs_partial_Gobinath_SL_2022-02-28_081136090
*      responses: 
*        '200':
*          description: download log file from server.
*/

/**
 * @swagger
*paths:
*  /regression/download/job:
*    post:
*      summary: Download Regression logs For a Job.
*      tags:
*          - Regression
*      parameters:
*        - in: query
*          name: username
*          schema:
*            type: string
*          required: true
*        - in: body
*          name: Vendor
*          description: Add a Vendor.
*          schema:
*            type: object
*            required:
*              - jobId
*            properties:
*              jobId:
*                  type: string
*                  example: ARRIS_CM_TCs_partial_Gobinath_SL_2022-02-28_081136090_1
*      responses: 
*        '200':
*          description: download log file from server.
*/

/**
 * @swagger
*paths:
*  /regression/download/job/excel:
*    post:
*      summary: Download Regression Excel logs For a Job.
*      tags:
*          - Regression
*      parameters:
*        - in: query
*          name: username
*          schema:
*            type: string
*          required: true
*        - in: body
*          name: Vendor
*          description: Add a Vendor.
*          schema:
*            type: object
*            required:
*              - jobId
*            properties:
*              jobId:
*                  type: string
*                  example: ARRIS_CM_TCs_partial_Gobinath_SL_2022-02-28_081136090_1
*      responses: 
*        '200':
*          description: download Excel log file from server.
*/

/**
 * @swagger
*paths:
*  /regression/download/job/html:
*    post:
*      summary: Download Regression Html logs For a Job.
*      tags:
*          - Regression
*      parameters:
*        - in: query
*          name: username
*          schema:
*            type: string
*          required: true
*        - in: body
*          name: Vendor
*          description: Add a Vendor.
*          schema:
*            type: object
*            required:
*              - jobId
*            properties:
*              jobId:
*                  type: string
*                  example: ARRIS_CM_TCs_partial_Gobinath_SL_2022-02-28_081136090_1
*      responses: 
*        '200':
*          description: download Html log file from server.
*/

/**
 * @swagger
*paths:
*  /regression/download/tc/html:
*    post:
*      summary: View Regression Html logs For a Testcase.
*      tags:
*          - Regression
*      parameters:
*        - in: query
*          name: username
*          schema:
*            type: string
*          required: true
*        - in: body
*          name: Vendor
*          description: Add a Vendor.
*          schema:
*            type: object
*            required:
*              - jobId
*            properties:
*              jobId:
*                  type: string
*                  example: ARRIS_CM_TCs_partial_Gobinath_SL_2022-02-28_081136090_1
*              testcase:
*                  type: string
*                  example: HTTP firmware upgrade via bootfile
*              testsuite:
*                  type: string
*                  example: Demo Suite
*      responses: 
*        '200':
*          description: View Html log file from server.
*/

/**
 * @swagger
 * /regression/{teamName}/{id}:
 *  get:
 *    summary: Returns a Regression details.
 *    description: Use to Return a Regression details
 *    tags:
 *          - Regression
 *    parameters:
 *       - in: path
 *         name: teamName
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *    responses:
 *      '200':
 *        description: A JSON array of Regression details
 *        content:
 *         application/json:
 *          schema:
 *           type: array
 *           items:
 *            type: string
 */

/**
 * @swagger
 * /regression/{teamName}/{id}/full:
 *  get:
 *    summary: Returns a Regression details.
 *    description: Use to Return a Regression details
 *    tags:
 *          - Regression
 *    parameters:
 *       - in: path
 *         name: teamName
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *    responses:
 *      '200':
 *        description: A JSON array of Regression details
 *        content:
 *         application/json:
 *          schema:
 *           type: array
 *           items:
 *            type: string
 */