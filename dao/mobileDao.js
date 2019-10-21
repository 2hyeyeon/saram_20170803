// Author: Gihwan Lee
// Create Date: 2019.10.21
// Set Mobile Application Version.
var db = require('../lib/dbmanager.js');
var group = "mobile";

var MobileDao = function () {
};
MobileDao.prototype.getVersion =  function () {
    return db.query(group, "getVersion");
};
MobileDao.prototype.setVersion =  function (data) {
    return db.query(group, "setVersion", [data.version]);
};

module.exports = new MobileDao();