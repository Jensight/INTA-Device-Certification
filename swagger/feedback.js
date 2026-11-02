/**
 * @swagger
 * /feedback/allFeedback:
 *  get:
 *    summary: Returns a list of Feedbacks.
 *    description: Use to request all Feedback list
 *    tags:
 *          - Feedback
 *    responses:
 *      '200':
 *        description: A JSON array of Feedback details and lists
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
*  /feedback/add/:
*    post:
*      summary: Add a new Feedback.
*      tags:
*          - Feedback
*      parameters:
*        - in: query
*          name: username
*        - in: body
*          name: Feedback
*          description: Add a Feedback.
*          schema:
*            type: object
*            required:
*              - pageName
*            properties:
*              comments:
*                type: array
*                example: []
*              createdAt:
*                type: string
*                example: 2022-01-24T10:36:09.083Z
*              createdBy:
*                type: string
*                example: 5bf3b850e35b030f90b3d320
*              priority:
*                type: string
*                example: High
*              status:
*                type: string
*                example: Initiated
*              feedbackDescription:
*                type: string
*                example: Important Issue on dashboard
*              userList:
*                  type: array
*                  example: [{email: "pooja.dwivedi@vodafoneziggo.com",password: "pooja",role: "admin",teams: ["Apps", "VFZ"],updatedAt: "2021-10-05T05:10:41.688Z",username: "pooja",_id: "615bde1a59deb140c869c45e"}]
*      responses: 
*        '200':
*          description: Feedback Added Successully
*/

/**
 * @swagger
*paths:
*  /feedback/edit/:
*    put:
*      summary: Update a Feedback.
*      tags:
*          - Feedback
*      parameters:
*        - in: query
*          name: username
*        - in: body
*          name: Feedback
*          description: Update a Feedback.
*          schema:
*            type: object
*            required:
*              - _id
*            properties:
*              comments:
*                type: array
*                example: []
*              createdAt:
*                type: string
*                example: 2022-01-24T10:36:09.083Z
*              createdBy:
*                type: string
*                example: 5bf3b850e35b030f90b3d320
*              priority:
*                type: string
*                example: High
*              status:
*                type: string
*                example: Initiated
*              feedbackDescription:
*                type: string
*                example: Important Issue on dashboard
*              userList:
*                  type: array
*                  example: [{email: "pooja.dwivedi@vodafoneziggo.com",password: "pooja",role: "admin",teams: ["Apps", "VFZ"],updatedAt: "2021-10-05T05:10:41.688Z",username: "pooja",_id: "615bde1a59deb140c869c45e"}]
*              _id:
*                type: string
*                example: 61ee8119353bfe6748a5a29d
*      responses: 
*        '200':
*          description: Feedback Updated Successully
*/

/**
 * @swagger
*paths:
*  /feedback/delete/:
*    post:
*      summary: Delete a Feedback.
*      tags:
*          - Feedback
*      parameters:
*        - in: query
*          name: username
*        - in: body
*          name: Feedback
*          description: Delete a Feedback.
*          schema:
*            type: object
*            required:
*              - _id
*            properties:
*              comments:
*                type: array
*                example: []
*              createdAt:
*                type: string
*                example: 2022-01-24T10:36:09.083Z
*              createdBy:
*                type: string
*                example: 5bf3b850e35b030f90b3d320
*              priority:
*                type: string
*                example: High
*              status:
*                type: string
*                example: Initiated
*              feedbackDescription:
*                type: string
*                example: Important Issue on dashboard
*              userList:
*                  type: array
*                  example: [{email: "pooja.dwivedi@vodafoneziggo.com",password: "pooja",role: "admin",teams: ["Apps", "VFZ"],updatedAt: "2021-10-05T05:10:41.688Z",username: "pooja",_id: "615bde1a59deb140c869c45e"}]
*              _id:
*                type: string
*                example: 61ee8119353bfe6748a5a29d
*      responses: 
*        '200':
*          description: Feedback Deleted Successully
*/