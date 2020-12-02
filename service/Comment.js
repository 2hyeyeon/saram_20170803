// Author: sanghee park <novles@naver.com>
// Create Date: 2014.12.18
// 사용자 Service
var _ = require("underscore"); 
var debug = require('debug')('Comment');
var Schemas = require("../schemas.js");
var Promise = require('bluebird');
var UserDao = require('../dao/userDao');
var CommentDao = require('../dao/commentDao.js');
var CommuteDao = require('../dao/commuteDao.js');
var ApprovalDao= require('../dao/approvalDao.js');

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

var Comment = function() {	

	var _getComment = function(data, id) {
		return CommentDao.selectComment(data, id);
	};

	// 결재를 해야할 코멘트 건수
	var _getCommentCountToManager = function(id) {
		return CommentDao.selectCommentCountToManager(id);
	};
	
	var _getCommentById = function(id) {
		return CommentDao.selectCommentById(id);
	};
	
	var _getCommentByPk = function(data) {
		return CommentDao.selectCommentByPk(data);
	};	

	var _insertComment = function(inData) {
		return new Promise(function(resolve, reject){// promise patten			
			CommuteDao.updateCommuteCommentCount(inData).then(function(result) {
				// comment 등록
				CommentDao.insertComment(inData).then(function(result) {
					resolve(result);
	    		}).catch(function(e){//Connection Error
	                reject(e);
	             });
    		}).catch(function(e){//Connection Error
                reject(e);
             });
		});
	};
	
	var _updateCommentReply = function(inData) {
		return new Promise(function(resolve, reject){// promise patten
			CommentDao.updateCommentReply(inData).then(function(result) {
				CommentDao.selectCommentByPk(inData).then(function(result) {
					resolve(result);
	    		}).catch(function(e){//Connection Error
	                reject(e);
	             });
			}).catch(function(e){//Connection Error
	            reject(e);
	         });		
		});

	};
	
	var _sendCommentEmail = function(inData){
		return new Promise(function(resolve, reject){// promise patten
			var managerId = inData.approval_id;
			fs.readFileAsync(path.dirname(module.parent.parent.filename) + "/views/comment.html","utf8").then(function (html) {
				UserDao.selectIdByUser(inData.id).then(function(result){
					var user = result[0];
					
					var data = {
						name : user.name,
						date : inData.date,
						comment : inData.comment,
						comment_reply : inData.comment_reply,
					};
					
	                var temp=_.template(html);
	                var sendHTML=temp(data);
	                var to = [];
	                var cc = [];

	                if(inData.state == "상신"){
	                	ApprovalDao.getManagerId(managerId).then(function(result){
	                		for(var idx in result){
	                			to = [
									{ name : result[idx].name, address : result[idx].email}
								];	
	                		}
	                		
	                		to.push({ name: "김성식", address: "sskim@yescnc.co.kr"});
	                		to.push({ name :"김은영", address: "eykim@yescnc.co.kr"});
	                		
	                		var mailOptions= {
			                    from: 'webmaster@yescnc.co.kr', // sender address 
			                    to: to,
			                    subject:"[출퇴근 수정 요청] Comment가 등록되었습니다. (" + data.date + " " +  data.name + ")",
			                    html:sendHTML,
			                	text:"",
			                };
			                
			                console.log(mailOptions);
			                transport.sendMail(mailOptions, function(error, info){
			                    if(error){//메일 보내기 실패시 
			                        console.log(error);
			                        reject();
			                    }else{
			                        resolve();
			                    }
			                });
						});	
	                }else if(inData.state == "결재"){
	                	to = [
		                    { name: "김성식", address: "sskim@yescnc.co.kr"},
		                    { name :"김은영", address: "eykim@yescnc.co.kr"},
	                    ];
	                    to.push({ name :user.name, address: user.email})
	                    var mailOptions= {
		                    from: 'webmaster@yescnc.co.kr', // sender address 
		                    to: to,
		                    subject:"[출퇴근 수정 요청] Comment의 결재가 완료되었습니다. (" + data.date + " " +  data.name + ")",
		                    html:sendHTML,
		                	text:"",
		                };
		                
		                console.log(mailOptions);
		                transport.sendMail(mailOptions, function(error, info){
		                    if(error){//메일 보내기 실패시 
		                        console.log(error);
		                        reject();
		                    }else{
		                        resolve();
		                    }
		                });
	                }else if(inData.state == "처리완료"){
	                	cc = [
		                    { name: "김성식", address: "sskim@yescnc.co.kr"},
		                    //{ name :"김은영", address: "eykim@yescnc.co.kr"},  // 2017.10.13 김은영 대리 요구로 발신하지 않음.
	                    ];
	                    to.push({ name :user.name, address: user.email})
	                    var mailOptions= {
		                    from: 'webmaster@yescnc.co.kr', // sender address 
		                    to: to,
		                    cc: cc,
		                    subject:"[처리완료] Comment의 처리가 완료되었습니다. (" + data.date + " " +  data.name + ")",
		                    html:sendHTML,
		                	text:"",
		                };
		                
		                console.log(mailOptions);
		                transport.sendMail(mailOptions, function(error, info){
		                    if(error){//메일 보내기 실패시 
		                        console.log(error);
		                        reject();
		                    }else{
		                        resolve();
		                    }
		                });
		            }
				});
				
			});
		});
	};
	
	return {
		getComment : _getComment,
		getCommentCountToManager : _getCommentCountToManager,
		getCommentById : _getCommentById,
		getCommentByPk : _getCommentByPk,
		insertComment : _insertComment,
		updateCommentReply : _updateCommentReply,
		sendCommentEmail : _sendCommentEmail
	};
};

module.exports = new Comment();