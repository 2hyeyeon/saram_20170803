var db = require('../lib/dbmanager.js');
var group = "commute";

var CommuteDao = function () {
};

// 근태자료관리 조회 
CommuteDao.prototype.selectCommute =  function (data, id, dept) {
    if(data.dept == "전체" && id === '%'){
        return db.query(group, 'selectCommuteAll', [data.startDate, data.endDate]);    
    }else{
        if (data.dept === undefined || data.dept === null || data.dept === '') {
            data.dept = dept
        }
        if (id === '%') { // Manager
            return db.query(group, 'selectCommute', [data.startDate, data.endDate, data.dept, id]);
        } else { // User
            return db.query(group, 'selectCommuteUser', [data.startDate, data.endDate, id]);
        }
    }
};

CommuteDao.prototype.selectCommuteByID = function(data){
    return db.query(group, "selectCommuteByID", [data.startDate, data.endDate, data.id]);
};

// 툴퇴근 수정 
CommuteDao.prototype.updateCommuteResultInOutTime =  function (data) {
    return db.query(group, "updateCommuteResultInOutTime",
        [data.in_time, data.in_time_change, data.out_time, data.out_time_change, data.normal, data.normal_change, data.id, data.date]
    );
};

CommuteDao.prototype.insertCommute = function(data){
    return {
        group : group,
        item : "insertCommuteResult",
        data : [
                data.date, data.department, data.id, data.in_time, data.late_time, data.name,
                data.out_office_code, data.out_time, data.over_time, data.overtime_code,
                data.vacation_code, data.standard_in_time, data.standard_out_time, data.work_type,
                data.year, data.in_time_type, data.out_time_type, data.out_office_start_time,
                data.out_office_end_time, data.in_time_change, data.out_time_change,
                data.early_time, data.not_pay_over_time, data.normal, data.normal_change, data.except, data.is_suwon ]
    };
};

CommuteDao.prototype.updateCommute_t = function(data){
    return {
        group : group,
        item : "updateCommuteResult",
        data : [
                data.in_time, data.late_time, data.out_office_code, data.out_time, data.over_time, data.
                overtime_code, data.vacation_code, data.standard_in_time, data.standard_out_time, data.
                work_type, data.in_time_type, data.out_time_type, data.out_office_start_time,
                data.out_office_end_time, data.in_time_change, data.out_time_change, data.overtime_code_change,
                data.early_time, data.not_pay_over_time, data.normal, data.normal_change, data.except, data.id, data.date
            ]
    };
};

CommuteDao.prototype.selectCommuteDate = function(date) {
    return db.query(group, "selectCommuteDate", [date]);
};

// comment 갯수 수정 
CommuteDao.prototype.updateCommuteCommentCount =  function (data) {
    return db.query(group, "updateCommuteCommentCount", [data.id, data.year, data.date, data.id, data.year, data.date]);
};

CommuteDao.prototype.getLastiestDate = function(){
    return db.query(group, "getLastiestDate");
};

CommuteDao.prototype.selectCommuteToday = function(date, dept_code) {
    return db.query(group, "selectCommuteToday", [date.startDate,date.startDate,date.startDate,dept_code]);
};

CommuteDao.prototype.getCommuteMailData =  function (data) {
    return db.query(group, "getCommuteMailData", [data.in_time, data.id, data.work_type]);
};

module.exports = new CommuteDao();