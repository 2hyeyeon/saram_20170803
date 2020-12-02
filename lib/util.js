var _ = require("underscore"); 
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var moment = require('moment');

var Util = function () {
};

var staticTransport = undefined;

_.extend(Util.prototype, {

	getzFormat : function(s, len) {
	    var sZero = "";
	    s = s + "";
	    if (s.length < len) {
	        for (var i = 0; i < (len - s.length); i++) {
	            sZero += "0";
	        }
	    }
	    return sZero + s;
  },
  
  getEmailTransport: function() {
    if (staticTransport === undefined) {
      staticTransport = nodemailer.createTransport(smtpTransport({
        host: 'wsmtp.ecounterp.com',
        port: 587,
        auth: {
          user: 'webmaster@yescnc.co.kr',
          pass: '121512yes'
        },
        rejectUnauthorized: false,
        connectionTimeout:10000
      }));
    }
    return staticTransport;
  },

  // 기준일 이전 또는 이후의 내가 찾고 싶은 요일의 날짜 리턴
  // 0: 일, 1: 월, 2: 화. 3: 수, 4: 목, 5: 금, 6: 토
  getDateByBaseDate: function(baseDateStr, dayOfWeek, isBefore) {
    var baseDate = moment(baseDateStr);
    var baseDateWeekDay = baseDate.day();
    if (baseDateWeekDay === dayOfWeek) {
      return baseDate;
    }

    if (isBefore) {
      var resultDate = moment(baseDateStr).add(dayOfWeek - baseDateWeekDay, "days").format('YYYY-MM-DD');
      return resultDate;
    } else {
      var resultDate = moment(baseDateStr).add(baseDateWeekDay, "days").format('YYYY-MM-DD');
      return resultDate;
    }
  },

  // 특정 일자 기준의 일주일 구하기 ( 월 ~ 일 )
  getWeekByBaseDate: function(baseDateStr) {
    var startDate = moment(baseDateStr).startOf('isoweek').format('YYYY-MM-DD');
    var endDate = moment(startDate).add(6, 'days').format('YYYY-MM-DD');
    return {startDate: startDate, endDate: endDate};
  },

});



module.exports = new Util();