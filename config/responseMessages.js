var successMessage = function(code, friendlyMessageString, returnObject){
    return {
        status: 'Success',
        code: code,
        message: friendlyMessageString,
        returnObject: returnObject
    }
}

var errorMessage = function (code, friendlyMessageString, errorObject) {
    return {
        status: 'Success',
        code: code,
        message: friendlyMessageString,
        returnObject: errorObject
    }
}

module.exports = {
    success: successMessage,
    error: errorMessage
};
