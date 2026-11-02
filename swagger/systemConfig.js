/**
 * @swagger
*paths:
*  /sysConfiguration/add:
*    post:
*      summary: Add System Configuration Details.
*      tags:
*          - System Configuration
*      parameters:
*        - in: body
*          name: user
*          description: Add System Configuration.
*          schema:
*            type: object
*            required: true
*            properties:
*              JIRAIP:
*                  type: string
*                  example: 10.1.1.1
*              JIRAPort:
*                  type: string
*                  example: 1000
*              XrayUrl:
*                  type: string
*                  example: https://xrayurl
*              xrayPort:
*                  type: string
*                  example: 2000
*              fromemailID:
*                  type: string
*                  example: Suganya_Vijayaramu@infosys.com
*              emailserverIP:
*                  type: string
*                  example: 10.1.1.1
*              emailserverPort:
*                  type: string
*                  example: 9000
*              kibanaserverIP:
*                   type: string
*                   example: 10.1.1.1
*              kibanaserverPort:
*                   type: string
*                   example: 5601
*              language:
*                   type: string
*                   example: English
*      responses: 
*        '200':
*          description: System Configuration Added Successully
*/

/**
 * @swagger
*paths:
*  /sysConfiguration/update:
*    put:
*      summary: Update System Configuration Details.
*      tags:
*          - System Configuration
*      parameters:
*        - in: body
*          name: user
*          description: Update System Configuration.
*          schema:
*            type: object
*            required:
*              - _id
*              - JIRAIP
*              - JIRAPort
*              - XrayUrl
*              - xrayPort
*            properties:
*              _id:
*                  type: string
*                  example: 61daf9029266f40fa4ac95af
*              JIRAIP:
*                  type: string
*                  example: 10.1.1.1
*              JIRAPort:
*                  type: string
*                  example: 1000
*              XrayUrl:
*                  type: string
*                  example: https://xrayurl
*              xrayPort:
*                  type: string
*                  example: 2000
*              fromemailID:
*                  type: string
*                  example: Suganya_Vijayaramu@infosys.com
*              emailserverIP:
*                  type: string
*                  example: 10.1.1.1
*              emailserverPort:
*                  type: string
*                  example: 9000
*              kibanaserverIP:
*                   type: string
*                   example: 10.1.1.1
*              kibanaserverPort:
*                   type: string
*                   example: 5601
*              language:
*                   type: string
*                   example: English
*      responses: 
*        '200':
*          description: System Configuration Details Updated
*/


/**
 * @swagger
*paths:
*  /sysConfiguration/copyColletion:
*    put:
*      summary: Copy collections from one team to another team.
*      tags:
*          - System Configuration
*      parameters:
*        - in: body
*          name: user
*          description: Update System Configuration.
*          schema:
*            type: object
*            required:
*              - _id
*              - JIRAIP
*              - JIRAPort
*              - XrayUrl
*              - xrayPort
*            properties:
*              sourceTeam:
*                  type: ObjectId
*                  example: Brampton
*              targetTeam:
*                  type: ObjectId
*                  example: Calgary
*              collectionsToCopy:
*                  type: string
*                  example: 1000
*              XrayUrl:
*                  type: string
*                  example: https://xrayurl
*              xrayPort:
*                  type: string
*                  example: 2000
*              fromemailID:
*                  type: string
*                  example: Suganya_Vijayaramu@infosys.com
*              emailserverIP:
*                  type: string
*                  example: 10.1.1.1
*              emailserverPort:
*                  type: string
*                  example: 9000
*              kibanaserverIP:
*                   type: string
*                   example: 10.1.1.1
*              kibanaserverPort:
*                   type: string
*                   example: 5601
*              language:
*                   type: string
*                   example: English
*      responses: 
*        '200':
*          description: System Configuration Details Updated
*/

