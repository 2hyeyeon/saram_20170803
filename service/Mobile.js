var _ = require("underscore");
var MobileDao = require('../dao/mobileDao.js');

var Mobile = function() {
    function _getMobileVersion(){
        return MobileDao.getVersion();
    }

    function _setMobileVersion(data) {
        return MobileDao.setVersion(data);
    }

    return {
        getMobileVersion: _getMobileVersion,
        setMobileVersion: _setMobileVersion
    };
};

module.exports = new Mobile();