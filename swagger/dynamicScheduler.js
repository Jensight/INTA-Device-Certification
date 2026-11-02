/**
 * @swagger
 * /dynamicScheduler/schedule/:
 *  post:
 *    summary: Create a new Dynamic Schedule
 *    description: Schedules a dynamic regression with static NEs, DUTs, and clients
 *    tags:
 *          - Dynamic Scheduler
 *    parameters:
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              dynamicTestbedProfileId:
 *                type: string
 *              dynamicTestbedProfileName:
 *                type: string
 *              staticNetworkElements:
 *                type: array
 *                items:
 *                  type: object
 *              duts:
 *                type: array
 *                items:
 *                  type: object
 *              clients:
 *                type: array
 *                items:
 *                  type: object
 *              reRunOnFail:
 *                type: boolean
 *              testSuites:
 *                type: array
 *                items:
 *                  type: object
 *              jira:
 *                type: object
 *              dynamicScheduleStartTime:
 *                type: string
 *    responses:
 *      '200':
 *        description: Dynamic Schedule created successfully
 *      '500':
 *        description: Error creating schedule
 */

/**
 * @swagger
 * /dynamicScheduler/all/:
 *  get:
 *    summary: Get all Dynamic Schedules
 *    description: Returns all dynamic schedules for the History tab
 *    tags:
 *          - Dynamic Scheduler
 *    parameters:
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *    responses:
 *      '200':
 *        description: Returns array of dynamic schedules
 *      '500':
 *        description: Error fetching schedules
 */

/**
 * @swagger
 * /dynamicScheduler/{id}:
 *  get:
 *    summary: Get a Dynamic Schedule by ID
 *    description: Returns a single dynamic schedule
 *    tags:
 *          - Dynamic Scheduler
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
 *        description: Returns the dynamic schedule
 *      '404':
 *        description: Schedule not found
 *      '500':
 *        description: Error fetching schedule
 */

/**
 * @swagger
 * /dynamicScheduler/status/{id}:
 *  put:
 *    summary: Update Dynamic Schedule status
 *    description: Updates the status of a dynamic schedule
 *    tags:
 *          - Dynamic Scheduler
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
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              dynamicScheduleStatus:
 *                type: string
 *                enum: [Scheduled, InProgress, Completed, Cancelled]
 *    responses:
 *      '200':
 *        description: Status updated successfully
 *      '400':
 *        description: Invalid status
 *      '500':
 *        description: Error updating status
 */

/**
 * @swagger
 * /dynamicScheduler/cancel/{id}:
 *  delete:
 *    summary: Cancel a Dynamic Schedule
 *    description: Cancels a dynamic schedule by setting status to Cancelled
 *    tags:
 *          - Dynamic Scheduler
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
 *        description: Schedule cancelled successfully
 *      '500':
 *        description: Error cancelling schedule
 */
