/**
 * @swagger
 * /outsideService/getTestCaseDetail/{id}:
 *  get:
 *    summary: Returns a list of dvice.
 *    description: Use to request all dvice list
 *    tags:
 *          - Outside Services
 *    parameters:
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
 *        description: A JSON array of Testcase details From Jira
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
*  /outsideService/createTestCase:
*    post:
*      summary: Add a new Test Cycle.
*      tags:
*          - Outside Services
*      parameters:
*        - in: query
*          name: username
*          schema:
*            type: string
*          required: true
*        - in: body
*          name: Jira
*          description: Add a Test Cycle.
*          schema:
*            type: object
*            required:
*              - summary
*            properties:
*              summary:
*                  type: string
*                  example: Test Execution
*              tests:
*                  type: array
*                  example: ["16965","16966"]
*      responses: 
*        '200':
*          description: Resturns Success Status and test execution Id.
*/