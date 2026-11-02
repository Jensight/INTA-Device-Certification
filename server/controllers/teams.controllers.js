let config = require("../config");
const errors = require("../errors");
let logger = require("../utils/logger");
const errLogger = require("../utils/errorLogger");
let setting = require("../controllers/users.controllers");
const { getAllUsersFromDB } = require("../model/userModel");
const { addTeamToDB, updateTeamToDB, deleteTeamFromDB } = require("../model/teamModel");

/*Add a team with all required collections*/
exports.addTeamCollection = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        await addTeamToDB(dbType, client, req.body.name, req.body);
        logger.info(
            "[%s : %s] Team %s has been added successfully",
            req.params.teamName,
            req.query.username,
            req.body.name
        );
        let settings = await getAllUsersFromDB(dbType, client);
        res.status(200).json(settings);
    } catch (e) {
        errLogger.error(
            "[%s : %s] Error occurred while adding Team %s: %s",
            req.params.teamName,
            req.query.username,
            req.body.name,
            e
        );
        res.status(500).send({
            status: false,
            errorCode: errors.ADD_ERROR.code,
            message: errors.ADD_ERROR.message + " in adding team.",
            errorDetail: e.message,
            type: "problems/error",
        });
    }
};

/* Update a team with update to all required collection*/
exports.updateTeam = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        await updateTeamToDB(dbType, client, req.body.newName, req.body.oldName, req.body);
        let settings = await getAllUsersFromDB(dbType, client);
        logger.info(
            "[%s : %s] Team Name updated from %s to %s successfully",
            req.params.teamName,
            req.query.username,
            req.params.oldName,
            req.params.teamName
        );
        res.status(200).json(settings);
    } catch (e) {
        errLogger.error(
            "[%s : %s] Error occurred while updating Team Name from %s to %s: %s",
            req.params.teamName,
            req.query.username,
            req.params.oldName,
            req.params.teamName,
            e
        );
        res.status(500).send({
            status: false,
            errorCode: errors.UPDATE_ERROR.code,
            message: errors.UPDATE_ERROR.message + " in updating team.",
            errorDetail: e.message,
            type: "problems/error",
        });
    }
};

/* Delete a team and its collections*/
exports.deleteTeam = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        const teamName = req.body.name;
        const username = req.query.username;
        const body = req.body;
        const userdata = await setting.getuserdata(req, res);
        await deleteTeamFromDB(dbType, client, teamName, body, username, userdata);
        logger.info(
            "[%s : %s] Team %s has been deleted successfully",
            teamName,
            username,
            teamName
        );
        let allUsers = await getAllUsersFromDB(dbType, client);
        res.send(allUsers);
    } catch (err) {
        errLogger.error(
            "[%s : %s] Error occurred while deleting Team %s: %s",
            req.params.teamName,
            req.query.username,
            req.params.teamName,
            err
        );
        res.status(500).send({
            status: false,
            errorCode: errors.DELETE_ERROR.code,
            message: errors.DELETE_ERROR.message + " in deleting Team.",
            errorDetail: err.message,
            type: "problems/error",
        });
    }
};