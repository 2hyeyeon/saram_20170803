define([
    'jquery',
    'underscore',
    'backbone',
    'animator',
    'core/BaseView',
    'dialog',
    'comboBox',
    'cmoment',
    'resulttimefactory',
    // 'text!templates/report/addReportTemplate.html',
    'text!templates/report/detailReportTemplete.html',
    'collection/rm/ApprovalCollection',
    'collection/vacation/OutOfficeCollection',
    'collection/vacation/InOfficeCollection',
    'collection/common/HolidayCollection',
    'models/rm/ApprovalModel',
    'models/vacation/OutOfficeModel',
    'models/vacation/InOfficeModel',
], function($, _, Backbone, animator, BaseView, Dialog, ComboBox, Moment, ResultTimeFactoy, addReportTmp,
    ApprovalCollection, OutOfficeCollection, InOfficeCollection, HolidayCollection, ApprovalModel, OutOfficeModel, InOfficeModel
) {
    
    var approvalReportView = BaseView.extend({
        options: {},

        events: {},

        initialize: function() {
            this.collection = new ApprovalCollection();

            $(this.el).html();
            $(this.el).empty();

            _.bindAll(this, "onClickBtnSend");
        },

        render: function(el) {
            var dfd = new $.Deferred();
            var _this = this;
            if (!_.isUndefined(el)) {
                this.el = el;
            }
            this.setHolidayInfos().then(function(){
                $(_this.el).append(addReportTmp);

                // title setting
                _this.setTitleTxt();
                // default display setting
                _this.setAddReportDisplay(_this.options);
                dfd.resolve();    
            });
            

            return dfd.promise();
        },

        setTitleTxt: function() {
            // small title 
            var smallTitleTxt = $(this.el).find('#smallTitleTxt');
            smallTitleTxt.empty();
            smallTitleTxt.text('결재');

            return this;
        },

        setAddReportDisplay: function(param) {
            // table Setting
            this.setTableDisplay();
            // select box data setting
            this.setDataDefaultValues(param);
            // display setting
            this.setDefaultDisplay();
        },

        setTableDisplay: function() {
            var tableTr = $(this.el).find('.apployReportNone');
            tableTr.css('display', 'none');
        },
        setDefaultDisplay: function() {

            var disableValues = ['submit_id', 'start_date', 'end_date', 'office_code', 'submit_comment', 'manager_id'];

            for (var dvI = 0; dvI < disableValues.length; dvI++) {
                $(this.el).find('#' + disableValues[dvI]).attr('readonly', true);
                $(this.el).find('#' + disableValues[dvI]).attr('disabled', true);
            }

            $(this.el).find('#start_date input').attr('readonly', true);
            $(this.el).find('#end_date input').attr('readonly', true);

            $(this.el).find('#start_date input').attr('disabled', true);
            $(this.el).find('#end_date input').attr('disabled', true);

            $(this.el).find('#start_time input').attr('readonly', true);
            $(this.el).find('#end_time input').attr('readonly', true);

            $(this.el).find('#start_time input').attr('disabled', true);
            $(this.el).find('#end_time input').attr('disabled', true);

            // 결재구분 :  
            var selGubun = $(this.el).find('#state');

            var arrGubunData = [];
            if (this.options.state == '취소요청') {
                arrGubunData.push({
                    'code': '취소완료',
                    'name': '취소승인'
                });
                arrGubunData.push({
                    'code': '취소반려',
                    'name': '반려'
                });
            }
            else {
                arrGubunData.push({
                    'code': '결재완료',
                    'name': '결재'
                });
                arrGubunData.push({
                    'code': '반려',
                    'name': '반려'
                });
            }
            
            arrGubunData.push({
                'code': '보류',
                'name': '보류'
            });

            // option setting
            for (var index = 0; index < arrGubunData.length; index++) {
                var optionHtml = "<option value='" + arrGubunData[index].code + "'>" + arrGubunData[index].name + "</option>";
                selGubun.append(optionHtml);
            }

            ComboBox.createCombo(selGubun);
        },

        setDataDefaultValues: function(param) {
            var _this = $(this.el);
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
            
            if (param != undefined) {
                _this.find('#submit_id').html(param.submit_name);
                _this.find('#office_code').html(param.office_code_name);

                _this.find('#start_date').html(param.start_date);
                var endDateVal = (param.end_date)? "&nbsp; ~ &nbsp;" + param.end_date : "";
                _this.find('#end_date').html(endDateVal);

                _this.find('#start_time').html(param.start_time);
                var endTimeVal = (param.end_time)? "&nbsp; ~ &nbsp;" + param.end_time : "";
                _this.find('#end_time').html(endTimeVal);

                if(param.office_code == "O01"){
                    var splitArr = param.submit_comment.split(",");
                    var except = parseInt(splitArr[0],10);
                    var overTime = parseInt(splitArr[1],10);
                    var startTime = _.isUndefined(splitArr[2]) ? "" : splitArr[2];
                    var endTime = _.isUndefined(splitArr[3]) ? "" : splitArr[3];
                    var comment = _.isUndefined(splitArr[4]) ? "" : splitArr[4].replace(/<comma>/gi, ',');
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
                    var msg = "출근시간 : "+ startTime + ", 퇴근시간: "+endTime+"\n초과시간 : "+timeformat(overTime)+", 제외시간 : "+timeformat(except)+"\n확정시간 : "+timeformat(calc)+", 근무타입 : " + type + "\n사유 : " + comment;
                    _this.find('#submit_comment').val(msg);
                }else{
                    _this.find('#submit_comment').val(param.submit_comment);
                }
                if (param.decide_comment != null && param.decide_comment != "") {
                    _this.find('#decide_comment').val(param.decide_comment);
                }
                _this.find('#manager_id').html("<option>" + param.manager_name + "</option>");
                _this.find('#state').val(param.state);

                var usable = (param.total_day > param.used_holiday) ? param.total_day - param.used_holiday : 0;
                _this.find('#usableHoliday').html(usable + " 일");

                var holReq = "0";
                switch(param.office_code){
                    case "O01": // 휴일근무
                        holReq = "0";
                        $(this.el).find("#reqHolidayCon").hide(); 
                        $(this.el).find('#end_date').hide();
                        $(this.el).find('#outsideOfficeTimeCon').hide();

                        $(this.el).find('#outsideOfficeTimeCon').prev().removeClass('col-sm-6');
                        $(this.el).find('#outsideOfficeTimeCon').prev().addClass('col-sm-10');
                        break;
                    case "B01": 
                        holReq = "0";
                        $(this.el).find("#reqHolidayCon").hide(); 
                        $(this.el).find('#end_date').hide();
                        $(this.el).find('#outsideOfficeTimeCon').hide();

                        $(this.el).find('#outsideOfficeTimeCon').prev().removeClass('col-sm-6');
                        $(this.el).find('#outsideOfficeTimeCon').prev().addClass('col-sm-10');
                        break;
                    case "V02" : case "V03" : case "V07" : case "V08" : // 반차
                        holReq = "0.5";
                        $(this.el).find('#end_date').hide();
                        $(this.el).find('#outsideOfficeTimeCon').hide();
                        $(this.el).find('#outsideOfficeTimeCon').prev().removeClass('col-sm-6');
                        $(this.el).find('#outsideOfficeTimeCon').prev().addClass('col-sm-10');
                        break;
                    case "W01" : // 외근
                        holReq = "0";
                        $(this.el).find('#end_date').hide();
                        $(this.el).find('#outsideOfficeTimeCon').show();
                        break;
                    default :
                        var arrInsertDate;
                        if (param.office_code == "W03" || param.office_code == "W02") {
                            arrInsertDate = this.getDatePariod(true);
                        }else {
                            arrInsertDate = this.getDatePariod(false);
                        }
                        holReq = arrInsertDate.length + "";
                        $(this.el).find('#end_date').css('display', 'table');
                        $(this.el).find('#outsideOfficeTimeCon').css('display', 'none');
                        $(this.el).find('#outsideOfficeTimeCon').prev().removeClass('col-sm-6');
                        $(this.el).find('#outsideOfficeTimeCon').prev().addClass('col-sm-10');
                        break;
                }
                
                _this.find('#reqHoliday').html(holReq + " 일");

                // 휴일 근무, 외근, 출장, 장기외근 - 잔여 연차 일수 감추기 
                var hideHoliday = ['B01', 'W01', 'W02', 'W03', 'W04', 'O01'];
                if (_.indexOf(hideHoliday, param.office_code) > -1 || _.isUndefined(param.total_day)) {
                    $(this.el).find('#usableHolidayCon').hide();
                }
                else {
                    $(this.el).find('#usableHolidayCon').show();
                }
            }
        },

        setBottomButtonCon: function() {
            var bottomBtnCon = $(this.el).find('#bottomBtnCon');
            bottomBtnCon.css('float', 'right');
            bottomBtnCon.empty();

            // 확인 Button
            var addReportBtn = $('<button class="btn btn-default">확인</button>');
            addReportBtn.attr('id', 'btnConfirmReport');
            bottomBtnCon.append(addReportBtn);

            return this;
        },

        getFormData: function(form) {
            // input value
            var unindexed_array = form.serializeArray();
            var indexed_array = {};

            $.map(unindexed_array, function(n, i) {
                indexed_array[n['name']] = n['value'];
            });

            indexed_array["doc_num"] = this.options["doc_num"];
            
            return _.extend(this.options,indexed_array);
        },

        getChangeFormData: function(sendData) {
            var arrData = this.options;
            arrData["decide_comment"] = sendData["decide_comment"];
            arrData["state"] = sendData["state"];
            arrData["decide_date"] = new Date();
            return arrData;
        },

        onClickBtnSend: function(evt) {
            var dfd = new $.Deferred();
            var _this = this;
            var formData = this.getFormData($(this.el).find('form'));

            var _approvalCollection = new ApprovalCollection(formData);

            var promiseArr = [];
            var outOfficeArr = ["B01", "O01"];
            if (formData.state == '결재완료') {
                if (_.indexOf(outOfficeArr, this.options.office_code) > -1) { // 휴일 근무
                    promiseArr.push(this.addInOfficeData(_approvalCollection));
                }
                else { // 외근 / 휴가 등등
                    promiseArr.push(this.addOutOfficeData(_approvalCollection));
                }
            }
            else if (formData.state == '취소완료') {
                if (_.indexOf(outOfficeArr, this.options.office_code) > -1) { // 휴일 근무
                    promiseArr.push(this.delInOfficeData(_approvalCollection, this.options["doc_num"]));
                }
                else { // 외근 / 휴가 등등
                    promiseArr.push(this.delOutOfficeData(_approvalCollection, this.options["doc_num"]));
                }
            }else {
                promiseArr.push(this.updateApprovalData(_approvalCollection));
            }

            $.when.apply($, promiseArr).then(function() {
                var resultModel = new ApprovalModel(_this.options);
                resultModel.set({
                    state: _approvalCollection.models[0].get("state")
                });
                resultModel.set({
                    decide_date: new Date()
                });

                dfd.resolve(resultModel.attributes);
            }, function() {
                dfd.reject();
            });
            return dfd.promise();
        },

        delOutOfficeData: function(_approvalCollection, docNum) {
            var dfd = new $.Deferred();
            var userId = this.options["submit_id"];
            var arrInsertDate;

            if (this.options["office_code"] == "W03" || this.options["office_code"] == "W02") {
                arrInsertDate = this.getDatePariod(true);
            }
            else {
                arrInsertDate = this.getDatePariod(false);
            }

            var resultData = {};
            resultData.approval = _approvalCollection.toJSON();

            var outOfficeCollection = new OutOfficeCollection();

            outOfficeCollection.fetch({
                data: {
                    start: arrInsertDate[0],
                    end: arrInsertDate[arrInsertDate.length - 1]
                },
                success: function(result) {
                    var filterCollection = new OutOfficeCollection();
                    for (var key in result.models) {
                        if (result.models[key].get("doc_num") !== docNum) {
                            if (result.models[key].get("id") == userId) {
                                filterCollection.add(result.models[key]);
                            }
                        }
                    }

                    var results = []; // commuteResult;
                    var promiseArr = [];
                    $.each(arrInsertDate, function(key) {
                        var today = arrInsertDate[key];
                        var todayOutOfficeModels = filterCollection.where({
                            date: today
                        });
                        var resultTimeFactory = ResultTimeFactoy.Builder();
                        promiseArr.push(
                            resultTimeFactory.modifyByInOutOfficeType(arrInsertDate[key], userId, "out", todayOutOfficeModels).done(function(result) {
                                results.push(result);
                            }).fail(function() {
                                /// 수정할 내용 없음
                            })
                        );
                    });

                    $.when.apply($, promiseArr).always(function() {
                        results = _.compact(results);
                        if (results.length > 0) {
                            resultData.commute = results;
                        }
                        outOfficeCollection.save(resultData, docNum).done(function() {
                            dfd.resolve(resultData);
                        });
                    });
                },
            });
            return dfd.promise();
        },

        delInOfficeData: function(_approvalCollection, docNum) {
            var dfd = new $.Deferred();
            var userId = this.options["submit_id"];
            var arrInsertDate = [$(this.el).find('#start_date').html()];
            var resultData = {};
            resultData.approval = _approvalCollection.toJSON();

            var inOfficeCollection = new InOfficeCollection();

            inOfficeCollection.fetch({
                data: {
                    start: arrInsertDate[0],
                    end: arrInsertDate[arrInsertDate.length - 1]
                },
                success: function(result) {
                    var filterCollection = new InOfficeCollection();
                    for (var key in result.models) {
                        if (result.models[key].get("doc_num") !== docNum) {
                            if (result.models[key].get("id") == userId) {
                                filterCollection.add(result.models[key]);
                            }
                        }
                    }

                    var results = []; // commuteResult;
                    var promiseArr = [];
                    $.each(arrInsertDate, function(key) {
                        var today = arrInsertDate[key];
                        var todayInOfficeModels = filterCollection.where({
                            date: today
                        });
                        var resultTimeFactory = ResultTimeFactoy.Builder()
                        promiseArr.push(
                            resultTimeFactory.modifyByInOutOfficeType(arrInsertDate[key], userId, "in", todayInOfficeModels).done(function(result) {
                                results.push(result);
                            }).fail(function() {
                                /// 수정할 내용 없음
                            })
                        );
                    });

                    $.when.apply($, promiseArr).always(function() {
                        results = _.compact(results);
                        if (results.length > 0) {
                            resultData.commute = results;
                        }
                        inOfficeCollection.save(resultData, docNum).done(function() {
                            dfd.resolve(resultData);
                        });
                    });
                },
            });
            return dfd.promise();
        },

        addOutOfficeData: function(_approvalCollection) {
            var dfd = new $.Deferred();
            var arrInsertDate;
            if (this.options["office_code"] == "W03" || this.options["office_code"] == "W02") {
                arrInsertDate = this.getDatePariod(true);
            }
            else {
                arrInsertDate = this.getDatePariod(false);
            }

            var resultData = {};
            // data 저장
            resultData.outOffice = this.getFormData($(this.el).find('form'));
            resultData.outOffice["arrInsertDate"] = arrInsertDate; // insert 에 필요한 데이터 저장
            resultData.outOffice["id"] = this.options["submit_id"];
            resultData.outOffice["doc_num"] = this.options["doc_num"];
            resultData.outOffice["memo"] = this.options["submit_comment"];
            resultData.outOffice["office_code"] = this.options["office_code"];
            resultData.outOffice["start_time"] = this.options["start_time"];
            resultData.outOffice["end_time"] = this.options["end_time"];
            
            var outOfficeCollection = new OutOfficeCollection();
            
            outOfficeCollection.fetch({
                data: {
                    start: arrInsertDate[0],
                    end: arrInsertDate[arrInsertDate.length - 1]
                },
                success: function(result) {
                	var results = [];
                    var promiseArr = [];
                    
                    var filterCollection = new OutOfficeCollection();
                    for (var key in result.models) {
                        filterCollection.add(result.models[key]);
                    }
                    
                    $.each(arrInsertDate, function(key) {
                        var resultTimeFactory = ResultTimeFactoy.Builder();
                        var outOffice = _.clone(resultData.outOffice);
                        var today = arrInsertDate[key];
                        
                        outOffice["date"] = today;
                        filterCollection.add(outOffice);
                        
                        var todayOutOfficeModels = filterCollection.where({
                            date: today,
                            id:resultData.outOffice.id
                        });
                        
                        promiseArr.push(
                            resultTimeFactory.modifyByInOutOfficeType(arrInsertDate[key], resultData.outOffice.id, "out", todayOutOfficeModels).done(function(result) {
                                results.push(result);
                            }).fail(function() {
                                /// 수정할 내용 없음
                            })
                        );
                    });

                    $.when.apply($, promiseArr).always(function() {
                        results = _.compact(results);
                        if (results.length > 0) {
                            resultData.commute = results;
                        }
                        _approvalCollection.save(resultData, resultData.outOffice.doc_num).done(function() {
                            dfd.resolve(resultData);
                        }).fail(function() {
                            dfd.reject();
                        });
                    });
                },
            });
            
            

            return dfd.promise();
        },

        addInOfficeData: function(_approvalCollection) {
            var dfd = new $.Deferred();


            // 날짜 개수 이용하여 날짜 구하기
            var sStart = $(this.el).find('#start_date').html();
            var arrInsertDate = [];
            arrInsertDate.push(sStart);

            var resultData = {};

            // data 저장
            resultData.inOffice = this.getFormData($(this.el).find('form'));
            resultData.inOffice["arrInsertDate"] = arrInsertDate; // insert 에 필요한 데이터 저장
            resultData.inOffice["id"] = this.options["submit_id"];
            resultData.inOffice["doc_num"] = this.options["doc_num"];
            if(this.options.office_code == "O01"){
                var splitArr = this.options.submit_comment.split(",");
                var except = parseInt(splitArr[0],10);
                resultData.inOffice["except"] = except;
            }
            
            var results = [];
            var promiseArr = [];

            $.each(arrInsertDate, function(key) {
                var resultTimeFactory = ResultTimeFactoy.Builder();
                promiseArr.push(
                    resultTimeFactory.modifyByInOutOfficeType(arrInsertDate[key], resultData.inOffice.id, "in", resultData.inOffice).done(function(result) {
                        results.push(result);
                    })
                );
            });

            $.when.apply($, promiseArr).always(function() {
                results = _.compact(results);
                if (results.length > 0) {
                    resultData.commute = results;
                }
                _approvalCollection.save(resultData, resultData.inOffice.doc_num).done(function() {
                    dfd.resolve(resultData);
                }).fail(function() {
                    dfd.reject();
                });
            });

            return dfd.promise();
        },

        updateApprovalData: function(_approvalCollection) {
            var dfd = new $.Deferred();
            var resultData = this.getFormData($(this.el).find('form'));
            _approvalCollection.save(resultData, resultData.doc_num).done(function() {
                dfd.resolve(resultData);
            }).fail(function() {
                dfd.reject();
            });

            return dfd.promise();
        },
        getDatePariod: function(getHoliday) {
            // 날짜 개수 이용하여 날짜 구하기
            var sStart = $(this.el).find('#start_date').html();
            var sEnd = $(this.el).find('#end_date').html();
            sEnd = sEnd.replace('&nbsp; ~ &nbsp;', '');
            var start = new Date(sStart.substr(0, 4), sStart.substr(5, 2) - 1, sStart.substr(8, 2));
            var end = new Date(sEnd.substr(0, 4), sEnd.substr(5, 2) - 1, sEnd.substr(8, 2));
            var day = 1000 * 60 * 60 * 24;

            var compareVal = parseInt((end - start) / day);
            var arrInsertDate = [];
            var holidayInfos = this.options.holidayInfos;
            if (compareVal > 0) {
                // 차이
                for (var i = 0; i <= compareVal; i++) {
                    var dt = start.valueOf() + (i * day);
                    var resDate = new Date(dt);
                    if ((resDate.getDay() != 0 && resDate.getDay() != 6) || getHoliday) {
                        // 주말이 아닌 날짜
                        var isPush = true;
                        for (var j = 0; j < holidayInfos.length; j++) {
                            var sDate = this.getDateFormat(resDate);
                            if (holidayInfos[j].date == sDate) {
                                isPush = false;
                                break;
                            }
                        }
                        if (isPush) {
                            arrInsertDate.push(sDate);
                        }
                    }
                }

            }
            else {
                if (start.getDay() != 0 && start.getDay() != 6) {
                    // 주말이 아닌 날짜
                    for (var k = 0; k < holidayInfos.length; k++) {
                        if (holidayInfos[k].date != sStart) {
                            arrInsertDate.push(sStart);
                            break;
                        }
                    }
                }
            }

            return arrInsertDate;
        },

        getDateFormat: function(dateData) {
            var sDateFormat = "";
            if (dateData == null) {
                sDateFormat = "";
            }
            else {
                sDateFormat
                    = dateData.getFullYear() + "-" + this.getzFormat(dateData.getMonth() + 1, 2) + "-" + this.getzFormat(dateData.getDate(), 2);
            }
            return sDateFormat;
        },

        getzFormat: function(s, len) {
            var sZero = "";
            s = s + "";
            if (s.length < len) {
                for (var i = 0; i < (len - s.length); i++) {
                    sZero += "0";
                }
            }
            return sZero + s;
        },
        
        setHolidayInfos: function() {
            var dfd = new $.Deferred();
            var _this = this;
            var today = new Date(_this.options.start_date);
            var sYear = today.getFullYear() + "";

            var _holiColl = new HolidayCollection();
            _holiColl.fetch({
                data: {
                    year: sYear
                },
                error: function(result) {
                    Dialog.error("데이터 조회가 실패했습니다.");
                }
            }).done(function(result) {
                if (result.length > 0) {
                    _this.options.holidayInfos = result;
                }
                else {
                    _this.options.holidayInfos = [];
                }
                dfd.resolve();
            });
            return dfd.promise();
        },

    });
    return approvalReportView;
});