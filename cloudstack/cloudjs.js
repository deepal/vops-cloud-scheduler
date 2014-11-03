var cloudstack = new (require('./lib/cloudstack'))({
    apiUri: 'http://localhost:8080/client/api?', 
    apiKey: 'yl47bTZM6BxSj80AV9kjPKqccpwe_BhYiHZ1n28rdOe6l3SbjU6A1AWkKAF9rr-G2f4Fw9vP2tTmE4NSqTwshg', 
    apiSecret: 'WoXBbFBiXszG-Fc25hkbj1Rx46CZq3TabrSVKYtsYSKzS3c6NhZPZG-sf_U_RxHlMsFYDjZwhO6JPtEpTvH_AQ' 
});

cloudstack.exec('listVirtualMachines', {}, function(error, result) {
    console.log(result);
});
