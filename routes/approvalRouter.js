// Author: sanghee park <novles@naver.com>
// Create Date: 2014.12.18
var express = require('express');
var debug = require('debug')('approvalRouter');
var router = express.Router();
var _ = require("underscore"); 
var Approval = require('../service/Approval.js');
var sessionManager = require('../lib/sessionManager');

router.route('/list')
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
        var adminString=sessionManager.getAdminString(req.cookies.saram);
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

router.route('/appIndex')
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

router.route('/info')
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

router.route('/appIndex/add')
.post(function(req, res){
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

router.route('/')
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

router.route('/bulk')
.put(function(req, res) {
    var approval = new Approval();
    var id = req.body._id;
    console.log(id);
    if(id == "updateState"){
        approval.updateApprovalState(req.body.data).then(function(e){
            debug("Complete Update Approval State."); 
            res.send({success:true, msg:"Complete Update Approval."});
        }).catch(function(e){
            debug("Error Update Approval State.");
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
            debug("Complete Update Approval Confirm."); 
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
            debug("Error Update Approval Confirm.");
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

module.exports = router;
