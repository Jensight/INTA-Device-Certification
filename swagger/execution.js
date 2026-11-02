/**
 * @swagger
 * /execution/stop/{regressionId}:
 *  delete:
 *    summary: Stops the running Regression.
 *    description: Used to stop the regression
 *    tags:
 *          - Execution
 *    parameters:
 *       - in: path
 *         name: regressionId
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
 *        description: Returns Success response of stopped regression
 *        content:
 *         application/json:
 *          schema:
 *           type: array
 *           items:
 *            type: string
 */