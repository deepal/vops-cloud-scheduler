module.exports = function () {

    var convertMemStorage = function (value, fromUnit, toUnit) {
        var fromUnitVal = 1;
        var toUnitVal = 1;
        switch (fromUnit.toLowerCase()){
            case 'b':
                break;
            case 'kb':
                fromUnitVal = 1024;
                break;
            case 'mb':
                fromUnitVal = 1024 * 1024;
                break;
            case 'gb':
                fromUnitVal = 1024 * 1024 * 1024;
                break;
            case 'tb':
                fromUnitVal = 1024 * 1024 * 1024 * 1024;
                break;
            default :
                return false;
        }

        switch (toUnit.toLowerCase()){
            case 'b':
                break;
            case 'kb':
                toUnitVal = 1024;
                break;
            case 'mb':
                toUnitVal = 1024 * 1024;
                break;
            case 'gb':
                toUnitVal = 1024 * 1024 * 1024;
                break;
            case 'tb':
                toUnitVal = 1024 * 1024 * 1024 * 1024;
                break;
            default :
                return false;
        }

        return value * fromUnitVal/toUnitVal;
    };

    var convertFreq = function (value, fromUnit, toUnit) {
        var fromUnitVal = 1;
        var toUnitVal = 1;
        switch (fromUnit.toLowerCase()){
            case 'hz':
                break;
            case 'khz':
                fromUnitVal = 1000;
                break;
            case 'mhz':
                fromUnitVal = 1000 * 1000;
                break;
            case 'ghz':
                fromUnitVal = 1000 * 1000 * 1000;
                break;
            case 'thz':
                fromUnitVal = 1000 * 1000 * 1000 * 1000;
                break;
            default :
                return false;
        }

        switch (toUnit.toLowerCase()){
            case 'hz':
                break;
            case 'khz':
                toUnitVal = 1000;
                break;
            case 'mhz':
                toUnitVal = 1000 * 1000;
                break;
            case 'ghz':
                toUnitVal = 1000 * 1000 * 1000;
                break;
            case 'thz':
                toUnitVal = 1000 * 1000 * 1000 * 1000;
                break;
            default :
                return false;
        }

        return value * fromUnitVal/toUnitVal;
    };

    return {
        convertMemoryAndStorage : convertMemStorage,
        convertFrequency: convertFreq
    }

};