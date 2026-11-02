const errLogger = require('./errorLogger');

const timeoutCodes = new Set(['ETIMEDOUT', 'ESOCKETTIMEDOUT', 'ECONNABORTED', 'REQUEST_TIMEOUT']);
const dnsCodes = new Set(['ENOTFOUND', 'EAI_AGAIN']);
const networkCodes = new Set([
    'ECONNRESET',
    'ECONNREFUSED',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'EPIPE',
    'ECONNABORTED',
    ...timeoutCodes,
    ...dnsCodes
]);

function patchExpressAsyncErrors() {
    const Layer = require('express/lib/router/layer');

    if (Layer.prototype.__centralAsyncErrorPatchApplied) {
        return;
    }

    Object.defineProperty(Layer.prototype, '__centralAsyncErrorPatchApplied', {
        value: true
    });

    Object.defineProperty(Layer.prototype, 'handle', {
        configurable: true,
        enumerable: true,
        get() {
            return this.__centralErrorHandlerFn;
        },
        set(fn) {
            if (typeof fn !== 'function' || fn.length === 4) {
                this.__centralErrorHandlerFn = fn;
                return;
            }

            this.__centralErrorHandlerFn = function wrappedExpressHandler(req, res, next) {
                try {
                    const result = fn.apply(this, arguments);
                    if (result && typeof result.catch === 'function') {
                        result.catch(next);
                    }
                    return result;
                } catch (error) {
                    return next(error);
                }
            };
        }
    });
}

function requestTimeoutHandler(timeoutMs) {
    return function requestTimeout(req, res, next) {
        req.setTimeout(timeoutMs, () => {
            const error = new Error('Request timed out before the server could finish processing it');
            error.code = 'REQUEST_TIMEOUT';
            error.status = 408;
            next(error);
        });

        next();
    };
}

function classifyError(error) {
    const code = error && (error.code || error.errno);
    const name = error && error.name;
    const message = error && error.message ? error.message : 'Unexpected server error';

    if (dnsCodes.has(code)) {
        return { statusCode: 503, errorType: 'DNS_ERROR', message: 'DNS lookup failed while contacting an external service' };
    }

    if (timeoutCodes.has(code) || /timeout/i.test(message)) {
        return { statusCode: 504, errorType: 'NETWORK_TIMEOUT', message: 'Network timeout while contacting an external service' };
    }

    if (networkCodes.has(code) || name === 'MongoNetworkError' || name === 'MongoTimeoutError') {
        return { statusCode: 503, errorType: 'NETWORK_ERROR', message: 'Network error while contacting an MongoDB service' };
    }

    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return { statusCode: 400, errorType: 'INVALID_JSON', message: 'Invalid JSON request body' };
    }

    if (error && error.statusCode >= 400 && error.statusCode < 600) {
        return { statusCode: error.statusCode, errorType: 'REQUEST_ERROR', message };
    }

    if (error && error.status >= 400 && error.status < 600) {
        return { statusCode: error.status, errorType: 'REQUEST_ERROR', message };
    }

    return { statusCode: 500, errorType: 'INTERNAL_SERVER_ERROR', message: 'Unexpected server error' };
}

function centralErrorHandler(error, req, res, next) {
    const classifiedError = classifyError(error || {});
    const logPayload = {
        statusCode: classifiedError.statusCode,
        errorType: classifiedError.errorType,
        method: req.method,
        url: req.originalUrl,
        username: req.query && req.query.username,
        ip: req.ip,
        code: error && error.code,
        name: error && error.name,
        message: error && error.message,
        stack: error && error.stack
    };

    errLogger.error(`[CENTRAL_ERROR] ${JSON.stringify(logPayload)}`);

    if (res.headersSent) {
        return next(error);
    }

    return res.status(classifiedError.statusCode).send({
        status: false,
        errorType: classifiedError.errorType,
        code: error && error.code,
        message: classifiedError.message,
        errorDetail: error && error.message,
        type: 'problems/error'
    });
}

function notFoundHandler(req, res, next) {
    if (res.headersSent) {
        return next();
    }

    return res.status(404).send({
        status: false,
        errorType: 'NOT_FOUND',
        message: 'Requested API route was not found',
        type: 'problems/error'
    });
}

module.exports = {
    patchExpressAsyncErrors,
    requestTimeoutHandler,
    centralErrorHandler,
    notFoundHandler
};