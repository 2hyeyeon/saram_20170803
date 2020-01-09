var express = require('express');
var _ = require('underscore');
var Promise = require('bluebird');
var debug = require('debug')('holidayRouter');
var router = express.Router();
var Holiday = require('../service/Holiday.js');


router.route('/period')
.get(function(req, res){
    var holiday = new Holiday();
    
    holiday.getHolidayListByPeriod(req.query.start, req.query.end).done(function(result){
        res.send(result);
    });
});

router.route('/')
.get(function(req, res){
    var holiday = new Holiday({year:req.query.year});
    
    holiday.getHolidayList().done(function(result){
        res.send(result);    
    });
    
}).post(function(req, res){
    // Insert user infomation (PUT)
    var holiday = new Holiday(req.body);
    var result = holiday.insertHoliday();
    
    if(_.isArray(result)){
        Promise.all(result).then(function(){
            res.send({msg : "Insert Data Success", count : result.length});        
        });
    }else{
        result.done(function(){
            res.send({msg : "Insert Data Success", count : 1});    
        })
    }
});

router.route('/bulk')
.post(function(req,res){
    var count = 0;
    for(var key in req.body){
        var holiday = new Holiday(req.body[key]);
        debug(req.body[key]);
        holiday.insertHoliday();
        count ++;
    }
    res.send({msg : "Insert Data Success", count : count});
})

router.route('/:date')
.delete(function(req,res){
    var holiday = new Holiday({date: req.params.date});
    
    holiday.deleteHoliday().then(function(){
        res.send({msg : "Delete Data Success", count: 1});    
    });
}).put(function(req, res){
    var holiday = new Holiday(req.body);
    debug("Insert Data Success By Manager. Date = "+req.body.date);
    holiday.insertHoliday();
    res.send({msg : "Insert Data Success By Manager", count : 1, date : req.body.date});
});



module.exports = router;
