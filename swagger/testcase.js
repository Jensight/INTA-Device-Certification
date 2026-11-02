/**
 * @swagger
 * /tc/alldata/{teamName}:
 *  get:
 *    summary: Returns a list of testcase.
 *    description: Use to request all Testcase list
 *    tags:
 *          - Testcase
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
 *        description: A JSON array of Tescase details and lists
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
*  /tc/add/{teamName}:
*    post:
*      summary: Add a new Testset.
*      tags:
*          - Testcase
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
*          name: Testset
*          description: Add a Testset.
*          schema:
*            type: object
*            required:
*              - moduleName
*            properties:
*              moduleName:
*                  type: string
*                  example: Example
*      responses: 
*        '200':
*          description: Resturns Testcase Details list.
*/

/**
 * @swagger
*paths:
*  /tc/edit/{teamName}:
*    put:
*      summary: Edit a new Testset.
*      tags:
*          - Testcase
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
*          name: Testset
*          description: Edit a Testset.
*          schema:
*            type: object
*            required:
*              - moduleName
*            properties:
*              moduleName:
*                  type: string
*                  example: Example
*              _id:
*                  type: string
*                  example: 61f25a82da113924f83d5e2d
*      responses: 
*        '200':
*          description: Resturns Testcase Details list.
*/

/**
 * @swagger
*paths:
*  /tc/delete/{teamName}:
*    post:
*      summary: Delete a Testset.
*      tags:
*          - Testcase
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
*          name: Testset
*          description: Deletes a Testset.
*          schema:
*            type: object
*            required:
*              - moduleName
*            properties:
*              moduleName:
*                  type: string
*                  example: Example
*              _id:
*                  type: string
*                  example: 61f25a82da113924f83d5e2d
*      responses: 
*        '200':
*          description: Resturns Testcase Details list.
*/

/**
 * @swagger
*paths:
*  /tc/testgroup/delete/{teamName}:
*    post:
*      summary: Delete a Test Group.
*      tags:
*          - Testcase
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
*          name: Test Group
*          description: Deletes a Test Group.
*          schema:
*            type: object
*            required:
*              - _id
*            properties:
*              _id:
*                  type: string
*                  example: 61f25a82da113924f83d5e2d
*      responses: 
*        '200':
*          description: Resturns Testcase Details list.
*/

/**
 * @swagger
*paths:
*  /tc/testcase/delete/{teamName}:
*    post:
*      summary: Delete a testcase.
*      tags:
*          - Testcase
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
*          name: testcase
*          description: Deletes a testcase.
*          schema:
*            type: object
*            required:
*              - _id
*            properties:
*              _id:
*                  type: string
*                  example: 61f25a82da113924f83d5e2d
*      responses: 
*        '200':
*          description: Resturns Testcase Details list.
*/