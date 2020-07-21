define([
    'jquery',
    'underscore',
    'backbone',
    'animator',
    'core/BaseView',
    'dialog',
    'comboBox',
    'cmoment',
    'code',
    'resulttimefactory',
    'models/sm/SessionModel',
    'text!templates/report/allReportTemplate.html',
    'collection/vacation/VacationCollection',
    'collection/common/HolidayCollection',
    'collection/rm/ApprovalCollection',
    'collection/sm/UserCollection',
    'collection/vacation/OutOfficeCollection',
    'models/rm/ApprovalModel',
    'models/rm/ApprovalIndexModel',
    'collection/sm/DepartmentCollection',
], function($, _, Backbone, animator, BaseView, Dialog, ComboBox, Moment, Code, ResultTimeFactoy, SessionModel, addReportTmp, VacationCollection,
    HolidayCollection, ApprovalCollection, UserCollection, OutOfficeCollection, ApprovalModel, ApprovalIndexModel, DepartmentCollection) {
    var addallReportView = BaseView.extend({
        options: {
            holidayInfos: [],
            total_day: 0,
            used_holiday: 0,
            approval_count: 0,
        },
        events: {},

        initialize: function(option) {
            this.setuser = option.data;
            this.collection = new ApprovalCollection();
            $(this.el).html('');
            $(this.el).empty();
        },

        render: function(el) {
            var dfd = new $.Deferred();
            var _this = this;

            if (!_.isUndefined(el)) {
                this.el = el;
            }

            this.setUserData(new Date()).then(function() {
                $(_this.el).append(addReportTmp);
                _this.setAddReportDisplay();

                dfd.resolve();
            });

            return dfd.promise();
        },

        setAddReportDisplay: function() {
            // table Setting
            this.setTableDisplay();
            // datePicker setting
            this.setDatePickerPop();
            // select box data setting
            this.setSelectBoxData();
        },

        //신청자 명단 this.setuser
        setTableDisplay: function() {
            var submitMem = $(this.el).find('#submit_id');
            var submitOptionHtml = "";
            for (var i = 0; i < this.setuser.length; i++) {
                submitMem.append(submitOptionHtml);
                $(this.el).find("#submit_id").append(this.setuser[i].name + ", ");
            }
        },

        setDatePickerPop: function() {
            var _this = this;
            var beforeDate = $(this.el).find("#start_date");
            this.beforeDate = beforeDate.datetimepicker({
                todayBtn: "linked",
                pickTime: false,
                language: "ko",
                todayHighlight: true,
                format: "YYYY-MM-DD",
                autoclose: true,
                defaultDate: Moment(new Date()).format("YYYY-MM-DD")
            });

            var afterDate = $(this.el).find("#end_date");
            this.afterDate = afterDate.datetimepicker({
                todayBtn: "linked",
                pickTime: false,
                language: "ko",
                todayHighlight: true,
                format: "YYYY-MM-DD",
                autoclose: true,
                defaultDate: Moment(new Date()).format("YYYY-MM-DD")
            });

            this.beforeDate.change(function(val) {
                var startDate = $(_this.el).find('#start_date input').val();
                var date = new Date(startDate);
                _this.setUserData(date).then(function() {
                    _this.setTableDisplay();
                    if (startDate.length > 8) {
                        var selGubun = $(_this.el).find('#office_code');
                        var selVal = selGubun.val();
                        if (selVal == 'W01') {
                            // 외근
                            _this.holReq = 0;
                            $(_this.el).find('#datePickerTitleTxt').text('date');
                            _this.afterDate.hide();
                            _this.setTimePicker(false);
                        }
                        else if (selVal == 'B01' || selVal == 'V02' || selVal == 'V03' || selVal == 'V07' || selVal == 'V08') {
                            _this.holReq = (selVal == 'B01') ? 0 : 0.5;
                            $(_this.el).find('#datePickerTitleTxt').text('date');
                            _this.afterDate.hide();
                            _this.setTimePicker(true);
                        }
                        else {
                            var arrInsertDate = _this.getDatePariod();
                            _this.holReq = arrInsertDate.length;
                            $(_this.el).find('#datePickerTitleTxt').text('from');
                            _this.afterDate.css('display', 'table');
                            _this.setTimePicker(true);
                        }

                        $(_this.el).find('#reqHoliday').val(_this.holReq + " 일");

                    }
                });
            });
            this.afterDate.change(function(val) {
                var endDate = $(_this.el).find('#end_date input').val();
                if (endDate.length > 8) {
                    var selGubun = $(_this.el).find('#office_code');
                    var selVal = selGubun.val();
                    // _this.holReq = 0;
                    if (selVal == 'W01') {
                        // 외근
                        _this.holReq = 0;
                        $(_this.el).find('#datePickerTitleTxt').text('date');
                        _this.afterDate.hide();
                        _this.setTimePicker(false);
                    }
                    else if (selVal == 'B01' || selVal == 'V02' || selVal == 'V03' || selVal == 'V07' || selVal == 'V08') {
                        _this.holReq = (selVal == 'B01') ? 0 : 0.5;
                        $(_this.el).find('#datePickerTitleTxt').text('date');
                        _this.afterDate.hide();
                        _this.setTimePicker(true);
                    }
                    else {
                        var arrInsertDate = _this.getDatePariod();
                        _this.holReq = arrInsertDate.length;
                        $(_this.el).find('#datePickerTitleTxt').text('from');
                        _this.afterDate.css('display', 'table');
                        _this.setTimePicker(true);
                    }
                    $(_this.el).find('#reqHoliday').val(_this.holReq + " 일");
                }
            });

            var beforeTime = $(this.el).find("#start_time");
            this.beforeTime = beforeTime.datetimepicker({
                pickDate: false,
                language: "ko",
                format: "HH:mm",
                use24hours: true,
                autoclose: true
            });

            var afterTime = $(this.el).find("#end_time");
            this.afterTime = afterTime.datetimepicker({
                pickDate: false,
                language: "ko",
                format: "HH:mm",
                use24hours: true,
                autoclose: true
            });

            this.setTimePicker(true);
        },

        setSelectBoxData: function() {
            // 구분 
            this.setOfficeCode();
            // 결재자 
            this.setManagerList();
        },

        setOfficeCode: function() {
            var _this = this;
            var selGubun = $(this.el).find('#office_code');
            var arrGubunData = Code.getCodes(Code.OFFICE);

            arrGubunData = _.sortBy(arrGubunData, function(obj) {
                return obj.code.slice(0, 2) + obj.name;
            });

            // option setting
            for (var index = 0; index < arrGubunData.length; index++) {
                if (arrGubunData[index].code.length == 3) {
                    var optionHtml = "<option value='" + arrGubunData[index].code + "'>" + arrGubunData[index].name + "</option>";
                    selGubun.append(optionHtml);
                }
            }
            // 휴일근무
            $(_this.el).find('#datePickerTitleTxt').text('date');
            _this.afterDate.hide();
            _this.holReq = 0;
            $(_this.el).find('#reqHoliday').val("0 일");
            $(_this.el).find('#reqHoliday').parent().parent().css('display', 'none');
            ComboBox.createCombo(selGubun);

            if (arrGubunData.length > 0) {
                if (arrGubunData[0].code == 'B01' || arrGubunData[0].code == 'W01' || arrGubunData[0].code == 'W02' || arrGubunData[0].code == 'W03' || arrGubunData[0].code == 'W04') {
                    $(_this.el).find('#usableHolidayCon').hide();
                }
            }

            selGubun.change(function() {
                var selVal = selGubun.val();
                if (selVal == 'W01') {
                    // 외근
                    _this.holReq = 0;
                    $(_this.el).find('#datePickerTitleTxt').text('date');
                    _this.afterDate.hide();
                    _this.setTimePicker(false);
                }
                else if (selVal == 'B01' || selVal == 'V02' || selVal == 'V03' || selVal == 'V07' || selVal == 'V08') {
                    _this.holReq = (selVal == 'B01') ? 0 : 0.5;
                    $(_this.el).find('#datePickerTitleTxt').text('date');
                    _this.afterDate.hide();
                    _this.setTimePicker(true);
                }
                else {
                    var arrInsertDate = _this.getDatePariod();
                    _this.holReq = arrInsertDate.length;
                    $(_this.el).find('#datePickerTitleTxt').text('from');
                    _this.afterDate.css('display', 'table');
                    _this.setTimePicker(true);
                }
                $(_this.el).find('#reqHoliday').val(_this.holReq + " 일");

                // 외근, 출장, 장기외근 - 잔여 연차 일수 감추기 
                if (selVal == 'B01' || selVal == 'W01' || selVal == 'W02' || selVal == 'W03' || selVal == 'W04' || selVal == 'V04' || selVal == 'V05' || selVal == 'V06' || selVal == 'V07' || selVal == 'V08') {
                    $(_this.el).find('#usableHolidayCon').hide();
                }
                else {
                    $(_this.el).find('#usableHolidayCon').show();
                }

                // 신청연차일수 감추기
                if (selVal == 'B01' || selVal == 'W01' || selVal == 'W02' || selVal == 'W03' || selVal == 'W04' || selVal == 'V04' || selVal == 'V05' || selVal == 'V06' || selVal == 'V07' || selVal == 'V08') {
                    $(_this.el).find('#usableHolidayCon').hide();
                }
                else {
                    $(_this.el).find('#usableHolidayCon').show();
                }

                if (_this.holReq == 0) {
                    // _this.find('#reqHoliday').val(holReq + " 일");
                    $(_this.el).find('#reqHoliday').parent().parent().css('display', 'none');
                }
                else {
                    $(_this.el).find('#reqHoliday').parent().parent().css('display', 'block');
                }
            });

        },

        //결재자 관리부
        setManagerList: function() {
            var approvalMem = $(this.el).find('#manager_id');
            // option setting
            var googoo = "-9999";
            var managerbu = "관리부";
            var approvalOptionHtml = "<option value='" + googoo + "'>" + managerbu + "</option>";
            approvalMem.append(approvalOptionHtml);
            $(this.el).find("#manager_id").append(managerbu);
            ComboBox.createCombo(approvalMem);
        },

        setTimePicker: function(isDisable) {
            if (isDisable) {
                $(this.el).find('#timePickTitle').text('');
                this.beforeTime.hide();
                this.afterTime.hide();
            }
            else {
                $(this.el).find('#timePickTitle').text('외근시간');
                this.beforeTime.show();
                this.afterTime.show();
            }
        },

        getFormData: function(form) {
            // input value
            var unindexed_array = form.serializeArray();
            var indexed_array = {};

            $.map(unindexed_array, function(n, i) {
                indexed_array[n['name']] = n['value'];
            });

            indexed_array["day_count"] = this.holReq;

            return indexed_array;
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
        checkYear: function(formData) {
            var startDate = formData.start_date;
            var endDate = formData.end_date;

            var start = new Date(startDate);
            var end = new Date(endDate);

            if (start.getFullYear() != end.getFullYear()) {
                return false;
            }

            return true;
        },
        isDateCompare: function(formData) {
            var startDate = formData.start_date;
            var endDate = formData.end_date;

            var start = new Date(startDate);
            var end = new Date(endDate);

            if (start > end) {
                return false;
            }

            return true;
        },

        isSelectHoliday: function() {
            var isHoli = false; // true: 쉬는 날, false : 평일

            var sStart = $(this.el).find('#start_date input').val();
            var start = new Date(sStart.substr(0, 4), sStart.substr(5, 2) - 1, sStart.substr(8, 2));

            var holidayInfos = this.options.holidayInfos;
            if (start.getDay() == 0 || start.getDay() == 6) {
                isHoli = true;
            }
            else {
                for (var j = 0; j < holidayInfos.length; j++) {
                    var sDate = this.getDateFormat(start);
                    if (holidayInfos[j].date == sDate) {
                        isHoli = true;
                        break;
                    }
                }
            }

            return isHoli;
        },
        submitAdd: function(evt) {
            this.dialogRef = evt;
            var _this = this;
            this.thisDfd = new $.Deferred();

            var formData = this.getFormData($(this.el).find('form'));

            var essenId = ["start_date", "end_date", "office_code", "submit_comment"];
            var essenMsg = ["기간", "기간", "구분", "메모"];

            for (var i = 0; i < essenId.length; i++) {
                if (i == 1) { // end date 일경우
                    var selGubun = $(this.el).find('#office_code');
                    var selVal = selGubun.val();
                    if (selVal == 'B01' || selVal == 'V02' || selVal == 'V03' || selVal == 'W01' || selVal == 'V07' || selVal == 'V08') {
                        $(this.el).find('#' + essenId[i]).val(formData["start_date"]);
                        formData[essenId[i]] = formData["start_date"];
                    }
                }
                if (formData[essenId[i]] == "") {
                    Dialog.error(essenMsg[i] + "을(를) 입력하세요.");
                    // this.thisDfd.reject();
                    return;
                }
            }

            if (selVal == 'B01') { // 휴일 근무일경우
                if (!this.isSelectHoliday()) {
                    Dialog.error("선택 날짜는 휴일이 아닙니다.");
                    return;
                }
            }
            else if (selVal == 'V02' || selVal == 'V03') { // 오전/오후 반차일경우
                if (this.isSelectHoliday()) {
                    Dialog.error("선택 날짜는 근무 하는 날이 아닙니다.");
                    return;
                }
            }

            // var usable = (this.options.total_day > this.options.used_holiday) ? this.options.total_day - this.options.used_holiday : 0;
            var usable = this.options.total_day - this.options.used_holiday - this.options.approval_count;
            if (!this.isDateCompare(formData)) {
                Dialog.error("기간을 잘못 입력하였습니다.");
                // this.thisDfd.reject();
                return;
            }
            else if (!this.checkYear(formData)) {
                Dialog.error("시작일자 / 종료일자는 같은 연도에서만 가능합니다.");
                return;
            }
            else if (_this.holReq != 0 && _this.holReq > 31) {
                Dialog.error("최대 기간을 초과했습니다.(31일)");
                return;
            }
            else if ((selVal == 'V01' || selVal == 'V02' || selVal == 'V03') && (this.holReq > usable)) {
                Dialog.error("잔여 연차 일수를 초과 했습니다.");
                // this.thisDfd.reject();
                return;
            }
            else {
                Dialog.loading({
                    action: function() {
                        var dfd = new $.Deferred();
                        var nowDate = new Date();
                        var yearMonth = "";

                        // getzFormat
                        yearMonth = nowDate.getFullYear() + _this.getzFormat(nowDate.getMonth() + 1, 2);

                        var docData = {
                            yearmonth: yearMonth
                        };

                        var _appCollection = new ApprovalCollection();
                        _appCollection.url = "/approval/appIndex";

                        _appCollection.fetch({
                            reset: true,
                            data: docData,
                            error: function(result) {
                                dfd.reject();
                                Dialog.error("데이터 조회가 실패했습니다.");
                            }
                        }).done(function(result) {
                            var data = {
                                doc_num: null,
                                decide_comment: formData.decide_comment,
                                office_code: formData.office_code,
                                day_count: formData.day_count,
                                end_date: formData.end_date,
                                end_time: formData.end_time,
                                start_date: formData.start_date,
                                start_time: formData.start_time,
                                submit_comment: "",
                                manager_id: "130702",
                                submit_id: null
                            };

                            var promiseArr = [];

                            var default_seq = result[0].maxSeq + 1;
                            var default_seq2 = result[0].maxSeq + 1;
                            var seq = result[0].maxSeq;

                            if (_.isNull(seq)) {
                                docData["seq"] = null;
                                promiseArr.push(new ApprovalIndexModel(docData).save({}, {
                                    wait: false
                                }));
                            }

                            docData["seq"] = seq + _this.setuser.length;
                            promiseArr.push(new ApprovalIndexModel(docData).save({}, {
                                wait: false
                            }));
                            
                            var datas = [];
                            $.when.apply(_this, promiseArr).then(function() {
                                var promiseArr2 = [];

                                for (var j = 0; j < _this.setuser.length; j++) {
                                    var user = _this.setuser[j];
                                    var sendData = _.clone(data);
                                    sendData.doc_num = docData.yearmonth + "-" + _this.getzFormat(default_seq++, 3);
                                    sendData.submit_id = user.id;
                                    
                                    datas.push(sendData);
                                    promiseArr2.push(new ApprovalModel(sendData).save({}, {
                                        wait: false
                                    }));
                                }

                                $.when.apply(_this, promiseArr2).then(function() {
                                    var promiseArr3 = [];
                                    for(var k=0; k<_this.setuser.length; k++){
                                        var sendData = datas[k];
                                        var outOfficeArr = ["B01", "O01"];
                                        var _approvalCollection = new ApprovalCollection({
                                            decide_comment: "",
                                            state: "결재완료",
                                            doc_num: docData.yearmonth + "-" + _this.getzFormat(default_seq2++, 3)
                                        });
                                        
                                        if (_.indexOf(outOfficeArr, formData.office_code) > -1) { // 휴일 근무
                                            promiseArr3.push(_this.addInOfficeData(_approvalCollection, sendData));
                                        }
                                        else { // 외근 / 휴가 등등
                                            promiseArr3.push(_this.addOutOfficeData(_approvalCollection, sendData));
                                        }    
                                    }
                                    
                                    $.when.apply(_this,promiseArr3).then(function(){
                                        dfd.resolve();
                                        _this.thisDfd.resolve();    
                                    }, function(){
                                        dfd.reject();
                                        _this.thisDfd.reject();    
                                    });
                                }, function() {
                                    dfd.reject();
                                    _this.thisDfd.reject();
                                });
                            }, function() {
                                dfd.reject();
                                _this.thisDfd.reject();
                            });
                        });
                        return dfd.promise();
                    },
                });

            }

            return this.thisDfd.promise();
        },
        
        addOutOfficeData: function(_approvalCollection, data) {
            var dfd = new $.Deferred();
            var arrInsertDate;
            if (data["office_code"] == "W03" || data["office_code"] == "W02") {
                arrInsertDate = this.getDatePariod(true);
            }
            else {
                arrInsertDate = this.getDatePariod(false);
            }

            var resultData = {};
            // data 저장
            resultData.outOffice = _approvalCollection.models[0].toJSON();
            resultData.outOffice["arrInsertDate"] = arrInsertDate; // insert 에 필요한 데이터 저장
            resultData.outOffice["id"] = data["submit_id"];
            resultData.outOffice["doc_num"] = data["doc_num"];
            resultData.outOffice["memo"] = data["submit_comment"];
            resultData.outOffice["office_code"] = data["office_code"];
            resultData.outOffice["start_time"] = data["start_time"];
            resultData.outOffice["end_time"] = data["end_time"];
            
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

        addInOfficeData: function(_approvalCollection, data) {
            var dfd = new $.Deferred();


            // 날짜 개수 이용하여 날짜 구하기
            var sStart = $(this.el).find('#start_date input').val();
            var arrInsertDate = [];
            arrInsertDate.push(sStart);

            var resultData = {};

            // data 저장
            resultData.inOffice = _approvalCollection.models[0].toJSON();
            resultData.inOffice["arrInsertDate"] = arrInsertDate; // insert 에 필요한 데이터 저장
            resultData.inOffice["id"] = data["submit_id"];
            resultData.inOffice["doc_num"] = data["doc_num"];
            if(data.office_code == "O01"){
                var splitArr = data.submit_comment.split(",");
                var except = parseInt(splitArr[0],10);
                resultData.inOffice["except"] = except;
            }
            
            var results = [];
            var promiseArr = [];

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
        
        setUserData: function(date) {
            var dfd = new $.Deferred();
            var p1 = this.setVacationById(date);
            var p2 = this.setHolidayInfos(date);

            $.when(p1, p2).done(function(r1, r2) {
                dfd.resolve();
            });
            return dfd.promise();
        },

        setVacationById: function(date) {
            var dfd = new $.Deferred();
            var _this = this;
            var today = date;
            var sYear = today.getFullYear() + "";
            var sessionInfo = SessionModel.getUserInfo();
            var _vacationColl = new VacationCollection();
            _vacationColl.url = '/vacation/list';
            _vacationColl.fetch({
                data: {
                    id: sessionInfo.id,
                    year: sYear
                },
                error: function(result) {
                    Dialog.error("데이터 조회가 실패했습니다.");
                }
            }).done(function(result) {
                if (result.length > 0) {
                    _this.options.total_day = result[0].total_day;
                    _this.options.used_holiday = result[0].used_holiday;
                    _this.options.approval_count = result[0].approval_count;
                }
                dfd.resolve();
            });
            return dfd.promise();
        },

        setHolidayInfos: function(date) {
            var dfd = new $.Deferred();
            var _this = this;
            var today = date;
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
        getDatePariod: function(getHoliday) {
            // 날짜 개수 이용하여 날짜 구하기
            var sStart = $(this.el).find('#start_date input').val();
            var sEnd = $(this.el).find('#end_date input').val();

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

    });
    return addallReportView;
});