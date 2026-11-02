/**
 * @swagger
*paths:
*  /team/add/{teamName}:
*    post:
*      summary: Add a new Team.
*      tags:
*          - Teams
*      parameters:
*        - in: path
*          name: teamName
*          schema:
*            type: string
*          required: true
*        - in: body
*          name: team
*          description: Add a Team.
*          schema:
*            type: object
*            required:
*              - teams
*            properties:
*              teams:
*                  type: array
*                  example: [{leadMailIds: ["sathyamoorthy.p@infosys.com"], name: "VFZ",portNumber: "587",serverIP: "172.30.180.9",status: "A",_id: "5b684f908cb9721e5466def0"}]
*              users:
*                  type: array
*                  example: [{email: "pooja.dwivedi@vodafoneziggo.com",password: "pooja",role: "admin",teams: ["Apps", "VFZ"],updatedAt: "2021-10-05T05:10:41.688Z",username: "pooja",_id: "615bde1a59deb140c869c45e"}]
*              _id:
*                  type: string
*                  example: 1
*      responses: 
*        '200':
*          description: Team Created Successully
*/

/**
 * @swagger
*paths:
*  /team/delete/{teamName}:
*    post:
*      summary: Delete a Team.
*      tags:
*          - Teams
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
*          name: team
*          description: Delete a Team.
*          schema:
*            type: object
*            required:
*              - teams
*            properties:
*              teams:
*                  type: array
*                  example: [{leadMailIds: ["sathyamoorthy.p@infosys.com"], name: "VFZ",portNumber: "587",serverIP: "172.30.180.9",status: "A",_id: "5b684f908cb9721e5466def0"}]
*              users:
*                  type: array
*                  example: [{email: "pooja.dwivedi@vodafoneziggo.com",password: "pooja",role: "admin",teams: ["Apps", "VFZ"],updatedAt: "2021-10-05T05:10:41.688Z",username: "pooja",_id: "615bde1a59deb140c869c45e"}]
*              _id:
*                  type: string
*                  example: 1
*      responses: 
*        '200':
*          description: Team Deleted Successully
*/

/**
 * @swagger
*paths:
*  /team/update/{teamName}/{oldName}:
*    put:
*      summary: Update Team Details.
*      tags:
*          - Teams
*      parameters:
*        - in: path
*          name: teamName
*          schema:
*            type: string
*          required: true
*        - in: path
*          name: oldName
*          schema:
*            type: string
*          required: true
*        - in: query
*          name: username
*          schema:
*            type: string
*          required: true
*        - in: body
*          name: team
*          description: Update a Team.
*          schema:
*            type: object
*            required:
*              - teams
*            properties:
*              teams:
*                  type: array
*                  example: [{leadMailIds: ["sathyamoorthy.p@infosys.com"], name: "VFZ",portNumber: "587",serverIP: "172.30.180.9",status: "A",_id: "5b684f908cb9721e5466def0"}]
*              users:
*                  type: array
*                  example: [{email: "pooja.dwivedi@vodafoneziggo.com",password: "pooja",role: "admin",teams: ["Apps", "VFZ"],updatedAt: "2021-10-05T05:10:41.688Z",username: "pooja",_id: "615bde1a59deb140c869c45e"}]
*              _id:
*                  type: string
*                  example: 1
*      responses: 
*        '200':
*          description: Team Details Updated Successully
*/