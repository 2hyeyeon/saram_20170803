var _ = require("underscore"); 
var debug = require('debug')('RoomReg');
var RoomRegDao= require('../dao/roomRegDao.js');
var UserService= require('../service/User.js');
var moment = require('moment');

var fs = require('fs');
var path = require("path");
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var transport = nodemailer.createTransport(smtpTransport({
	host: 'wsmtp.ecounterp.com',
	port: 587,
	auth: {
		user: 'webmaster@yescnc.co.kr',
		pass: '121512yes'
	},
	rejectUnauthorized: false,
	connectionTimeout:10000
}));

var RoomReg = function () {

    var _selectRoomRegList = function(data){
        return RoomRegDao.selectRoomRegList(data);
    };

    var _insertRoomReg = function(data){
        return RoomRegDao.insertRoomReg(data);
    };

    var _checkRoomReg = function(data) {
        return RoomRegDao.selectRoomRegBefore(data);
    };

    var _updateRoomReg = function(data){
        return RoomRegDao.updateRoomReg(data);
    };
    
    var _deleteRoomReg = function(index){
        return RoomRegDao.deleteRoomReg(index);
    };

    var _sendEmailRoomReg = function() {
      
      // 매 10분마다 스케줄에 의하여 실행됨.
      // 현재 시간을 기준으로 30분 후의 예약 정보를 조회한다.
      var now = moment().add(30, 'minute');
      var date = now.format("YYYY-MM-DD");
      var start_time = now.format("HH:mm");

      // var date = '2019-07-09';
      // var start_time = '12:00';

      debug("START sendEmailRoomReg!!! >>> " + date + " " + start_time );

      RoomRegDao.selectRoomRegByDateTime(date, start_time).then(function(roomRegList) {
        debug("roomRegList length : " + roomRegList.length);
        if ( roomRegList.length === 0 ) {
          debug("END sendEmailRoomReg!!! >>> nothing to do...");
          return;
        }

        var userService = new UserService();
        userService.getUserEmail().then(function (userEmailList) {

          fs.readFileAsync(path.dirname(module.parent.parent.filename) + "/views/roomRegEmailFormat.html","utf8").then(function (html) {
            for (var roomReg of roomRegList) {
              debug("ready for send mail : " + roomReg.title);
              if (roomReg.attendance_list === null || roomReg.attendance_list === undefined || roomReg.attendance_list === "[]") {
                continue;
              }

              var attendance_list = JSON.parse(roomReg.attendance_list);
              var attendance_list_str = "";
              var mailTo = [];
              for (var member of attendance_list) {
                attendance_list_str += member.name + " ";
                var userIndex = _.findIndex(userEmailList, {id: member.id});
                if (userIndex === -1) {
                  console.error("cannot find email address!!!!!! : " + member.id);
                }
                mailTo.push({name: member.name, address: userEmailList[userIndex].email});
              }

              // 이메일 HTML 셋팅
              roomReg.attendance_list_str = attendance_list_str;
              var template=_.template(html);
              var sendHTML=template(roomReg);

              var mailOptions= {
                from: 'webmaster@yescnc.co.kr', // sender address 
                to: mailTo,
                subject:"[회의참석] " + roomReg.title,
                html:sendHTML,
                text:"",
                cc: []
              };

              transport.sendMail(mailOptions, function(error, info){
                if(error){//메일 보내기 실패시 
                  console.log(error);
                }else{
                  debug('send roomreg email done...');
                }
              });    
            }
          });
        });
      });
    };
    
    return {
        selectRoomRegList : _selectRoomRegList,
        insertRoomReg : _insertRoomReg,
        checkRoomReg  : _checkRoomReg,
        updateRoomReg : _updateRoomReg,
        deleteRoomReg : _deleteRoomReg,
        sendEmailRoomReg: _sendEmailRoomReg,
    };
};

module.exports = new RoomReg();
