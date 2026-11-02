/** 
* @swagger
* /dashboard/cpe-card-status/{teamName}:
*  get:
*    summary: Returns Dashboard details and lists.
*    description: Used to request all ReservationStatusdata
*    tags:
*          - Dashboard
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
*      '304':
*        description: A JSON array of Reserved DEvice Status
*        content:
*         application/json:
*          schema:
*           type: array
*           items:
*            type: string
*/


/** 
* @swagger
* /dashboard/tc-analysis-card/{teamName}:
*  get:
*    summary: Returns A JSON array of TC Analysis
*    description: Used to request TC Analysis
*    tags:
*          - Dashboard
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
*      '304':
*        description: A JSON array of TC Analysis
*        content:
*         application/json:
*          schema:
*           type: array
*           items:
*            type: string
*/

/**
* @swagger
*  /dashboard/reg-card-status/{teamName}:
*    post:
*      summary: ADD new regression and show total regression analysis
*      tags:
*          - Dashboard
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
*          name: Dashboard group
*          description: Add a regression and give total regression analysis.
*          schema:
*            type: object
*            required:
*              - name
*            properties:
*              name:
*                  type: string
*                  example: Test Automation
*              counter:
*                  type: number
*                  example: 0
*              postExecution:
*                  type: array
*                  example: []
*              preExecution:
*                  type: array
*                  example: []
*              primaryURL:
*                  type: string
*                  example: http://128.0.0.1:5000
*              secondaryURL:
*                  type: string
*                  example: http://128.0.0.1:5000
*      responses: 
*        '200':
*          description: Returns Total Regression Details list.
*/


/** 
* @swagger 
* /dashboard/last-five/regression/{teamName}:
*  get:
*    summary: Returns A JSON array of last five regression
*    description: Used to request summary of last five regression
*    tags:
*          - Dashboard
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
*      '304':
*        description: A JSON array of last five regression
*        content:
*         application/json:
*          schema:
*           type: array
*           items:
*            type: string
*/


/** 
*@swagger 
* /dashboard/last-five/regression/{teamName}/{moduleName}:
*  get:
*    summary: Returns A JSON array of last five regression of a particular module
*    description: Used to request summary of  last five regression of a particular module
*    tags:
*          - Dashboard
*    parameters:
*       - in: path
*         name: teamName
*         schema:
*           type: string
*         required: true
*       - in: path
*         name: moduleName
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
*        description: A JSON array of last five regression of a particular module.
*        content:
*         application/json:
*          schema:
*           type: array
*           items:
*            type: string
*/


/** 
* @swagger 
* /dashboard/reservation-analysis/{teamName}:
*  get:
*    summary: Returns A JSON array of reservation analysis
*    description: Used to request details of reservation analysis
*    tags:
*          - Dashboard
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
*      '304':
*        description: A JSON array of reservation analysis.
*        content:
*         application/json:
*          schema:
*           type: array
*           items:
*            type: string
*/

/** 
* @swagger 
* /dashboard/detail-execution-analysis/{teamName}:
*  get:
*    summary: Returns A JSON array of detailed report of execution analysis
*    description: Used to request detailed report of execution analysis
*    tags:
*          - Dashboard
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
*        description: A JSON array of detailed report of execution analysis.
*        content:
*         application/json:
*          schema:
*           type: array
*           items:
*            type: string
*/

/** 
* @swagger 
* /dashboard/cpe-analysis/{teamName}:
*  get:
*    summary: Returns A JSON array of CPE analysis
*    description: Used to request report of CPE analysis
*    tags:
*          - Dashboard
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
*        description: A JSON array of report of CPE analysis.
*        content:
*         application/json:
*          schema:
*           type: array
*           items:
*            type: string
*/



/** 
* @swagger 
* /dashboard/tc-analysis/{teamName}:
*  get:
*    summary: Returns A JSON array of Tc analysis
*    description: Used to request report of Tc analysis
*    tags:
*          - Dashboard
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
*        description: A JSON array of report of Tc analysis.
*        content:
*         application/json:
*          schema:
*           type: array
*           items:
*            type: string
*/


/** 
* @swagger 
* /dashboard/roi-card-status/{teamName}:
*  get:
*    summary: Returns A JSON array of roi card status 
*    description: Used to request report of roi card status
*    tags:
*          - Dashboard
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
*      '304':
*        description: A JSON array of report of roi card status.
*        content:
*         application/json:
*          schema:
*           type: array
*           items:
*            type: string
*/