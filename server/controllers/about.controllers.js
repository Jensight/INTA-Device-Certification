const formidable = require('formidable');
const path = require("path");
const _ = require("lodash");
const fs = require("fs");
const config = require("../config");
const errors = require('../errors');
const logger = require('../utils/logger');
const errLogger = require('../utils/errorLogger');

/*Used to get Build version*/
module.exports.getVersion = async (req, res, next) => {
    var processPath = process.cwd();
    var filePath = processPath+"/version.txt";

    try {  
        var data = fs.readFileSync(filePath, 'utf8');
        let jsonString = {
            "version" : data
        }
        logger.info('[%s : %s] get version succesfully',
        req.params.teamName,req.query.username);
        return res.status(200).json(jsonString);
        
    } catch(e) {
        errLogger.error('[%s : %s] Error occurred while getting version: %s',
        req.params.teamName,req.query.username,e)
        res.status(500).send({status: false, errorCode:errors.FETCH_ERROR.code, message:errors.FETCH_ERROR.message + " in get version.", 
            errorDetail: e.message, type: "problems/error"});
        
    }
};
/*Used to get About content*/
module.exports.getAboutContent = async (req, res, next) => {
    var processPath = process.cwd();
    var filePath = processPath + '/about.json';
    try{
        let rawdata = fs.readFileSync(filePath, 'utf-8');
        logger.info('[%s : %s] get about content succesfully',
        req.params.teamName,req.query.username);
        return res.status(200).json({content: rawdata}); 
    } catch(e) {
        errLogger.error('[%s : %s] Error occurred while getting about content: %s',
        req.params.teamName,req.query.username,e)
        res.status(500).send({status: false, errorCode:errors.FETCH_ERROR.code, message:errors.FETCH_ERROR.message + " in get about content.", 
            errorDetail: e.message, type: "problems/error"});
    }
    
};
/*Used to Upload About Images*/
module.exports.uploadAboutImages = async (req, res, next) => {

    const form = new formidable.IncomingForm();
    try{
    form.parse(req, async function (err, fields, files) {

        if (!files)
            return res.status(400).json({
                "STATUS": "1",
                "RESULT": "File Parameter is Missing"
            });

        if (!files.hasOwnProperty('attachments'))
            return res.status(400).json({
                "STATUS": "1",
                "RESULT": "attachments Parameter is Missing"
            });

        if (!fields)
            return res.status(400).json({
                "STATUS": "1",
                "RESULT": "All Parameter is Missing"
            });

        var oldPath = files.attachments.path;
        var ext = files.attachments.name;
        var ext = ext.split('.');
        ext = ext[ext.length - 1];
        var processPath = process.cwd();

        var dir = processPath + config.FILE_PATH;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        var formateedFilename = files.attachments.name + "." + ext;
        var newPath = dir + formateedFilename;
        var uploadBasePath = config.FILE_PATH + formateedFilename;
        var rawData = fs.readFileSync(oldPath);
        fs.writeFile(newPath, rawData, function (err) {
            if (err) res.json({
                "STATUS": "1",
                "RESULT": err
            })
            var hostname_port = "http://" + config.LocalhostPath + ":" + config.serverport;
            logger.info('[%s : %s] upload about images succesfully',req.params.teamName,req.query.username);
            return res.json({
                "url": hostname_port + uploadBasePath
            });
        });

    });
    }
    catch(e){
        errLogger.error('[%s : %s] Error occurred while getting version: %s',
        req.params.teamName,req.query.username,e)
        res.status(500).send({status: false, errorCode:errors.UPLOAD_ERROR.code, message:errors.UPLOAD_ERROR.message + " in upload about images.", 
        errorDetail: e.message, type: "problems/error"});
    }
};
