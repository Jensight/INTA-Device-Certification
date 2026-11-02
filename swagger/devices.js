/**
 * @swagger
 * /device/alldata/{teamName}:
 *  get:
 *    summary: Returns a list of device.
 *    description: Use to request all device list
 *    tags:
 *          - Device
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
 *        description: A JSON array of device details and lists
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
*  /device/vendor/add/{teamName}:
*    post:
*      summary: Add a new Vendor.
*      tags:
*          - Device
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
*              - name
*            properties:
*              name:
*                  type: string
*                  example: Cisco
*      responses: 
*        '200':
*          description: Resturns device Details list.
*/

/**
 * @swagger
*paths:
*  /device/vendor/edit/{teamName}:
*    put:
*      summary: Edit a new Vendor.
*      tags:
*          - Device
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
*          description: Edit a Vendor.
*          schema:
*            type: object
*            required:
*              - newName
*            properties:
*              newName:
*                  type: string
*                  example: Cisco
*              oldName:
*                  type: string
*                  example: Cisco
*      responses: 
*        '200':
*          description: Resturns device Details list.
*/

/**
 * @swagger
*paths:
*  /device/vendor/delete/{teamName}:
*    post:
*      summary: Delete a Vendor.
*      tags:
*          - Device
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
*          description: Deletes a Vendor.
*          schema:
*            type: object
*            required:
*              - name
*            properties:
*              name:
*                  type: string
*                  example: Cisco
*      responses: 
*        '200':
*          description: Resturns Device Details list.
*/

/**
 * @swagger
*paths:
*  /device/profile/add/{teamName}:
*    post:
*      summary: Add a new Profile.
*      tags:
*          - Device
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
*          name: Profile
*          description: Add a Profile.
*          schema:
*            type: object
*            required:
*              - profileName
*            properties:
*              profileName:
*                  type: string
*                  example: Cisco
*              labels:
*                  type: array
*                  example: [{"name":"Username","type":"text","textType":"text"},{"name":"Password","type":"text","textType":"text"}]
*              variableGroups:
*                  type: array
*                  example: ["601a568943b3a30f046e9c05"]
*      responses: 
*        '200':
*          description: Resturns device Details list.
*/

/**
 * @swagger
*paths:
*  /device/profile/edit/{teamName}:
*    put:
*      summary: Edit a new Profile.
*      tags:
*          - Device
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
*          name: Profile
*          description: Edit a Profile.
*          schema:
*            type: object
*            required:
*              - deleteObject
*            properties:
*              deleteObject:
*                  type: object
*                  example: {}
*              newFields:
*                  type: object
*                  example: {}
*              profileNameObject:
*                  type: object
*                  example: {}
*              renameObject:
*                  type: object
*                  example: {}
*              toBeDeletedGroup:
*                  type: object
*                  example: {}
*              newProfile:
*                  type: object
*                  example: {"_id":"61f7a6894a26bb9880a707be","profileName":"iPad","variableGroups":["601a568943b3a30f046e9c05"],"labels":[{"name":"Username","type":"text","textType":"text"},{"name":"Password","type":"text","textType":"text"}]}
*              oldProfile:
*                  type: object
*                  example: {"profileName":"iPad","variableGroups":["601a568943b3a30f046e9c05"],"labels":[{"name":"Username","type":"text","textType":"text"},{"name":"Password","type":"text","textType":"text"}],"_id":"61f7a6894a26bb9880a707be"}
*      responses: 
*        '200':
*          description: Resturns device Details list.
*/

/**
 * @swagger
*paths:
*  /device/profile/delete/{teamName}:
*    post:
*      summary: Delete a Profile.
*      tags:
*          - Device
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
*          name: Profile
*          description: Deletes a Profile.
*          schema:
*            type: object
*            required:
*              - name
*            properties:
*              name:
*                  type: string
*                  example: Cisco
*      responses: 
*        '200':
*          description: Resturns Device Details list.
*/

/**
 * @swagger
*paths:
*  /device/model/add/{teamName}:
*    post:
*      summary: Add a new Model.
*      tags:
*          - Device
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
*          name: Model
*          description: Add a Model.
*          schema:
*            type: object
*            required:
*              - deviceVendor
*            properties:
*              deviceVendor:
*                  type: string
*                  example: Cisco
*              modelName:
*                  type: string
*                  example: i7
*              profileName:
*                  type: string
*                  example: iPad
*              variableGroups:
*                  type: array
*                  example: [{"groupId":"601a568943b3a30f046e9c05","variables":[{"variableId":"601a570543b3a30f046e9c08","variableValue":"iOS"},{"variableId":"601a570c43b3a30f046e9c09","variableValue":"XC457"},{"variableId":"601a571343b3a30f046e9c0a","variableValue":"34567DFGH"}]}]
*      responses: 
*        '200':
*          description: Resturns device Details list.
*/

/**
 * @swagger
*paths:
*  /device/model/edit/{teamName}:
*    put:
*      summary: Edit a new Model.
*      tags:
*          - Device
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
*          name: Model
*          description: Edit a Model.
*          schema:
*            type: object
*            required:
*              - oldModel
*            properties:
*              oldModel:
*                  type: object
*                  example: {"_id":"61f7aa1a7499364d48e5f54b","modelName":"i7","profileName":"iPad","deviceVendor":"Cisco","variableGroups":[{"groupId":"601a568943b3a30f046e9c05","variables":[{"variableId":"601a570543b3a30f046e9c08","variableValue":"iOS"},{"variableId":"601a570c43b3a30f046e9c09","variableValue":"XC457"},{"variableId":"601a571343b3a30f046e9c0a","variableValue":"34567DFGH"}]}],"createdAt":"2022-01-31T09:21:30.543Z","count":0,"target":[]}
*              updatedModel:
*                  type: object
*                  example: {"modelName":"i7","profileName":"iPad","deviceVendor":"Cisco","variableGroups":[{"groupId":"601a568943b3a30f046e9c05","variables":[{"variableId":"601a570543b3a30f046e9c08","variableValue":"iOS"},{"variableId":"601a570c43b3a30f046e9c09","variableValue":"XC457"},{"variableId":"601a571343b3a30f046e9c0a","variableValue":"34567DFGH"}]}]}
*      responses: 
*        '200':
*          description: Resturns device Details list.
*/

/**
 * @swagger
*paths:
*  /device/model/delete/{teamName}:
*    post:
*      summary: Delete a Model.
*      tags:
*          - Device
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
*          name: Model
*          description: Deletes a Model.
*          schema:
*            type: object
*            required:
*              - deviceVendor
*            properties:
*              deviceVendor:
*                  type: string
*                  example: Cisco
*              modelName:
*                  type: string
*                  example: i7
*              profileName:
*                  type: string
*                  example: iPad
*              variableGroups:
*                  type: array
*                  example: [{"groupId":"601a568943b3a30f046e9c05","variables":[{"variableId":"601a570543b3a30f046e9c08","variableValue":"iOS"},{"variableId":"601a570c43b3a30f046e9c09","variableValue":"XC457"},{"variableId":"601a571343b3a30f046e9c0a","variableValue":"34567DFGH"}]}]
*              createdAt:
*                  type: string
*                  example: 2022-01-31T09:21:30.543Z
*              _id:
*                  type: string
*                  example: 61f7aa1a7499364d48e5f54b
*      responses: 
*        '200':
*          description: Resturns Device Details list.
*/

/**
 * @swagger
*paths:
*  /device/add/{teamName}:
*    post:
*      summary: Add a new Device.
*      tags:
*          - Device
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
*          name: Device
*          description: Add a Device.
*          schema:
*            type: object
*            required:
*              - IPAddress
*            properties:
*              IPAddress:
*                  type: string
*                  example: 127.0.0.1
*              Password:
*                  type: string
*                  example: 123456
*              available:
*                  type: boolean
*                  example: true
*              deviceName:
*                  type: string
*                  example: Laptop
*              model:
*                  type: string
*                  example: Elitebook 840
*              profileId:
*                  type: string
*                  example: 602f3b57540fd916485d13d8
*              profileName:
*                  type: string
*                  example: Laptop
*              reservedAPI:
*                  type: array
*                  example: []
*              reservedAt:
*                  type: string
*                  example: null
*              reservedBy:
*                  type: string
*                  example: null
*              reservedTill:
*                  type: string
*                  example: null
*              vendor:
*                  type: string
*                  example: HP
*      responses: 
*        '200':
*          description: Resturns device Details list.
*/

/**
 * @swagger
*paths:
*  /device/edit/{teamName}:
*    put:
*      summary: Edit a new Device.
*      tags:
*          - Device
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
*          name: Device
*          description: Edit a Device.
*          schema:
*            type: object
*            required:
*              - IPAddress
*            properties:
*              IPAddress:
*                  type: string
*                  example: 127.0.0.1
*              Password:
*                  type: string
*                  example: 123456
*              available:
*                  type: boolean
*                  example: true
*              deviceName:
*                  type: string
*                  example: Laptop
*              model:
*                  type: string
*                  example: Elitebook 840
*              profileId:
*                  type: string
*                  example: 602f3b57540fd916485d13d8
*              profileName:
*                  type: string
*                  example: Laptop
*              reservedAPI:
*                  type: array
*                  example: []
*              reservedAt:
*                  type: string
*                  example: null
*              reservedBy:
*                  type: string
*                  example: null
*              reservedTill:
*                  type: string
*                  example: null
*              vendor:
*                  type: string
*                  example: HP
*              _id:
*                  type: string
*                  example: 61f7ad2526c26d1574733077
*      responses: 
*        '200':
*          description: Resturns device Details list.
*/

/**
 * @swagger
*paths:
*  /device/delete/{teamName}:
*    post:
*      summary: Delete a Device.
*      tags:
*          - Device
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
*          name: Device
*          description: Deletes a Device.
*          schema:
*            type: object
*            required:
*              - _id
*            properties:
*              _id:
*                  type: string
*                  example: 61f7ad2526c26d1574733077
*      responses: 
*        '200':
*          description: Resturns Device Details list.
*/

/**
 * @swagger
*paths:
*  /device/edit/variable/{teamName}:
*    put:
*      summary: Add a new Variable.
*      tags:
*          - Device
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
*          name: Variable
*          description: Add a Variable / Variable Group.
*          schema:
*            type: object
*            required:
*              - groupName
*            properties:
*              groupName:
*                  type: string
*                  example: Hawlet
*              variables:
*                  type: array
*                  example: {variableName: "H-1"}
*              _id:
*                  type: string
*                  example: 61f7aedad7411b6710d1e6e5
*      responses: 
*        '200':
*          description: Resturns device Details list.
*/

/**
 * @swagger
*paths:
*  /device/delete/group/{teamName}:
*    put:
*      summary: Delete Variable Group.
*      tags:
*          - Device
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
*          name: Device
*          description: Delete Variable Group.
*          schema:
*            type: object
*            required:
*              - groupName
*            properties:
*              groupName:
*                  type: string
*                  example: Hawlet
*              updatedAt:
*                  type: string
*                  example: 2022-01-31T09:42:01.203Z
*              createdAt:
*                  type: string
*                  example: 2022-01-31T09:41:46.004Z
*              _id:
*                  type: string
*                  example: 61f7ad2526c26d1574733077
*              variables:
*                  type: array
*                  example: [{"_id":"61f7aee1d7411b6710d1e6e6","variableName":"H-1"},{"_id":"61f7aee9d7411b6710d1e6e7","variableName":"H-2"}]
*      responses: 
*        '200':
*          description: Resturns device Details list.
*/

/**
 * @swagger
*paths:
*  /device/delete/variable/{teamName}:
*    put:
*      summary: Delete a Variable .
*      tags:
*          - Device
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
*          name: Variable
*          description: Deletes a Variable.
*          schema:
*            type: object
*            required:
*              - _id
*            properties:
*              _id:
*                  type: string
*                  example: 61f7ad2526c26d1574733077
*              variableName:
*                  type: string
*                  example: password
*      responses: 
*        '200':
*          description: Resturns Device Details list.
*/