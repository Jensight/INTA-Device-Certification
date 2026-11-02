/**
 * @swagger
 * /api/alldata/{teamName}:
 *  get:
 *    summary: Returns API details and lists.
 *    description: Used to request all dvice list
 *    tags:
 *          - API
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
 *        description: A JSON array of API details and lists
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
*  /api/group/add/{teamName}:
*    post:
*      summary: Add a new API group.
*      tags:
*          - API
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
*          name: API group
*          description: Add a API group.
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
*          description: Resturns API Details list.
*/

/**
 * @swagger
*paths:
*  /api/group/edit/{teamName}:
*    put:
*      summary: Edit a new API group.
*      tags:
*          - API
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
*          name: API group
*          description: Edit a API group.
*          schema:
*            type: object
*            required:
*              - old
*            properties:
*              old:
*                  type: object
*                  example: {"name":"Test Automation","primaryURL":"http://128.0.0.1:5000/","secondaryURL":"http://128.0.0.1:5000","preExecution":[],"postExecution":[],"counter":0,"_id":"61fcb67433e5943870d53c7a","count":0,"target":[]}
*              new:
*                  type: object
*                  example: {"_id":"61fcb67433e5943870d53c7a","name":"Test Automation","primaryURL":"http://128.0.0.1:5000/","secondaryURL":"http://128.0.0.1:5000","preExecution":[],"postExecution":[],"counter":0}
*      responses: 
*        '200':
*          description: Resturns API Details list.
*/

/**
 * @swagger
*paths:
*  /api/group/delete/{teamName}:
*    post:
*      summary: Delete a API group.
*      tags:
*          - API
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
*          name: API group
*          description: Deletes a API group.
*          schema:
*            type: object
*            required:
*              - name
*            properties:
*              name:
*                  type: string
*                  example: Test Automation
*              count:
*                  type: number
*                  example: 0
*              counter:
*                  type: number
*                  example: 0
*              target:
*                  type: array
*                  example: []
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
*              _id:
*                  type: string
*                  example: 61fcb67433e5943870d53c7a
*      responses: 
*        '200':
*          description: Resturns API Details list.
*/

/**
 * @swagger
*paths:
*  /api/add/{teamName}:
*    post:
*      summary: Add a new API.
*      tags:
*          - API
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
*          name: API
*          description: Add a API.
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
*          description: Resturns API Details list.
*/

/**
 * @swagger
*paths:
*  /api/edit/{teamName}:
*    put:
*      summary: Edit a new API.
*      tags:
*          - API
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
*          name: API
*          description: Edit a API.
*          schema:
*            type: object
*            required:
*              - old
*            properties:
*              old:
*                  type: object
*                  example: {"name":"Test Automation","primaryURL":"http://128.0.0.1:5000/","secondaryURL":"http://128.0.0.1:5000","preExecution":[],"postExecution":[],"counter":0,"_id":"61fcb67433e5943870d53c7a","count":0,"target":[]}
*              new:
*                  type: object
*                  example: {"_id":"61fcb67433e5943870d53c7a","name":"Test Automation","primaryURL":"http://128.0.0.1:5000/","secondaryURL":"http://128.0.0.1:5000","preExecution":[],"postExecution":[],"counter":0}
*      responses: 
*        '200':
*          description: Resturns API Details list.
*/

/**
 * @swagger
*paths:
*  /api/delete/{teamName}:
*    post:
*      summary: Delete a API.
*      tags:
*          - API
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
*          name: API
*          description: Deletes a API.
*          schema:
*            type: object
*            required:
*              - name
*            properties:
*              name:
*                  type: string
*                  example: Test Automation
*              count:
*                  type: number
*                  example: 0
*              counter:
*                  type: number
*                  example: 0
*              target:
*                  type: array
*                  example: []
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
*              _id:
*                  type: string
*                  example: 61fcb67433e5943870d53c7a
*      responses: 
*        '200':
*          description: Resturns API Details list.
*/

/**
 * @swagger
*paths:
*  /api/ping-group:
*    post:
*      summary: Checks Status of API group that available or not.
*      tags:
*          - API
*      parameters:
*        - in: query
*          name: username
*          schema:
*            type: string
*          required: true
*        - in: body
*          name: API
*          description: Checks Status of API group that available or not.
*          schema:
*            type: object
*            required:
*              - url
*            properties:
*              url:
*                  type: string
*                  example: http://127.0.0.1:5000/CMTS/
*      responses: 
*        '200':
*          description: Resturns Status of API group.
*/