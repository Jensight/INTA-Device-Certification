/**
 * @swagger
 * /user/settings:
 *  get:
 *    summary: Returns a list of users and Teams.
 *    description: Use to request all users and teams list
 *    tags:
 *          - Users
 *    responses:
 *      '200':
 *        description: A JSON array of user details and team lists
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
*  /user/add:
*    post:
*      summary: Add a new User.
*      tags:
*          - Users
*      parameters:
*        - in: body
*          name: user
*          description: Add a User.
*          schema:
*            type: object
*            required:
*              - username
*              - email
*              - password
*              - role
*            properties:
*              username:
*                type: string
*                example: ziggouser
*              email:
*                type: string
*                example: ziggouser@vodafoneziggo.com
*              password:
*                type: string
*                example: ziggouser
*              role:
*                type: string
*                example: user
*              teams:
*                  type: array
*                  example: ["Access", "VFZ"]
*      responses: 
*        '200':
*          description: User Added Successully
*/

/**
 * @swagger
*paths:
*  /user/update:
*    put:
*      summary: Update User Details.
*      tags:
*          - Users
*      parameters:
*        - in: body
*          name: user
*          description: Update a User.
*          schema:
*            type: object
*            required:
*              - _id
*              - username
*              - email
*              - password
*              - role
*            properties:
*              username:
*                type: string
*                example: ziggouser
*              email:
*                type: string
*                example: ziggouser@vodafoneziggo.com
*              password:
*                type: string
*                example: ziggouser
*              role:
*                type: string
*                example: user
*              teams:
*                  type: array
*                  example: ["Access", "VFZ"]
*              _id:
*                  type: string
*                  example: 61daf9029266f40fa4ac95af
*      responses: 
*        '200':
*          description: User Details Updated
*/

/**
 * @swagger
*paths:
*  /user/delete:
*    post:
*      summary: Delete a User.
*      tags:
*          - Users
*      parameters:
*        - in: body
*          name: user
*          description: Delete a User.
*          schema:
*            type: object
*            required:
*              - _id
*            properties:
*              username:
*                type: string
*                example: ziggouser
*              email:
*                type: string
*                example: ziggouser@vodafoneziggo.com
*              password:
*                type: string
*                example: ziggouser
*              role:
*                type: string
*                example: user
*              teams:
*                  type: array
*                  example: ["Access", "VFZ"]
*              _id:
*                  type: string
*                  example: 61daf9029266f40fa4ac95af
*      responses: 
*        '200':
*          description: User Removed
*/

/**
 * @swagger
*paths:
*  /user/login:
*    post:
*      summary: Log a entry when a user try to login.
*      tags:
*          - Users
*      parameters:
*        - in: body
*          name: user
*          description: Username needs to log a entry while login.
*          schema:
*            type: object
*            required:
*              - username
*            properties:
*              username:
*                type: string
*      responses: 
*        '200':
*          description: status will return true
*/

/**
 * @swagger
 * /user/stats:
 *  get:
 *    summary: Returns Stats.
 *    description: Use to request Stats all users and teams list
 *    tags:
 *          - Users
 *    responses:
 *      '200':
 *        description: A JSON array of user details and team lists
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
*  /user/ssoLogin:
*    post:
*      summary: Login Using Inhome Jira SSO
*      tags:
*          - Users
*      parameters:
*        - in: body
*          name: user
*          description: Username needs to log a entry while login.
*          schema:
*            type: object
*            required:
*              - XRAY_USERNAME
*            properties:
*              XRAY_USERNAME:
*                type: string
*                example: user@vodafoneziggo.com
*              XRAY_PASSWORD:
*                type: string
*                example: password
*      responses: 
*        '200':
*          description: status will return error as 0
*/