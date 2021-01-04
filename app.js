//lib config
var express = require('express');
var express_session= require("express-session");
var _= require("underscore");  
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var url = require("url");
var multer = require("multer");
var util = require("util");

var schedule = require('node-schedule');

//lib router config
// test
var sessionManager = require('./lib/sessionManager');
var index = require('./routes/index');
var user = require('./routes/userRouter');
var session = require('./routes/sessionRouter');
var rawData = require('./routes/rawDataRouter');
var holiday = require('./routes/holidayRouter');
var vacation = require('./routes/vacationRouter');
var approval = require('./routes/approvalRouter');
var code = require('./routes/codeRouter');
var commute = require('./routes/commuteRouter');
var changeHistory = require('./routes/changeHistoryRouter');
var outOffice = require('./routes/outofficeRouter');
var inOffice = require('./routes/inofficeRouter');
var comment = require('./routes/commentRouter');
var companyAccess = require('./routes/companyAccessRouter');
var dashboard = require('./routes/dashboardRouter');
var report = require('./routes/reportRouter');
var message = require('./routes/messageRouter');
var cleanDay = require('./routes/cleanDayRouter');
var userPic = require('./routes/userPicRouter');
var documentlist = require('./routes/documentRouter');
var bookdocument = require('./routes/bookdocumentRouter');
var department = require('./routes/departmentRouter');
var part = require('./routes/partRouter');
var position = require('./routes/positionRouter');
var room = require("./routes/roomRouter");
var roomReg = require("./routes/roomRegRouter");
var gisRouter = require("./routes/gisRouter");
var restful = require("./routes/restfulRouter");
var statisticsRouter = require("./routes/statisticsRouter");
var IpAssignedManager = require("./routes/IpAssignedManagerRouter");
var officeItemUsage = require('./routes/officeItemUsageRouter');
var officeItemCode = require('./routes/officeItemCodeRouter');
var officeitem = require("./routes/officeitemRouter");
var officeItemHistory = require('./routes/officeItemHistoryRouter');
var bookLibrary = require("./routes/bookLibraryRouter");
var yesCalendar = require("./routes/yesCalendarRouter");
var yesCalendarType = require("./routes/yesCalendarTypeRouter");
var mobile = require("./routes/mobileRouter");

var debug = require('debug')('APP');
var app = express();
var filePath1 = path.normalize(__dirname + '/pic/files'); 
var filePath2 = path.normalize(__dirname + '/public/doc'); 
var filePath3 = path.normalize(__dirname + '/public/book'); 

var tokenList = ["c9454ee0-9965-11e9-b475-0800200c9a66"];
//var Statistics = require('./service/Statistics');
//var statisticsService = new Statistics();

var RoomReg = require('./service/RoomReg.js');
var BookLibrary = require('./service/BookLibrary.js');

// 스케쥴 등록
schedule.scheduleJob('*/10 * * * *', function() {
  debug("RUN schedule for ROOM REG!!!");
  RoomReg.sendEmailRoomReg();
});

schedule.scheduleJob('5 10 * * *', function() {
  debug("RUN schedule for BOOK DUE DATE!!!");
  BookLibrary.sendEmailRentOverDueDate();
});

var mwMulter1 = multer({ dest: filePath1 , rename:function(fieldname, filename, req,res){
	  console.log(filename);
	  return filename;
	} });
app.post('/userpic', mwMulter1, function(req, res) {
    // check req.files for your files
	console.log('IN POST (/userpic)');
    console.log(req.body)

    var filesUploaded = 0;

    if ( Object.keys(req.files).length === 0 ) {
        console.log('no files uploaded');
    } else {
        console.log(req.files)

        var files = req.files.file1;
        if (!util.isArray(req.files.file1)) {
            files = [ req.files.file1 ];
        } 

        filesUploaded = files.length;
    }

    res.json({ message: 'Finished! Uploaded ' + filesUploaded + ' files.  Route is /userpic' });
});

var mwMulter2 = multer({ dest: filePath2 , rename:function(fieldname, filename, req,res){
  console.log(filename);
  return filename;
} });
app.post('/documentlist', mwMulter2, function(req, res) {
    // check req.files for your files
	console.log('IN POST (/documentlist)');
    console.log(req.body)

    var filesUploaded = 0;

    if ( Object.keys(req.files).length === 0 ) {
        console.log('no files uploaded');
    } else {
        console.log(req.files)

        var files = req.files.file1;
        if (!util.isArray(req.files.file1)) {
            files = [ req.files.file1 ];
        } 

        filesUploaded = files.length;
    }

    res.json({ message: 'Finished! Uploaded ' + filesUploaded + ' files.  Route is /document' });

});

var mwMulter3 = multer({ dest: filePath3 , rename:function(fieldname, filename, req,res){
	  console.log(filename);
	  return filename;
	} });
app.post('/bookdocument', mwMulter3, function(req, res) {
  // check req.files for your files
	console.log('IN POST (/bookdocument)');
  console.log(req.body)

  var filesUploaded = 0;

  if ( Object.keys(req.files).length === 0 ) {
      console.log('no files uploaded');
  } else {
      console.log(req.files)

      var files = req.files.file1;
      if (!util.isArray(req.files.file1)) {
          files = [ req.files.file1 ];
      } 

      filesUploaded = files.length;
  }

  res.json({ message: 'Finished! Uploaded ' + filesUploaded + ' files.  Route is /bookdocument' });
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');


app.use(bodyParser.urlencoded({limit: '80mb', extended: true}));
app.use(bodyParser.json({limit: '80mb'}));
// app.use(bodyParser({limit : '80mb'}));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express_session({
    secret:"express-saram",
    //store : sessionStore,
    resave : true,
    saveUninitialized:true
}));
//app.use(multer({
//    dest:filePath,
//    rename:function(fieldname, filename, req,res){
//        console.log(filename);
//        return filename;
//    }
//}));  test

var authError=function(next){
    var err = new Error('not Authoryty');
    err.status = 401;
    next(err);
};

app.use(logger('dev'));

// //근태서버 다운
// app.use(function(req,res,next){
    
// });

app.use('/mobile', mobile);

// if session hasn`t loginid, redirect login page
app.use(function(req,res,next){
    var passURLArr=["/session", "/session/findPassword", "/session/resetPassword", "/", "/message"];
    var pathname = url.parse(req.url).pathname;
    if(_.indexOf(passURLArr, pathname) > -1){
        next();
    }else if ( pathname.indexOf("/rest/") > -1 ) {
        console.log("REQ  ================> " + JSON.stringify(req.headers));
        if ( !_.isUndefined(req.headers.token) && _.indexOf(tokenList, req.headers.token) > -1 ) {
            next();
        }else{
            authError(next);
        }
        
    }else{
        if (req.cookies.saram) {//cookie가 있을 때.
            if (sessionManager.validationCookie(req.cookies.saram, res)){
                
//                try {
//                    statisticsService.updatePageUrlCount(pathname);
//                }catch(err) {
//                    debug(err);
//                }

                next();
                
            } else {//유효하지 않은 cookie 삭제.
                sessionManager.remove(req.cookies.saram);
                res.clearCookie("saram");
                authError(next);
            }
        } else {// 아예 세션 정보가 없을 때.
            authError(next);
        }
    }
});


// route link
app.use('/', index);
app.use('/user', user);
app.use('/session', session);
app.use('/rawdata', rawData);
app.use('/holiday', holiday);
app.use('/vacation', vacation);
app.use('/approval', approval);
app.use('/code', code);
app.use('/commute', commute);
app.use('/changeHistory', changeHistory);
app.use('/outOffice',outOffice);
app.use('/inOffice',inOffice);
app.use('/comment', comment);
app.use('/companyAccess', companyAccess);
app.use('/dashboard', dashboard);
app.use('/report', report);
app.use('/message', message);
app.use('/cleanDay', cleanDay);
app.use('/userpic', userPic);
app.use('/documentlist', documentlist); 
app.use('/bookdocument', bookdocument);
app.use('/department', department);
app.use('/part', part);
app.use('/position', position);
app.use('/room', room);
app.use('/roomreg', roomReg);
app.use('/gis', gisRouter);
app.use('/rest', restful);
app.use('/statistics', statisticsRouter);
app.use('/IpAssignedManager', IpAssignedManager);
app.use('/officeitemusage', officeItemUsage);
app.use('/officeitemcode', officeItemCode);
app.use('/officeitemmanager', officeitem);
app.use('/officeitemhistory', officeItemHistory);
app.use('/book', bookLibrary);
app.use('/yescalendar', yesCalendar);
app.use('/yescalendar-type', yesCalendarType);

// catch 404 and forward to error handler
app.use(function(err, req, res, next) {//위에 라우터에까지 안걸리면 404 처리 .
    if(_.isUndefined(err)){
        err = new Error('Invalid URL.');
        err.status = 404;
    }
    next(err);
});

app.use(function(err, req, res, next) {//최종적으로 에러 날리는곳 따로 에러 처리 안되고 쓰로우 되면 여기 탐.
    debug("###### ERROR!! (" + err.message + ")");
    debug(err);
    res.status(err.status || 500);
    res.send({
        message: err.message,
        success: false,
        err:err
    });
    // next();
});

module.exports = app;
