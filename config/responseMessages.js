var successMessage = function(code, friendlyMessageString, returnObject){
    return {
        status: 'success',
        code: code,
        message: friendlyMessageString,
        returnObject: returnObject
    }
};

var errorMessage = function (code, friendlyMessageString, errorObject) {
    return {
        status: 'error',
        code: code,
        message: friendlyMessageString,
        returnObject: errorObject
    }
};

module.exports = {
    success: successMessage,
    error: errorMessage
};
