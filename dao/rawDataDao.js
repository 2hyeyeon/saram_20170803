var db = require('../lib/dbmanager.js');
var _ = require('underscore');
var debug = require('debug');
var group = "rawData";

var RawDataDao = function () {
};

RawDataDao.prototype.insertRawData =  function (data) {
    return {
        group : group,
        item : "insertRawData",
        data : [
                data.id, data.name, data.department, data.char_date, data.year, data.type, data.char_date, data.type
        ]
    };
};

// 툴퇴근 정보 등록 
RawDataDao.prototype.insertRawDataCompanyAccess =  function (data) {
    debug(data)
    data.platform_type = 'parsing fail'
    try {
        var p1 = data.param.split(',')[0]
        switch (p1) {
            case '121': data.platform_type = 'Windows 7'; break;
            case '132': data.platform_type = 'Windows 10'; break;
            case '143': data.platform_type = 'Windows Vista/Server 2008'; break;
            case '152': data.platform_type = 'Windows Server 2003'; break;
            case '315': data.platform_type = 'Windows XP'; break;
            case '502': data.platform_type = 'Windows 2000'; break;
            case '508': data.platform_type = 'Windows'; break;
            case '503': data.platform_type = 'Mac'; break;
            case '120': data.platform_type = 'iPhone'; break;
            case '192': data.platform_type = 'iPad'; break;
            case '202': data.platform_type = 'Android'; break;
            case '203': data.platform_type = 'Unknown device'; break;
            default: data.platform_type = 'Degenerate'
        }
        var p2 = data.param.split(',')[1]
        switch (p2) {
            case '902': data.platform_type = data.platform_type.concat(', ', 'IE'); break;
            case '111': data.platform_type = data.platform_type.concat(', ', 'Chrome'); break;
            case '163': data.platform_type = data.platform_type.concat(', ', 'Opera'); break;
            case '174': data.platform_type = data.platform_type.concat(', ', 'Firefox'); break;
            case '190': data.platform_type = data.platform_type.concat(', ', 'Safari'); break;
            case '199': data.platform_type = data.platform_type.concat(', ', 'Samsung'); break;
            case '203': data.platform_type = data.platform_type.concat(', ', 'APP'); break;
            case '200': data.platform_type = data.platform_type.concat(', ', 'Unknown browser'); break;
            default: data.platform_type = data.platform_type.concat(', ', 'Degenerate')
        }
    }catch(e) {
        debug(e)
    }

    return db.query(group, "insertRawDataCompanyAccess", 
        [data.char_date, data.id, data.name, data.department, data.char_date, data.type, data.ip_pc, data.ip_office, data.need_confirm, data.mac, data.id, data.id, data.platform_type]
    );
};

RawDataDao.prototype.selectRawDataList =  function (data, id) {
    if((_.isUndefined(data.dept) || data.dept == "전체") && id === '%') {
        return db.query(group, 'selectRawDataListAll', [data.start, data.end]);
    } else {
        if (id === '%') { // Manager
            return db.query(group, 'selectRawDataList', [data.start, data.end, data.dept, id]);
        } else { // User
            return db.query(group, 'selectRawDataListUser', [data.start, data.end, id]);
        }
    }
};

RawDataDao.prototype.selectRawDataListV2 =  function (data, id) {
    return db.query(group, "selectRawDataListV2", [data.start, id]);
};

module.exports = new RawDataDao();