var express = require('express');
var debug = require('debug')('commentRouter');
var router = express.Router();
var Comment = require('../service/Comment.js');
var sessionManager = require('../lib/sessionManager');

router.route('/')
.get(function(req, res, next){
	var adminString=sessionManager.getAdminString(req.cookies.saram);
	var query = req.query;
	debug("Comment adminString = "+adminString);
	debug("Comment query.managerId = "+query.managerId);
	debug("Comment query.onlySubmit = "+query["onlySubmit"]);
	debug("Comment query.id = "+query.id);
	if (adminString === '%' && query.managerId !== undefined) {
		Comment.getCommentCountToManager(query.managerId).then(function(result) {
			return res.send(result);
		}).catch(function(err) {
			next(err);
		});
	} else if (query["onlySubmit"] != undefined && query["onlySubmit"] === "true") {
    // request(결재자) 대상 기준으로 상신 건만 조회하여 전달 함.
    Comment.getCommentById(sessionManager.get(req.cookies.saram).user.id).then(function(result) {
			return res.send(result);
		}).catch(function(err) {
			next(err);
		});
  
  } else if (adminString === '%' && query.id !== undefined) {
    Comment.getComment(query, query.id).then(function(result) {
			return res.send(result);
		}).catch(function(err) {
			next(err);
		});
	} else {
		Comment.getComment(query, adminString).then(function(result) {
			return res.send(result);
		}).catch(function(err) {
			next(err);
		});
		
	}
}).post(function(req, res, next) {
	
	var session = sessionManager.get(req.cookies.saram);
	var data = req.body;
	data.writer_id = session.user.id;	// 코멘트 작성자 ID
	debug("INSERT COMMENT")
	debug(JSON.stringify(data))
	Comment.insertComment(data).then(function(result) {
		res.send(result);
		Comment.sendCommentEmail(data).then(function(){
            debug("Send Email"); 
        }).catch(function(e){
            debug("Fail to Send Email");
        });
	}).catch(function(err) {
		next(err);
	});
});


router.route('/:id')
.get(function(req, res){	
	
}).put(function(req, res, next){
	
	var session = sessionManager.get(req.cookies.saram);
	var data = req.body;
	data.reply_id = session.user.id;	// 코멘트 작성자 ID	
	
	Comment.updateCommentReply(data).then(function(result) {
		res.send(result);
		Comment.sendCommentEmail(data).then(function(){
            debug("Send Email"); 
        }).catch(function(e){
            debug("Fail to Send Email");
        });
	}).catch(function(err) {
		next(err);
	});

});

module.exports = router;
