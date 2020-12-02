// Author: sanghee park <novles@naver.com>
// Create Date: 2014.12.18
// 사용자 Service
var _ = require("underscore"); 
var debug = require('debug')('Approval');
var Schemas = require("../schemas.js");
var ApprovalDao= require('../dao/approvalDao.js');
var CommuteDao = require('../dao/commuteDao.js');
var OutOfficeDao= require('../dao/outOfficeDao.js');
var InOfficeDao= require('../dao/inOfficeDao.js');
var moment = require("moment");

var Promise = require('bluebird');
var db = require('../lib/dbmanager.js');

var fs = require('fs');
var path = require("path");
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function timeformat(num){
	var result = "";
	var hour = Math.floor(num / 60);
	var min = Math.floor(num % 60);

	if(hour < 10){
		result += "0";
	}
	result += hour + "시간 ";

	if(min < 10){
		result += "0";
	}

	result += min+"분";

	return result;
}

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

var Approval = function (data) {
	var _getApprovalList = function (doc_num) {
		return ApprovalDao.selectApprovalList(doc_num);
	};
	var _getApprovalListWhere = function (startDate, endDate, submitId, managerId) {
		if(managerId != undefined && managerId != ""){
			return ApprovalDao.selectApprovalByManager(managerId, startDate, endDate);
		}
		return ApprovalDao.selectApprovalListWhere(startDate, endDate, submitId);
	};
	var _getApprovalListById = function(data){
		return ApprovalDao.selectApprovalListById(data);
	};
	var _insertApproval = function (data) {
		return ApprovalDao.insertApproval(data);
	};    
	var _updateApprovalState = function(data){
		return ApprovalDao.updateApprovalState(data);
	};
	var _updateApprovalConfirm = function(data) {
		var _data = data;
		return new Promise(function(resolve, reject){
			// 이미 변경하고자 하는 상태로 변경된 경우 reject한다.
			ApprovalDao.selectApprovalByDocNum(_data._id).then(function(approvalRow) {
				if (approvalRow[0].state === _data.data[0].state) {
					reject('이미 ' + approvalRow.state + ' 상태입니다.');
				}

				var queryArr = [];
				for(var idx in data.data){
					var approvalItem = data.data[idx];
					if(approvalItem.state == "취소반려"){
						queryArr.push(ApprovalDao.rejectApprovalConfirm(approvalItem));
					}else{
						console.log(data);
						if(!(_.isUndefined(data.inOffice) || _.isNull(data.inOffice))){

							var today = moment();
							var inOfficeDay = moment(data.inOffice.arrInsertDate[0], "YYYY-MM-DD").hours(0).minutes(0).seconds(0);
							if(today.isBefore(inOfficeDay)){
								if(inOfficeDay.day() == "0" && today.day() == "6" && today.diff(inOfficeDay,"days") == 0 ){
									approvalItem.black_mark = '3';
								}else{
									approvalItem.black_mark = '1';
								}
							}else{
								approvalItem.black_mark = '3';
							}

							queryArr.push(ApprovalDao.updateApprovalConfirm2(approvalItem));        

						}else{
							queryArr.push(ApprovalDao.updateApprovalConfirm(approvalItem));    
						}
					}
				}

				if(!(_.isUndefined(data.outOffice) || _.isNull(data.outOffice))){
					var outOfficeData = {};
					for(var key in data.outOffice.arrInsertDate){
						outOfficeData[key] = _.clone( data.outOffice);
						outOfficeData[key].date = data.outOffice.arrInsertDate[key];
						outOfficeData[key].year = outOfficeData[key].date.substr(0,4);
						outOfficeData[key].black_mark = (data.outOffice.black_mark == undefined)? "" : data.outOffice.black_mark;
						queryArr.push(OutOfficeDao.insertOutOffice(outOfficeData[key]));
					}
				}

				if(!(_.isUndefined(data.inOffice) || _.isNull(data.inOffice))){
					var inOfficeData = {};
					for(var inKey in data.inOffice.arrInsertDate){
						inOfficeData[inKey] = _.clone( data.inOffice );
						inOfficeData[inKey].date = (data.inOffice.office_code == 'O01' && data.inOffice.arrInsertDate[inKey] == null)? data.inOffice.start_date : data.inOffice.arrInsertDate[inKey];
						inOfficeData[inKey].year = inOfficeData[inKey].date.substr(0,4);
						inOfficeData[inKey].black_mark = (data.inOffice.black_mark == undefined)? "" : data.inOffice.black_mark;
						queryArr.push(InOfficeDao.insertInOffice(inOfficeData[inKey]));    
					}
				}

				if(!(_.isUndefined(data.commute) || _.isNull(data.commute))){
					for(var idx in data.commute){
						queryArr.push(CommuteDao.updateCommute_t(data.commute[idx])); 
					}
				}

				db.queryTransaction(queryArr).then(function(resultArr){
					resolve(resultArr); 
				}, function(err){
					reject(err);
				});
			});
		}).catch(function(err){
			if(!(_.isUndefined(_data.outOffice) || _.isNull(_data.outOffice))){        		  
				console.log("ERROR : " + _data.outOffice.doc_num);
				db.query("outOffice", "deleteOutOfficeList", [_data.outOffice.doc_num]).then(function(resultArr){
					console.log(_data.outOffice.doc_num);
				});
			}
			throw(err);
		});
	};
	var _sendOutofficeEmail = function(doc_num){

		return new Promise(function(resolve, reject){
			ApprovalDao.getApprovalMailData(doc_num).then(function(data){
				if(data.length == 1 )
					data = data[0];

				if(data.start_date == data.end_date)
					data.end_date = null;

				fs.readFileAsync(path.dirname(module.parent.parent.filename) + "/views/outofficeApproval.html","utf8").then(function (html) {

					if(data.code_name == "초과근무"){
						var splitArr = data.submit_comment.split(",");
						var except = parseInt(splitArr[0],10);
						var overTime = parseInt(splitArr[1],10);
						var startTime = _.isUndefined(splitArr[2]) ? "" : splitArr[2];
						var endTime = _.isUndefined(splitArr[3]) ? "" : splitArr[3];
						var calc = overTime-except;
						var type = Math.floor(calc/120);
						if(type == 1){
							type = "야근 A형";
						}else if(type == 2){
							type = "야근 B형";
						}else if(type > 2){
							type = "야근 C형";
						}else {
							type = "-";
						}
						data.submit_comment = "출근시간 : "+ startTime + ", 퇴근시간: "+endTime+"<br>초과시간 : "+timeformat(overTime)+", 제외시간 : "+timeformat(except)+"<br>확정시간 : "+timeformat(calc)+", 근무타입 : " + type;
					}
					var temp=_.template(html);
					var sendHTML=temp(data);

					var owner = [];
					var mannagerGroup = [];
					// 근태 결재 메일 제외 임원 ID LIST. `이남노 부사장, 공주연 기술영업이사 제외`
					var excludeEmailID = { "170701":false, "180101":false };

					/* 임원급 메일 가져오기 추가 */
					ApprovalDao.getApprovalMailingList("0000").then(function(result){
						mannagerGroup = result;

						ApprovalDao.getApprovalMailingList(data.dept_code).then(function(result){
							var cc = [];

							/* 유강재 이사님 결재선일 경우(팀장) 사장님, 부사장님 추가 /
							if(data.manager_id == "160301"){
								cc.push({name : "김특훈", address : "thkim@yescnc.co.kr", id:"050601"});
							}

							// 모든 근태 결재 메일을 임원에게 발송
							cc.push({ name :"이남노", address: "nnlee@yescnc.co.kr", id:"170701"});
							cc.push({ name :"전영호", address: "yh.jeon@yescnc.co.kr", id:"150201"});
							cc.push({ name :"유강재", address: "youkj@yescnc.co.kr", id:"160301"});
							cc.push({ name :"최홍락", address: "redrock.choi@yescnc.co.kr", id:"160401"});*/
							
							// 모든 근태 결재 메일을 임원에게 발송
							var len = mannagerGroup.length;
							if (len > 0){
								var excludeID = false;
								// 임원급 메일에서 사장님 분리.
								for(var idx in mannagerGroup){
									excludeID = _.isUndefined(excludeEmailID[mannagerGroup[idx].id]);
									if(mannagerGroup[idx].id == "050601"){ // 사장님
										owner.push({name: mannagerGroup[idx].name,  address: mannagerGroup[idx].email, id: mannagerGroup[idx].id});
									} else if(excludeID) {
									//} else if( !_.isUndefined(excludeEmailID[mannagerGroup[idx].id]) && excludeEmailID[mannagerGroup[idx].id] )  {
										cc.push({ name : mannagerGroup[idx].name, address : mannagerGroup[idx].email, id : mannagerGroup[idx].id});
									}
								}

								/* 유강재 이사님 결재선일 경우(팀장) 사장님, 부사장님 추가 */
								if (owner.length > 0 && data.manager_id == "160301"){
									cc.push({name: owne[0].name, address: owner[0].email, id: owner[0].id });
								}
							}
							
							/* 근태 메일 품질검증팀 제외 */
							if(data.dept_area != "수원"){
								// 서울에서 발생한 근태 결재내역은 모든 팀장에게 발송 - 2016.10.18
								// 팀장에게 무조건 보내지 않도록 수정 - 2017.12.05
								// cc.push({ name :"박수종", address: "soojong@yescnc.co.kr", id:"071102"});
								// cc.push({ name :"윤정관", address: "jkyoon96@yescnc.co.kr", id:"060601"});
								// cc.push({ name :"김태중", address: "hhs2tjk@yescnc.co.kr", id:"070901"});
								// cc.push({ name :"최치운", address: "cwchoi@yescnc.co.kr", id:"080802"});
								for(var idx in result){
									if(result[idx].email != "" || !_.isNull(result[idx].email) || !_.isUndefined(result[idx].email)){
										if(result[idx].leave_company == "" || _.isNull(result[idx].leave_company) || _.isUndefined(result[idx].leave_company)) {
											cc.push({name : result[idx].name, address: result[idx].email, id:result[idx].id});
										}
									}
								}
							}
							cc = _.uniq(cc, function(d) {return d.address});	// 중복 제거
							
							// 2017.07.27 김성식 부장님 요청사항 - 결재권자는 제외
							cc = _.filter(cc, function(cc_one){return cc_one.id != data.manager_id});
							
							// cc.push({ name :"강정규", address: "jkkang@yescnc.co.kr", id:"100501"});	// 테스트용
							
							var mailOptions= {
								from: 'webmaster@yescnc.co.kr', // sender address 
								to: [
									{ name: "김성식", address: "sskim@yescnc.co.kr"},
									{ name :"김은영", address: "eykim@yescnc.co.kr"}
								],
								subject:"[근태보고] " + data.name + "_" + data.code_name,
								html:sendHTML,
								text:"",
								cc: cc
							};

							transport.sendMail(mailOptions, function(error, info){
								if(error){//메일 보내기 실패시 
									console.log(error);
									reject();
								}else{
									resolve();
								}
							});    
						});
					});
				}).catch(SyntaxError, function (e) {
					reject(e);
				}).error(function (e) {
					reject(e);
				});    
			});
		});
	};

	var _sendApprovalEmail = function(doc_num, managerId){
		return new Promise(function(resolve, reject){
			ApprovalDao.getApprovalMailData(doc_num).then(function(data){
				if(data.length == 1 )
					data = data[0];

				if(data.start_date == data.end_date)
					data.end_date = null;

				fs.readFileAsync(path.dirname(module.parent.parent.filename) + "/views/outofficeApproval.html","utf8").then(function (html) {
					if(data.code_name == "초과근무"){
						var splitArr = data.submit_comment.split(",");
						var except = parseInt(splitArr[0],10);
						var overTime = parseInt(splitArr[1],10);
						var startTime = _.isUndefined(splitArr[2]) ? "" : splitArr[2];
						var endTime = _.isUndefined(splitArr[3]) ? "" : splitArr[3];
						var calc = overTime-except;
						var type = Math.floor(calc/120);
						if(type == 1){
							type = "야근 A형";
						}else if(type == 2){
							type = "야근 B형";
						}else if(type > 2){
							type = "야근 C형";
						}else {
							type = "-";
						}
						data.submit_comment = "출근시간 : "+ startTime + ", 퇴근시간: "+endTime+"<br>초과시간 : "+timeformat(overTime)+", 제외시간 : "+timeformat(except)+"<br>확정시간 : "+timeformat(calc)+", 근무타입 : " + type;
					}

					var temp=_.template(html);
					var sendHTML=temp(data);

					ApprovalDao.getManagerId(managerId).then(function(result){
						var to = [];
						var cc = [];


						for(var idx in result){
							if(result[idx].email != "" || !_.isNull(result[idx].email) || !_.isUndefined(result[idx].email)){
								var person = result[idx];
								to.push({name : person.name, address: person.email});

								if(person.name == "김특훈"){
									cc.push({ name: "김성식", address: "sskim@yescnc.co.kr"});
								}
							}
						}

						var mailOptions= {
							from: 'webmaster@yescnc.co.kr', // sender address 
							to: to,
							subject:"[근태 상신 알림] " + data.name + "_" + data.code_name,
							html:sendHTML,
							text:"",
						};

						if(cc.length > 0){
							mailOptions["cc"] = cc;
						}

						transport.sendMail(mailOptions, function(error, info){
							if(error){//메일 보내기 실패시 
								console.log(error);
								reject();
							}else{
								resolve();
							}
						});
					});
				}).catch(SyntaxError, function (e) {
					reject(e);
				}).error(function (e) {
					reject(e);
				});    
			});

		});
	};

	var _getApprovalByDocNum = function (docNum) {
		return ApprovalDao.selectApprovalByDocNum(docNum);
	};

	var _getApprovalIndex = function (yearmonth) {
		return ApprovalDao.selectApprovalIndex(yearmonth);
	};

	var _setApprovalIndex = function () {
		var _schema = new Schemas('approval_index');
		var _param = _schema.get(data);

		if(_param.seq != null)
			return ApprovalDao.updateMaxIndex(_param);            
		else
			return ApprovalDao.insertApprovalIndex(_param);
	};
	var _updateApprovalIndex = function (yearmonth) {
		return ApprovalDao.updateMaxIndex(yearmonth);
	};
	return {
		getApprovalList:_getApprovalList,
		getApprovalListWhere:_getApprovalListWhere,
		getApprovalListById:_getApprovalListById,
		insertApproval:_insertApproval,
		updateApprovalState : _updateApprovalState,
		updateApprovalConfirm:_updateApprovalConfirm,
		getApprovalByDocNum:_getApprovalByDocNum,
		getApprovalIndex:_getApprovalIndex,
		setApprovalIndex:_setApprovalIndex,
		updateApprovalIndex:_updateApprovalIndex,
		sendOutofficeEmail:_sendOutofficeEmail,
		sendApprovalEmail : _sendApprovalEmail
	};
};

module.exports = Approval;

