var crypto = require('crypto');
var assert = require('assert');
var CryptoJS = require('crypto-js');
const secretKeyPass = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';
const algorithm = 'aes-256-ctr';
const secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';
//const iv = crypto.randomBytes(16);
/*Default Response Headers */
module.exports.defaultResponseHeaders = (req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials'
	);
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	next();
};
/*Default Response Headers */
module.exports.createSuccessResponse = (message, data, status) => {
	if (!status) status = 200;
	return {
		timestamp: new Date().getTime(),
		success: true,
		status,
		message,
		data
	};
};
/*Create Error Response */
module.exports.createErrorResponse = (
	message,
	error,
	status
) => {
	if (!status) status = 400;

	return {
		status,
		success: false,
		timestamp: new Date().toISOString(),
		message,
		error
	};
};
/*Not Used */
const createAccessDeniedErrorResponse = status => {
	if (!status) status = 401;
	return createErrorResponse({
		error: 'Access Denied',
		status
	});
};
/*Get Value From String  */
module.exports.getValueFromString = (allArgs, argsSeperator, valueSeparator) => {
	allArgsList = allArgs.split(argsSeperator);
	if (allArgs.length > 0) {
		tempObj = {};
		//allArgsList.forEach(element => {
			for(let i=0; i<allArgsList.length; i++) {
			keyValue = allArgsList[i].split(valueSeparator);
			tempObj[keyValue[0]] = keyValue[1];
		}
		return tempObj;
	} else {
		return null;
	}
};
const iv = crypto.randomBytes(16);
module.exports.encrypt = async (text) => {
	const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
	const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
	return {
		iv: iv.toString('hex'),
		content: encrypted.toString('hex')
	};
};
module.exports.decrypt = async (hash) => {
	const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'));
	const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
	return decrpyted.toString();
};
/*Decrypt Password */
module.exports.decryptPassword = async (hash) => {

    return CryptoJS.AES.decrypt(hash, secretKeyPass.trim()).toString(CryptoJS.enc.Utf8);

};



// module.exports.encrypt = async (text) => {
// 	const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
// 	const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
// 	return {
// 		iv: iv.toString('hex'),
// 		content: encrypted.toString('hex')
// 	};
// }; module.exports.decrypt = async (hash) => {
// 	const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'));
// 	const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
// 	return decrpyted.toString();
// };