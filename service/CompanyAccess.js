// Author: sanghee park <novles@naver.com>
// Create Date: 2014.12.18
// 사용자 Service
var _ = require("underscore"); 
var debug = require('debug')('Vacation');
var Schemas = require("../schemas.js");
var Promise = require('bluebird');
var RawDataDao= require('../dao/rawDataDao.js');
var UserDao= require('../dao/userDao.js');
var Moment = require("moment");

var CompanyAccess = function() {	

	var _setAccess = function(data, user) {
		
		return new Promise(function(resolve, reject){
			var selDataObj = {
					id: user.id,
					ip_pc: data.ip_pc,
					ip_office: data.ip_office
			};

			UserDao.selectUserByIp(selDataObj).then(function(result) {
				var need_confirm = 1; // 1: 정상 , 2: 확인 필요				
				if (result.length == 0) {	// 조회 값이 없는 경우 
					need_confirm = 2;
				}
			
				var insertDataObj = {
						id : user.id,
						name : user.name,
						department : user.dept_name,
						type : data.type,
						ip_pc : data.ip_pc,
						ip_office : data.ip_office,
						need_confirm : need_confirm,
						char_date : Moment().format("YYYY-MM-DD HH:mm:ss")
				};
				
				RawDataDao.insertRawDataCompanyAccess(insertDataObj).then(function(inResult) {
					resolve({dbResult : inResult, data : insertDataObj});
	    		}).catch(function(e){
	                reject(e);
	            });
				
			});
		});
	}
	
	return {
		setAccess : _setAccess
	}
} 

module.exports = new CompanyAccess();