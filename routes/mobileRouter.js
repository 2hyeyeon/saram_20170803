var express = require('express');
var debug = require('debug')('mobileRouter');
var _ = require("underscore"); 
var router = express.Router();

var sessionManager = require('../lib/sessionManager');
var Session = require('../service/Session');
var Commute = require('../service/Commute.js');
var Dashboard = require('../service/Dashboard.js');
var moment = require('moment');
var Vacation = require('../service/Vacation.js');
var Statistics = require('../service/StatisticsService.js');
var Message = require('../service/Message.js');
var util = require('../lib/util.js');
var suid =  require('rand-token').suid;
var User = require('../service/User.js');
var Approval = require('../service/Approval.js');
var RawData = require("../service/RawData.js");
var Code = require("../service/Code.js");
var Holiday = require('../service/Holiday.js');
var Mobile = require('../service/Mobile.js');

var sessionResponse=function(req, res, session){
    if (_.isUndefined(session)||_.isNull(session)){
        res.send(new Session({isLogin:false, id:req.session.id}));
    } else {
        res.send(session);
    }
};

router.route('/mobileVersion')
.get(function(req, res){
    Mobile.getMobileVersion().then(function(result){
        res.send(result[0]);
    });
}).post(function(req, res){
    Mobile.setMobileVersion(req.body).then(function(result){
        res.send({result: result, success : true});
    });
});

router.route('/')
.post(function(req, res){//만들기.
    debug("=== Mobile Login ===");
    if (req.cookies.saram) {//cookie가 있을 때.
        if (sessionManager.validationCookie(req.cookies.saram, res)){
            sessionResponse(req, res, sessionManager.get(req.cookies.saram));
        } else {//유효하지 않은 cookie 삭제.
            sessionManager.remove(req.cookies.saram);
            res.clearCookie("saram");
            sessionResponse(req, res);
        }
    } else {// 아예 세션 정보가 없을 때.
        sessionResponse(req, res);
    }
    sessionManager.poolCount(req.session.id);
}).put(function(req, res){//login 부분 
    var user = new User(req.body.user);
    var session;
    var msg;
    
    if (!_.isUndefined(req.body.initPassword) && req.body.initPassword){
        user.initPassword().then(function(){
            msg="SUCCESS_INIT_PASSWORD";
            sessionResponse(req, res, new Session({isLogin:false, id:req.session.id, msg:msg}));
        }).catch(function(e){
            debug("Exception:" + e);
        });
    } else {
        user.getLoginUser().then(function(result){
            if (result.length == 0){
                msg="DO_NOT_FOUND_USER";
                session=new Session({isLogin:false, id:req.session.id,msg:msg});
            } else {
                var resultUser= new User(result[0]);
                if (_.isEmpty(resultUser.get("password"))||_.isNull(resultUser.get("password"))){ //password 초기화 안된경우 
                    msg="INIT_PASSWORD";
                    session=new Session({isLogin:false, id:req.session.id, msg:msg, initPassword:true, user:{id:resultUser.get("id")}});
                } else {
                    if (user.get("password")==resultUser.get("password")){
                        debug("=== Mobile Login Success ===");
                        var hour = 3600000000000;
                        var accessToken = suid(32);
                        
                        var userInfo = resultUser.data;
                        userInfo.password="";
                       
                        session =new Session({isLogin:true, id:req.session.id, user:userInfo, auth:"default", ACCESS_TOKEN:accessToken});
                        
                        res.cookie('saram', session, { maxAge: hour, httpOnly: false });
                        sessionManager.add(session, accessToken);
                        /*
                        * auth 관련 셋팅 로직 구현 필요
                        */
                    } else {
                        debug("=== Mobile Login. Not equal password ===");
                        msg="NOT_EQULES_PASSWORD";
                        session=new Session({isLogin:false, id:req.session.id, msg:msg});
                    }          
                }
            }
            sessionResponse(req, res, session);
        }).catch(function(e) {
            debug("Exception:" + e);
        });
    }
    
}).delete(function(req, res){
    debug("=== Mobile Logout ===");
    sessionManager.remove(req.cookies.saram);
    req.session.destroy(function(){});
    res.clearCookie("saram");
    res.send({});
});

router.route('/holiday')
.get(function(req, res){
    var holiday = new Holiday({year:req.query.year});
    
    holiday.getHolidayList().done(function(result){
        res.send(result);    
    });
    
})

router.route('/commute/today')
.post(function(req, res) {
    var startDate = req.param("startDate");
    Commute.getCommuteToday({startDate : startDate}, 8000).then(function(result) {
        res.send(result);
    })
});

router.route('/dashboard/summary')
.post(function(req, res) {
    var _dashboard= new Dashboard();
    var start = req.param("start");
    var end = req.param("end");
    var year = req.param("year");
    var userId = req.param("id");
    var params = {
        "start" : start,
        "end" : end,
        "year" : year,
        "userId" : userId
    };

    _dashboard.getWorkingSummary(params).then(function(result) {
        //res.send(result);
        var targetYear = moment().format('YYYY');
        var params2 = {year: targetYear, id: userId};
        // 근태 정보가 없는 경우 빈값을 생성해야 함. 사장님 및 임원의 경우 없음.
        if (result.length === 0) {
            result[0] = {};
        }
        Vacation.getVacationById(params2).then(function (vacationResult) {
            if (vacationResult.length === 1) {
              result[0].vacation_year = targetYear;
              result[0].vacation_year_remain = vacationResult[0].total_day - vacationResult[0].used_holiday;
            }
    
            Statistics.selectAvgInOutTime(start.substr(0,4), start, end.substr(0,10), userId).then(function(resultAvg) {
                debug("DASHBOARD resultAvg[0].in_time_avg = "+resultAvg[0].in_time_avg);
              if (resultAvg[0].in_time_avg !== null) {
                result[0].in_time_avg = resultAvg[0].in_time_avg;
                result[0].out_time_avg = resultAvg[0].out_time_avg;
              }
    
              // 날짜 계산
              // 주 단위로 계산을 해야 함.
              
              var rangeList = []; // {startDate: "", endDate: ""}
              // 시작일이 월요일이 아닌 경우 이전달의 마지막 월요일 찾기
              if (start < end) {
                var range = util.getWeekByBaseDate(start);
                rangeList.push(range);
                while(range.endDate <= end) {
                  var startDate = moment(range.endDate).add(1, 'days').format('YYYY-MM-DD');
                  range = util.getWeekByBaseDate(startDate);
                  rangeList.push(range);
                }
              }
              console.log('rangeList : ', rangeList);
              Statistics.selectOverTimeByIdBulk(userId, rangeList).then(function(resultOverTimePerWeek) {
    
                var overTimeWeek = [];
                for (var week of resultOverTimePerWeek) {
                  overTimeWeek.push({date: week[0].base_date, overTime: week[0].sum_over_time})
                }
    
                result[0].overTimeWeek = overTimeWeek;
                // cleanday 정보 추가
                Message.getCleanDay().then(function (resultCleanDay) {
                  if (resultCleanDay[0].visible === 1) {
                    result[0].cleanDay = resultCleanDay[0].text;
                  }
                  res.send(result);
                });
              });
            });
        });
    }).catch(function (e) {
        console.error(e);
        res.send(e);
    });
});

router.route('/approval/list')
.get(function(req, res){
    // Get user infomation list (GET)
    var approval = new Approval();
    if(req.query.startDate == '' || req.query.endDate == ''){
        approval.getApprovalList().then(function(result){
            debug("Complete Select Approval List.");
            res.send(result);    
        }).catch(function(e){
            debug("Error Select Approval List.");
            res.status(500);
            res.send({
                success:false,
                message: e.message,
                error:e
            });
        });
    }else if(req.query.id && req.query.year){
        approval.getApprovalListById(req.query).then(function(result){
            res.send(result);
        });
    }else{
        var adminString = sessionManager.getAdminString(req.cookies.saram);
        approval.getApprovalListWhere(req.query.startDate, req.query.endDate, adminString, req.query.managerId).then(function(result){
            debug("Complete Select Approval List Where.");
            res.send(result);    
        }).catch(function(e){
            debug("Error Select Approval List Where.");
            res.status(500);
            res.send({
                success:false,
                message: e.message,
                error:e
            });
        });
    }
});

router.route("/approval/vacation/gubunList")
.get(function(req, res){
    var param = {};
    param.category = 'office';
    var code = new Code(param);
    code.getCodeList().then(function(result) {
        debug("Result = "+ String(result));
        return res.send(result);
    });
});

router.route("/approval/vacation/list")
.get(function(req, res, next){
    Vacation.getVacationById(req.query).then(function(result) {
		return res.send(result);
	}).catch(function(err) {
		next(err);
	});
});

router.route("/approval/manager")
.get(function(req, res){
    // Get user infomation list (GET)
    var user = new User();
    user.getManagerList(req.query.id).then(function(result){
        res.send(result);    
    }).catch(function(e){
        debug("Error Select User List.");
        res.status(500);
        res.send({
            success:false,
            message: e.message,
            error:e
        });
    });
});

router.route("/approval/appIndex")
.get(function(req, res){
    // Get user infomation list (GET)
    var approval = new Approval();
    approval.getApprovalIndex(req.query.yearmonth).then(function(result){
        debug("Complete Select Approval List Where.");
        res.send(result);    
    }).catch(function(e){
        debug("Error Select Approval List Where.");
        res.status(500);
        res.send({
            success:false,
            message: e.message,
            error:e
        });
    });
});

router.route("/approval/appIndex/add")
.post(function(req, res) {
    var approval = new Approval(req.body);

    approval.setApprovalIndex().then(function(e){
        debug("Complete Add Approval.");
        res.send({success:true, msg:"Complete Add Approval."});
    }).catch(function(e){
        debug("Error Add Approval.");
        res.status(500);
        res.send({
            success:false,
            message: e.message,
            error:e
        });
    });
});

router.route('/approval')
.post(function(req, res){
    var approval = new Approval();
    approval.insertApproval(req.body).then(function(e){
        debug("Complete Add Approval.");
        res.send({success:true, msg:"Complete Add Approval."});
        
        if(!_.isUndefined(req.body.doc_num) && !_.isUndefined(req.body.manager_id)){
            approval.sendApprovalEmail(req.body.doc_num, req.body.manager_id).then(function(){
                debug("Send Email"); 
            }).catch(function(e){
                debug("Fail to Send Email");
            });
        }
        
    }).catch(function(e){
        debug("Error Add Approval.");
        res.status(500);
        res.send({
            success:false,
            message: e.message,
            error:e
        });
    });
});

router.route('/approval/info')
.get(function(req, res){
    // Get user infomation list (GET)
    var approval = new Approval();
    var doc_num = req.query.doc_num;
    approval.getApprovalList(doc_num).then(function(result){
        debug("Complete Select Approval List Where.");
        res.send(result);    
    }).catch(function(e){
        debug("Error Select Approval List Where.");
        res.status(500);
        res.send({
            success:false,
            message: e.message,
            error:e
        });
    });
});

router.route('/approval/bulk')
.put(function(req, res) {
    var approval = new Approval();
    var id = req.body._id;
    console.log(id);
    if(id == "updateState"){
        approval.updateApprovalState(req.body.data).then(function(e){
            debug("Complete Update Approval."); 
            res.send({success:true, msg:"Complete Update Approval."});
        }).catch(function(e){
            debug("Error Update Approval.");
            debug(e);
            res.status(500);
            res.send({
                success:false,
                message: "Error Update Approval",
                error:e
            });
        });
    }else{
        approval.updateApprovalConfirm(req.body).then(function(e){
            debug("Complete Update Approval."); 
            res.send({success:true, msg:"Complete Update Approval."});
            if(!_.isUndefined(req.body.outOffice)){
                if(req.body.outOffice.state == "결재완료"){
                    approval.sendOutofficeEmail(req.body.outOffice.doc_num).then(function(){
                        debug("Send Email"); 
                    }).catch(function(e){
                        debug("Fail to Send Email");
                    });
                }    
            }
        }).catch(function(e){
            debug("Error Update Approval.");
            debug(e);
            res.status(500);
            res.send({
                success:false,
                message: "Error Update Approval",
                error:e
            });
        });
    }
});

router.route("/inout/list")
.get(function(req, res){
	var adminString=sessionManager.getAdminString(req.cookies.saram);
	if (adminString !== '%' && req.query.dept === undefined) {
		req.query.dept = sessionManager.getAdminString(req.cookies.saram, 'dept_name');
    }
	RawData.selectRawDataList(req.query, adminString).then(function(result){
        res.send(result);
    });
});

module.exports = router;