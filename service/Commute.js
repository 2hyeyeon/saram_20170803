// Author: sanghee park <novles@naver.com>
// Create Date: 2014.12.18
// 사용자 Service
var _ = require("underscore");
var Promise = require('bluebird');
var debug = require('debug')('Comment');
var CommuteDao = require('../dao/commuteDao.js');
var ChangeHistoryDao = require('../dao/changeHistoryDao.js');
var ApprovalDao = require('../dao/approvalDao.js');
var db = require('../lib/dbmanager.js');

var fs = require('fs');
var path = require("path");
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

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

var Commute = function() {	
	var _getCommute = function(data, id, dept) {
		return CommuteDao.selectCommute(data, id, dept);
	};

	var _insertCommute = function(data){
		return new Promise(function(resolve, reject){
			var queryArr = [];
			for(var idx in data){
				queryArr.push(CommuteDao.insertCommute(data[idx]));
			}
			
			db.queryTransaction(queryArr).then(function(resultArr){
				resolve(resultArr);
			}, function(err){
				reject(err);
			});
		});
	};
	
	var _updateCommute = function(data){
		return new Promise(function(resolve, reject){
			var queryArr = [];
			for(var idx in data.data){
				queryArr.push(CommuteDao.updateCommute_t(data.data[idx]));
			}
			for(var idx in data.changeHistory){
				queryArr.push(ChangeHistoryDao.inserChangeHistory(data.changeHistory[idx]));	
			}
			console.log(queryArr);
			db.queryTransaction(queryArr).then(function(resultArr){
				resolve(resultArr);	
			},function(err){
				reject(err);
			});
		});
	};
	
	var _getCommuteDate = function(date){
		return CommuteDao.selectCommuteDate(date);
	};
	
	var _getCommuteByID = function(data){
		return CommuteDao.selectCommuteByID(data);
	};
	
	var _getLastiestDate = function(){
		return CommuteDao.getLastiestDate();
	};
	
	var _getCommuteToday = function(date, dept_code){
		return CommuteDao.selectCommuteToday(date, dept_code);
	};

	var _sendLateForWorkEmail = function(data){

		return new Promise(function(resolve, reject){
			var mannagerGroup = [];
      // 메일 포함 임원 ID LIST.
      var includeEmailID1 = { "050601": true }; // 사장님
      var includeEmailID2 = { "160301": true, "160401": true}; // 유강재 전무, 최홍락 상무
			
			/* 임원급 메일 가져오기 추가 */
			ApprovalDao.getApprovalMailingList("0000").then(function(result){
				mannagerGroup = result;

        var includeEmailList1 = [];
        var includeEmailList2 = [];
				for(var idx in mannagerGroup){
					if(includeEmailID1.hasOwnProperty(mannagerGroup[idx].id)) {
						includeEmailList1.push({ name : mannagerGroup[idx].name, address : mannagerGroup[idx].email, id : mannagerGroup[idx].id});
          }
          if(includeEmailID2.hasOwnProperty(mannagerGroup[idx].id)) {
						includeEmailList2.push({ name : mannagerGroup[idx].name, address : mannagerGroup[idx].email, id : mannagerGroup[idx].id});
					}
				}

				var lateData;
				for(var idx in data){
					lateData = data[idx];
					CommuteDao.getCommuteMailData(lateData).then(function(mailData){
						/*
						in_time,
						mem.name,
						mem.email,
						mem.leave_company,
						dept.area as dept_area,
						work.name as work_type,
						dept.leader as leader_id,
						leader.name as leader_name,
						leader.email as leader_email
						*/
						if(mailData.length == 1 ){
							mailData = mailData[0];
						}

						fs.readFileAsync(path.dirname(module.parent.parent.filename) + "/views/reportOnLateCommute.html","utf8").then(function (html) {

							var sendData = {
								name : mailData.name,
								code_name : mailData.work_type,
								date : mailData.in_time,
								submit_comment : ""
							};
							var temp=_.template(html);
							var sendHTML=temp(sendData);

                var to = [];
								var cc = [];
								// 부서장(팀장) mail
								to.push({name : mailData.leader_name, address : mailData.leader_email, id : mailData.leader_id});
								// 지각 당사자 mail
								cc.push({name : mailData.name, address : mailData.email, id : mailData.id});

								// 지각 메일 임원 추가 
								if(mailData.dept_area != "수원"){
                  if (mailData.dept_code === "1000") {
                    // 경영지원팀인 경우 사장님께 전달. 2019.08.07
                    cc = cc.concat(includeEmailList1);
                  } else {
                    // 그 외 서울 부서인 경우 유강재 전무, 최홍락 상무에게 전달
                    cc = cc.concat(includeEmailList2);
                  }
								}
								cc = _.uniq(cc, function(d) {return d.address});	// 중복 제거
								
								var mailOptions= {
									from: 'webmaster@yescnc.co.kr', // sender address 
									to: to,
									subject:"[근태보고] " + mailData.name + "_" + mailData.work_type,
									html:sendHTML,
									text:"",
									cc: cc
								};

								debug("Send Mail Option");
								console.log(mailOptions);
								transport.sendMail(mailOptions, function(error, info){
									if(error){//메일 보내기 실패시 
										debug("Fail transport.sendMail");
										console.log(error);
										reject();
									}else{
										resolve();
									}
								});
						}).catch(SyntaxError, function (e) {
							debug("Send Fail : catch : " + e);
							reject(e);
						}).error(function (e) {
							debug("Send Fail : error : " + e);
							reject(e);
						});
					});
					lateData = null;
				}
			});
		});
	};
	
	return {
		getCommute : _getCommute,
		updateCommute : _updateCommute,
		insertCommute : _insertCommute,
		getCommuteDate : _getCommuteDate,
		getCommuteByID: _getCommuteByID,
		getLastiestDate : _getLastiestDate,
		getCommuteToday : _getCommuteToday,
		sendLateForWorkEmail : _sendLateForWorkEmail
	};
};

module.exports = new Commute();
