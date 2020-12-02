var express = require('express');
var _ = require("underscore"); 
var fs = require('fs');
var path = require("path");

var sessionManager = require('../lib/sessionManager');
var apiManager = require('../lib/apiManager');
var Session = require('../service/Session');
var debug = require('debug')('sessionRouter');
var router = express.Router();
var User = require('../service/User.js');
// var encryptor = require('../lib/encryptor.js');
var suid =  require('rand-token').suid;
var _baseURL="http://210.220.205.57";

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var mailDefaultOptions = {
    from: 'webmaster@yescnc.co.kr', // sender address 
    //to: 'novles@yescnc.co.kr',
    // subject: 'Hello', // Subject line 
    // text: 'Hello world', // plaintext body 
    // html: '<b>Hello world </b>' // html body 
};
var transport = nodemailer.createTransport(smtpTransport({
    host: 'webmail.yescnc.co.kr',
    port: 25,
    auth: {
        user: 'webmaster@yescnc.co.kr',
        pass: '121512yes'
    },
    connectionTimeout:10000
}));


var sessionResponse=function(req, res, session){
    if (_.isUndefined(session)||_.isNull(session)){
        res.send(new Session({isLogin:false, id:req.session.id}));
    } else {
        res.send(session);
    }
};
router.route('/')
.post(function(req, res){//만들기.
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
})
.put(function(req, res){//login 부분 
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
                debug("find user zero.");
                msg="DO_NOT_FOUND_USER";
                session=new Session({isLogin:false, id:req.session.id,msg:msg});
            } else {
                var resultUser= new User(result[0]);
                debug(resultUser.get("password"));
                if (_.isEmpty(resultUser.get("password"))||_.isNull(resultUser.get("password"))){ //password 초기화 안된경우 
                    debug("not init password");
                    msg="INIT_PASSWORD";
                    session=new Session({isLogin:false, id:req.session.id, msg:msg, initPassword:true, user:{id:resultUser.get("id")}});
                } else {
                    if (user.get("password")==resultUser.get("password")){
                        debug("login success");
                        
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
                        debug("not equle password.");
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
    sessionManager.remove(req.cookies.saram);
    req.session.destroy(function(){
        
    });
    res.clearCookie("saram");
    res.send({});
});



router.route('/findPassword')
.put(function(req, res){//만들기.
    var user = new User(req.body.user);
    user.findPassword().then(function(result){
        fs.readFileAsync(path.dirname(module.parent.filename) + "/views/requetInitPassword.html","utf8").then(function (html) {
             //html read
                var accessToken=apiManager.newToken();
                var temp=_.template(html);
                var data={
                    name:result.name,
                    token:accessToken,
                    id:result.id,
                    baseURL:_baseURL
                };
                var sendHTML=temp(data);
                var mailOptions=_.defaults(mailDefaultOptions, {
                    to:result.email,
                    subject:"Yescnc 근태관리 시스템(비밀번호 초기화 요청 페이지)",
                    html:sendHTML,
					text:""
                });
                var accessAPI={
                    token:accessToken,
                    url:"/session/resetPassword",
                    user:result
                };
                apiManager.add(accessAPI);
                
                transport.sendMail(mailOptions, function(error, info){
                    if(error){//메일 보내기 실패시 
                        
                        debug(error);
                        apiManager.remove(accessAPI);
                        
                        res.status(500);
                        res.send({
                            success:false,
                            message: "ERROR_FIND_PASSWORD_SEND_MAIL",
                            error:error
                        });
                    }else{
                        res.send({success:true, message:"SUCCESS_REQUEST_FIND_PASSWORD"});
                    }
                });
        
        }).catch(SyntaxError, function (e) {
            debug("file contains invalid file");
        }).error(function (e) {
            debug(e);
                //throw new Error(err);
                res.status(500);
                res.send({
                    success:false,
                    message:"ERROR_FIND_PASSWORD_SEND_MAIL",
                    error:e
                });
        });
    }).catch(function(e){
        debug("Exception:" + e);;
        res.status(500);
        res.send({
            success:false,
            message: e.message,
            error:e
        });
    });
});

router.route('/resetPassword')
.get(function(req, res){
    var params=req.query;
    var accessAPI=apiManager.get(params.t);
    if (!accessAPI.isValid){
        res.send(res.render("apiError",{baseURL:_baseURL, message:accessAPI.message}));
    } else {
        apiManager.remove(accessAPI);
        var user = accessAPI.user;
        fs.readFile(path.dirname(module.parent.filename) + '/views/successInitPassword.html', 'utf8', function(err, html){
            if(err){
                debug(err);
                res.send(res.render("apiError",{baseURL:_baseURL, message:"서버 오류 발생 관리자에게 문의해주세요."}));
            }else{
                //html read
                var temp=_.template(html);
                var data={
                    name:user.name,
                    baseURL:_baseURL
                };
                var _user = new User({id:user.id, password:""},true);
                _user.initPassword().then(function(){
                    var sendHTML=temp(data);
                    res.send(sendHTML);
                }).catch(function(e){
                    debug("Exception:" + e);
                    res.send(res.render("apiError",{baseURL:_baseURL, message:"서버 오류 발생 관리자에게 문의해주세요."}));
                });
            }
        });
    }
});
module.exports = router;
