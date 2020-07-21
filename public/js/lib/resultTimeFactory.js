define([
    'jquery',
    'underscore',
    'cmoment',
    'models/cm/CommuteModel',
    'collection/cm/CommuteCollection',
    'collection/vacation/InOfficeCollection',
    'collection/vacation/OutOfficeCollection'
], function($, _, Moment,
    CommuteModel, CommuteCollection, InOfficeCollection, OutOfficeCollection
) {
    var WORKTYPE = {
        NORMAL: "00",
        EARLY: "01",
        LATE: "10",
        EARLY_LATE: "11",
        ABSENTCE: "21",
        _ABSENTCE: "22",
        HOLIDAY: "30",
        VACATION: "31",
        _HOLIDAYWORK: "40",
        HOLIDAYWORK: "41",
        NOTINTIME: "50",
        NOTOUTTIME: "51"
    };

    var TIMEFORMAT = "HH:mm:ss";

    var DATEFORMAT = "YYYY-MM-DD";

    var DATETIMEFORMAT = "YYYY-MM-DD HH:mm";

    var Builder = function() {};
    _.extend(Builder.prototype, {
        id: "",
        name: "",
        department: "",
        year: null,
        date: null,
        workType: WORKTYPE.NORMAL,
        standardInTime: null,
        standardOutTime: null,
        earliestTime: null,
        inTime: null,
        inTimeType: 1,
        outTime: null,
        outTimeType: 1,
        latestTime: null,
        lateTime: 0,
        lateTimeOver: 0,
        overTime: 0,
        except :null,
        vacationCode: null,
        outOfficeCode: null,
        overtimeCode: null,
        holidayData: null,
        outOfficeStartTime: null,
        outOfficeEndTime: null,
        inTimeChange: 0,
        outTimeChange: 0,
        overtimeCodeChange: 0,
        checkInOffice: false,
        checkOverTime : false,
        isSuwon: 0,
        checkLate: true,
        checkEarly: true,
        earlyTime: 0,
        notPayOverTime: 0,
        normal : 0,
        normalChange : 0,
        /**
         * Factory 기본값 설정
         */
        init: function(userId, userName, userDepartment, isSuwonParam) {
            this.id = userId;
            this.name = userName;
            this.department = userDepartment;
            this.year = null;
            this.date = null;
            this.standardInTime = null;
            this.standardOutTime = null;
            this.earliestTime = null;
            this.inTime = null;
            this.inTimeType = 1;
            this.outTime = null;
            this.outTimeType = 1;
            this.latestTime = null;
            this.lateTime = 0;
            this.lateTimeOver = 0;
            this.overTime = 0;
            this.except = null;
            this.workType = WORKTYPE.NORMAL;
            this.vacationCode = null;
            this.outOfficeCode = null;
            this.overtimeCode = null;
            this.holidayData = null;
            this.outOfficeStartTime = null;
            this.outOfficeEndTime = null;
            this.inTimeChange = 0;
            this.outTimeChange = 0;
            this.overtimeCodeChange = 0;
            this.checkInOffice = false;
            this.checkLate = true;
            this.checkEarly = true;
            this.checkOverTime = false,
            this.earlyTime = 0;
            this.notPayOverTime = 0;
            this.normal = 0;
            this.normalChange = 0;
            this.isSuwon = isSuwonParam;
        },

        /**
         * Factory 초기화
         */
        initToday: function(todayStr, holidayData) {
            this.year = Moment(todayStr, DATETIMEFORMAT);
            this.year = this.year.year();
            this.date = todayStr;
            this.standardInTime = null;
            this.standardOutTime = null;
            this.earliestTime = null;
            this.inTime = null;
            this.inTimeType = 1;
            this.outTime = null;
            this.outTimeType = 1;
            this.latestTime = null;
            this.lateTime = 0;
            this.lateTimeOver = 0;
            this.overTime = 0;
            this.except = null;
            this.workType = WORKTYPE.NORMAL;
            this.vacationCode = null;
            this.outOfficeCode = null;
            this.overtimeCode = null;
            this.holidayData = holidayData;
            this.outOfficeStartTime = null;
            this.outOfficeEndTime = null;
            this.inTimeChange = 0;
            this.outTimeChange = 0;
            this.overtimeCodeChange = 0;
            this.checkOverTime = false,
            this.checkInOffice = false;
            this.checkLate = true;
            this.checkEarly = true;
            this.earlyTime = 0;
            this.notPayOverTime = 0;
        },

        /**
         * Model을 사용하여 Factory 초기화
         **/
        initByModel: function(model) {
            this.id = model.get("id");
            this.name = model.get("name");
            this.department = model.get("department");
            this.year = model.get("year");
            this.date = model.get("date");
            this.standardInTime = _.isNull(model.get("standard_in_time")) ? null : Moment(model.get("standard_in_time"));
            this.standardOutTime = _.isNull(model.get("standard_out_time")) ? null : Moment(model.get("standard_out_time"));
            this.inTime = _.isNull(model.get("in_time")) ? null : Moment(model.get("in_time"));
            this.outTime = _.isNull(model.get("out_time")) ? null : Moment(model.get("out_time"));
            this.inTimeType = model.get("in_time_type");
            this.outTimeType = model.get("out_time_type");
            this.lateTime = model.get("late_time");
            this.holidayWorkTime = model.get("holidayWorkTime");
            this.lateTimeOver = model.get("lateTimeOver");
            this.overTime = model.get("over_time");
            this.except = model.get("except");
            this.workType = model.get("work_type");
            this.vacationCode = model.get("vacation_code");
            this.outOfficeCode = model.get("out_office_code");
            this.overtimeCode = model.get("overtime_code");
            this.outOfficeStartTime = model.get("out_office_start_time");
            this.outOfficeEndTime = model.get("out_office_end_time");
            this.inTimeChange = model.get("in_time_change");
            this.outTimeChange = model.get("out_time_change");
            this.overtimeCodeChange = model.get("overtime_code_change");
            this.checkLate = true;
            this.checkEarly = true;
            this.checkOverTime = false,
            this.earlyTime = model.get("early_time");
            this.notPayOverTime = model.get("not_pay_over_time");
            this.normal = model.get("normal");
            this.normalChange = model.get("normal_change");
            this.isSuwon = model.get("is_suwon");
            if (this.isSuwon === undefined || this.isSuwon === null) {
              if (this.department.indexOf("본사") > -1) {
                this.isSuwon = 0;
              }else if (this.department.indexOf("품질검증") > -1) {
                this.isSuwon = 1;
              }
              else if (this.department === "개발품질팀(수원)") {
                this.isSuwon = 1;
              }
              else if (this.department === "무선랜검증팀") {
                // 8시 이전 출근 후 야근 결재 시 '무선랜검증팀'의 출근 기준시간이 7시 -> 8시로 변경되는 문제로 인한 추가
                this.isSuwon = 1;
              }
              else {
                this.isSuwon = 0;
              }
            }
        },

        /**
         * workType 휴일 판단 
         * (HOLIDAY, _HOLIDAYWORK, HOLIDAYWORK)
         * (휴일, 휴일근무미결, 휴일근무)
         **/
        isHoliday: function() {
            if (this.workType == WORKTYPE.HOLIDAY || this.workType == WORKTYPE._HOLIDAYWORK || this.workType == WORKTYPE.HOLIDAYWORK) {
                return true;
            }
            else {
                return false;
            }
        },

        /**
         * # builder1
         * 생성일자 휴일 여부 판단
         **/
        setHoliday: function() {
            var today = Moment(this.date);
            if (this.holidayData.length > 0 || today.day() === 0 || today.day() === 6) {
                this.workType = WORKTYPE.HOLIDAY;
            }
        },

        /**
         * # builder2
         * 출입 기록 사용하여 
         * inTime, outTime, earliestTime, lastestTime 설정
         **/
        checkTime: function(rawDataCollection) {
            var that = this;

            // 저장된 earliestTime 보다 이른 시간일 경우 수정
            var setEarliestTime = function(destTime) {
                if (_.isNull(that.earliestTime))
                    that.earliestTime = destTime;
                else
                if (that.earliestTime.isAfter(destTime))
                    that.earliestTime = destTime;
            };

            // 저장된 inTime 보다 이른 시간일 경우 수정
            var setInTime = function(destTime) {
                if (_.isNull(that.inTime))
                    that.inTime = destTime;
                else
                if (that.inTime.isAfter(destTime))
                    that.inTime = destTime;
            };

            // 저장된 outTime 보다 늦은 시간일 경우 수정
            var setOutTime = function(destTime) {
                if (_.isNull(that.outTime))
                    that.outTime = destTime;
                else
                if (that.outTime.isBefore(destTime))
                    that.outTime = destTime;
            };

            // 저장된 latestTime 보다 늦은 시간일 경우 수정
            var setLatestTime = function(destTime) {
                if (_.isNull(that.latestTime))
                    that.latestTime = destTime;
                else
                if (that.latestTime.isBefore(destTime))
                    that.latestTime = destTime;
            };

            for (var key in rawDataCollection) {
                var rawDataModel = rawDataCollection[key];

                // 확인 필요가 있는 자료는 제외
                if (rawDataModel.get("need_confirm") == 1) {
                    var destTime = Moment(rawDataModel.get("char_date")).second(0);
                    var type = rawDataModel.get("type");
                    type = type.slice(0, 2);

                    if (type == "출근" && this.date == destTime.format(DATEFORMAT)) { // 출근 기록일 경우
                        setInTime(destTime);
                        setEarliestTime(destTime);
                    }
                    else if (type == "퇴근") { // 퇴근기록일 경우
                        setOutTime(destTime);
                        setLatestTime(destTime);
                    }
                    else {
                        if (type == "외출") {
                            this.outOfficeStartTime = destTime;
                        }
                        else if (type == "복귀") {
                            this.outOfficeEndTime = destTime;
                        }

                        // 출퇴근 기록이 없을때를 대비해서 이른시간 / 늦은시간을 구한다.
                        setEarliestTime(destTime);
                        setLatestTime(destTime);
                    }
                }
            }

            this.setTimeType();
        },

        /**
         * # builder2
         * 설정된 inTime, outTime, earliestTime, lastestTime을
         * 사용하여 workType, inTimeType, outTimeType 설정
         **/
        setTimeType: function() {
            /**
             * 출근 기록(inTime) 없는경우
             *  가장 빠른 출입시간(earliestTime)이 있는 경우
             *  inTime을 earliestTime으로 설정하고 intimeType을 2(자동설정)으로 수정
             **/
            if (!this.inTime) {
                if (this.earliestTime) {
                    this.inTime = this.earliestTime;
                }
                if (this.workType != WORKTYPE.HOLIDAY)
                    this.inTimeType = 2;
            }
            else {
                this.inTimeType = 1;
            }

            /**
             * 퇴근 기록(outTime) 없는경우
             *  가장 늦은 출입시간(lastestTime)이 있는 경우
             *  outTime lastestTime 설정하고 outtimeType을 2(자동설정)으로 수정
             **/
            if (!this.outTime) { // 퇴근 기록이 없는경우
                if (this.latestTime) {
                    this.outTime = this.latestTime; // 저장된 가장 늦은 출입시간을 퇴근시간으로 표시
                }
                if (this.workType != WORKTYPE.HOLIDAY)
                    this.outTimeType = 2;
            }
            else {
                this.outTimeType = 1;
            }
        },

        /**
         * # builder3
         * 전일 퇴근시간에 따른 Standard In/Out Time을 계산한다.
         **/
        setStandardTime: function(yesterdayOutTime) {
            if (!this.isHoliday()) {
                /**
                 * 기본 : 10:00 ~ 19:00 ( Flexible 본사 / 수원 동일 )
                 **/
                this.isFlexible = true;
                this.standardInTime = Moment(this.date, DATEFORMAT).hour(10).minute(0).second(0);
                this.standardOutTime = Moment(this.date, DATEFORMAT).hour(19).minute(0).second(0);
            }
        },

        /**
         * # builder4
         * 휴일근무 여부를 판단한다
         * (checkInOffice를 true,false로 수정)
         **/
        setInOffice: function(todayInOffice) {
            if (this.isHoliday()) {
                this.workType = WORKTYPE.HOLIDAY;
                // 휴일근무 결재가 된 상태일때만 휴일근무 계산 로직에 들어감
                if (todayInOffice.length > 0) {
                    this.checkInOffice = true;
                }
                else {
                    this.checkInOffice = false;
                }
            }else{
                if (todayInOffice.length > 0) {
                    this.checkOverTime = true;
                    var model;

                    if(_.isFunction(todayInOffice.first)){
                        model = todayInOffice.first();
                    }else{
                        model = _.first(todayInOffice);
                    }
                        
                    if(!_.isUndefined(model.get("except"))){
                        this.except = model.get("except");    
                    }
                }
                else {
                    this.checkOverTime = false;
                    this.except = null;
                }
            }
        },

        /**
         * # builder5
         * 휴가, 외근 �����태를 설정한다.
         **/
        setOutOffice: function(todayOutOffice) {
            this.vacationCode = null;
            this.outOfficeCode = null;

            if (todayOutOffice.length > 0) {
                var vacationArr = [];
                var outOfficeArr = [];
                /**
                 * outOffice 데이터를 가지고 vacationCode, outOfficeCode를 설정한다.
                 **/
                for (var i = 0; i < todayOutOffice.length; i++) {
                    var model = todayOutOffice[i];
                    var code = model.get("office_code");
                    var VACATION_CODES = ["V01", "V02", "V03", "V04", "V05", "V06", "V07", "V08"];
                    var OUTOFFICE_CODES = ["W01", "W02", "W03", "W04", "W01W04", "E01"];
                    var VACATIONS_CODE = ["V02V03", "V02V05", "V03V05", "V02V08", "V03V07", "V06V07", "V06V08"];

                    if (_.indexOf(VACATION_CODES, code) >= 0) {
                        vacationArr.push(code);
                    }

                    if (_.indexOf(OUTOFFICE_CODES, code) >= 0) {
                        outOfficeArr.push(code);
                        // this.outOfficeCode = code;
                    }
                }

                /**
                 * 등록된 휴가 정보 개수에 따라 처리 로직을 변경한다.
                 * 1개 : vacationCode에 그대로 적용
                 * 2개 : 이름순으로 정렬하여 그대로 붙여서 적용
                 * 3개 이상 : 없음 (휴가상태 확인 필요)
                 **/
                if (vacationArr.length == 1) {
                    this.vacationCode = vacationArr[0];
                }
                else if (vacationArr.length == 2) {
                    vacationArr = _.sortBy(vacationArr, function(str) {
                        return str;
                    });
                    this.vacationCode = vacationArr[0] + vacationArr[1];
                    if (_.indexOf(VACATIONS_CODE, this.vacationCode) < 0) {
                        this.vacationCode = null;
                    }
                }
                else if (vacationArr.length > 2) {
                    this.vacationCode = null;
                }

                // 외근 정보가 2개 이상인 경우
                if (outOfficeArr.length == 1) {
                    this.outOfficeCode = outOfficeArr[0];
                }
                else if (outOfficeArr.length == 2) {
                    outOfficeArr = _.sortBy(outOfficeArr, function(str) {
                        return str;
                    });
                    this.outOfficeCode = outOfficeArr[0] + outOfficeArr[1];
                    if (_.indexOf(OUTOFFICE_CODES, this.outOfficeCode) < 0) {
                        this.outOfficeArr = null;
                    }
                }
                else if (outOfficeArr.length > 2) {
                    this.outOfficeCode = null;
                }
            }

            /**
             * 휴가에 따른 Standard In/Out Time 조정
             **/
            if (!this.isHoliday()) {
                this.workType = WORKTYPE.NORMAL;
                switch (this.vacationCode) {
                    case "V01": // 연차휴가
                    case "V04": // 경조휴가
                    case "V05": // 공적휴가
                    case "V06": // 특별휴가
                    case "V02V03": // 오전반차, 오후반차
                    case "V02V05": // 오전반차, 공적휴가
                    case "V03V05": // 공적휴가, 오후반차
                    case "V02V08": // 오전반차, 공적휴가(오후)
                    case "V03V07": // 오후반차, 공적휴가(오전)
                    case "V06V07": // 특별휴가,공적휴가(오전)
                    case "V06V08": // 특별휴가,공적휴가(오후)
                        this.workType = WORKTYPE.VACATION;
                        this.inTimeType = 1;
                        this.outTimeType = 1;
                        break;
                }

                switch (this.vacationCode) {
                    case "V02": // 오전반차
                    case "V07": // 오전반차(공적)
                        this.standardInTime.hour(14).minute(0).second(0);
                        this.standardOutTime.hour(18).minute(0).second(0);
                        break;
                    case "V03": // 오후반차
                    case "V08": // 오후반차(공적)
                    default:
                        // 본사
                        //       ~ 8:00 : 08:00
                        //  8:01 ~ 9:59 : 출근시간;
                        // 10:00 ~      : 10:00
                        
                        // 수원
                        //       ~ 7:00 : 07:00
                        //  7:01 ~ 9:59 : 출근시간;
                        // 10:00 ~      : 10:00
                        if (!_.isNull(this.inTime)) {
                            var hour = this.inTime.hour();
                            var minute = this.inTime.minute();
                            
                            if(this.normal === 1) {
                                this.standardInTime = this.inTime
                            } else if(this.isSuwon === 1){
                                if(hour < 7){ 
                                    this.standardInTime.hour(7).minute(0).second(0);
                                } else if (hour < 10){
                                    this.standardInTime.hour(hour).minute(minute).second(0);
                                } else {
                                    this.standardInTime.hour(10).minute(0).second(0);
                                }
                            }else{
                                if(hour < 8){ 
                                    this.standardInTime.hour(8).minute(0).second(0);
                                } else if (hour < 10){
                                    this.standardInTime.hour(hour).minute(minute).second(0);
                                } else {
                                    this.standardInTime.hour(10).minute(0).second(0);
                                }
                            }
                        }
                        
                        if(this.vacationCode == "V03" || this.vacationCode == "V08"){
                            this.standardOutTime = Moment(this.standardInTime).add(4, "hours");
                        }else{
                            this.standardOutTime = Moment(this.standardInTime).add(9, "hours");
                        }
                        break;
                }

                /**
                 * 외근, 출장, 장기외근, 파견 특이사항 수정
                 * 외근 
                 *  본사 : standardInTime 이전시간부터 외근 설정되어 있을때 지각 체크 하지 않음
                 *         standardOutTime 이후 시간까지 외근 설정되어 있을때 조퇴 체크 하지 않음
                 * 출장
                 *  inTimeType, outTimeType 을 정상으로 수정
                 * 장기외근
                 *  본사 : 지각, 조퇴 체크 하지 않음
                 * 파견
                 *  변경 없음
                 **/

                switch (this.outOfficeCode) {
                    case "W01": // 외근
                    case "E01": // 교육
                    case "W01W04" : // 파견,외근
                        var stdInTime = 8;
                        if (this.isSuwon === 1) {
                            stdInTime = 7;
                        }

                        for (var i = 0; i < todayOutOffice.length; i++) {
                            model = todayOutOffice[i];
                            code = model.get("office_code");
                            if (code == "W01" || code == "E01") {
                                var startTime = Moment(model.get("start_time"), "HH:mm");
                                var endTime = Moment(model.get("end_time"), "HH:mm");
                                /**
                                 * 외근 시작시간
                                 * 8시 이전       : 8:00, checkLate = false, standardintime : 08:00, standardouttime : 17:00,
                                 * 8시 ~ 10시 00분 : 출근시간, checkLate = false, standardintime = 출근시간, standardouttime : 출근시간 + 9시간
                                 * 10시 이후      : 10:00, checkLate = true, standardintime : 10:00, standardouttime : 19:00,
                                 * 예외 : 정상처리 (normal === 1) 인 경우 standardintime = 출근시간, standardouttime : 출근시간 + 9시간
                                 * 
                                 * 2017.12.15. 김성식 부장 : 수원 외근 발생시 서울과 동일하게 처리 함.
                                 *  - 수원의 경우 7시 기준으로 계산함. 
                                 * 
                                 * 외근 종료시간
                                 * standardouttime 이전 : checkEarly = true
                                 * standardouttime 이후 : checkEarly = false
                                 **/
                                // if(startTime.hour() < stdInTime){
                                //     this.standardInTime.hour(stdInTime).minute(0).second(0);
                                //     this.standardOutTime.hour(stdInTime+9).minute(0).second(0);
                                //     this.checkLate = false;
                                // }else if(startTime.hour() < 10 || (startTime.hour() == 10 && startTime.minute() == 0)){
                                //     if(startTime.isBefore(Moment(this.standardInTime.format("HH:mm"), "HH:mm"))){
                                //         this.standardInTime.hour(startTime.hour()).minute(startTime.minute()).second(0);
                                //         this.standardOutTime = Moment(this.standardInTime);
                                //         this.standardOutTime.add(9,'hours');
                                //     }
                                    this.checkLate = false;    
                                // }else{
                                    // this.checkLate = true;
                                // }
                                
                                // if (endTime.isAfter(Moment(this.standardOutTime.format("HH:mm"), "HH:mm")) || endTime.isSame(Moment(this.standardOutTime.format("HH:mm"), "HH:mm")))
                                    this.checkEarly = false;
                                
                                break;
                            }
                        }
                        
                        break;
                    case "W02": // 출장
                        this.inTimeType = 1;
                        this.outTimeType = 1;
                        this.checkLate = false;
                        this.checkEarly = false;
                        break;
                    case "W03": // 장기외근
                        if (!this.isSuwon === 1) {
                            this.checkLate = false;
                            this.checkEarly = false;
                        }
                        break;
                    case "W04": // 파견

                        break;
                }
                /**
                 * 휴일에 출퇴근 기록 없는 경우
                 * 휴가, 외근을 설정하지 않음
                 **/
            }
            else {
                if (_.isNull(this.inTime) && _.isNull(this.outTime)) {
                    // 휴일에 출장일 경우, 휴일근무 & 출장 둘다 표시되도록 예외 처리.
                    if (this.outOfficeCode != "W02") {
                        this.outOfficeCode = null;
                    }
                    this.vacationCode = null;
                }
            }
        },

        /**
         * # builder6
         * 이전에 ���정된 내용을 가지고 결과값 계산
         **/
        getResult: function() {
            /**
             * 휴일, 휴가가 아닌경우
             **/
            if (!(this.workType == WORKTYPE.VACATION || this.isHoliday())) {
                var diffTime = this.lateTime;

                /**
                 * 정상 : 출퇴근 시간 정상인 경우
                 *        출장인 경우
                 *        출근 기준시간이 퇴근 기준시간보다 늦는경우 (전일 03시까지 야근 후 오후반차)
                 * 결근 : 출퇴근 기록이 없는 경우
                 * 출근기록 없음 : 출근기록이 없는 경우 & 지각체크를 하는 경우
                 * 퇴근기록 없음 : 퇴근기록이 없는 경우 & 조퇴체크를 하는 경우
                 **/
                 
                if(this.normal != 0){
                    this.checkEarly = false;
                    this.checkLate = false;
                }
                if (this.standardInTime.isAfter(this.standardOutTime)) {
                    this.workType = WORKTYPE.NORMAL;

                }
                else if (this.outOfficeCode == "W02") {
                    this.workType = WORKTYPE.NORMAL;

                }
                else if (!this.inTime && !this.outTime && this.checkLate && this.checkEarly) {
                    this.workType = WORKTYPE.ABSENTCE;

                }
                else if (!this.inTime && this.checkLate) {
                    this.workType = WORKTYPE.NOTINTIME;

                }
                else if (!this.outTime && this.checkEarly) {
                    this.workType = WORKTYPE.NOTOUTTIME;

                }
                else {
                    this.workType = WORKTYPE.NORMAL;

                    var tmpTime = 0;
                    
                    /**
                     * 지각, 조퇴 시간 계산
                     **/
                    if (this.checkLate) {
                        diffTime = this.inTime.diff(this.standardInTime, "minute");
                        this.lateTime = diffTime;
                        if (this.lateTime > 0) {
                            this.workType = WORKTYPE.LATE;
                        }
                        else {
                            diffTime = this.lateTime = 0;
                        }
                    }
                    else {
                        diffTime = this.lateTime = 0;
                    }

                    if (this.checkEarly) {
                        tmpTime = this.outTime.diff(this.standardOutTime, "minute");
                        tmpTime -= this.lateTime;
                        
                        if (tmpTime < 0) {
                            if (this.workType == WORKTYPE.LATE) {
                                this.workType = WORKTYPE.EARLY_LATE;
                            }
                            else {
                                this.workType = WORKTYPE.EARLY;
                            }
                        }
                    }
                    else {
                        tmpTime = 0;
                    }

                    /**
                     * 초과근무 계산
                     *  지각시간 10분단위 반올림하여 추가로 근무해야함
                     *  출근 시간이 기록되지 않는 경우 초과 근무 계산 진행하지 않음
                     *  (5분지각 = 10분 추가)
                     *  2시간 : A형
                     *  4시간 : B형
                     *  6시간 : C형
                     **/
                    if (!(_.isNull(this.inTime)) && !(_.isNull(this.outTime)) && !(_.isNull(this.standardOutTime))) {
                        // this.lateOverTime = (Math.ceil(this.lateTime / 10)) * 10; // 지각으로 인해 추가 근무 해야하는시간
                        this.lateOverTime = (Math.ceil(diffTime / 10)) * 10; // 지각으로 인해 추가 근무 해야하는시간

                        if (tmpTime >= 0) {
                            this.overTime = this.outTime.diff(this.standardOutTime, "minute") - this.lateOverTime;
                            this.notPayOverTime = this.overTime;
                                
                            if(this.checkOverTime == true){
                                if ((this.vacationCode === null || this.vacationCode === "V02") && this.overtimeCodeChange == 0) { // 초과근무 코드 변경내역이 있으면 초과코드는 변경하지 않는다.
                                    if (this.overTime - this.except >= 360) {
                                        this.overtimeCode = "2015_AC";
                                        this.notPayOverTime -=  360 + this.except;
                                    }
                                    else if (this.overTime - this.except >= 240) {
                                        this.overtimeCode = "2015_AB";
                                        this.notPayOverTime -=  240 + this.except;
                                    }
                                    else if (this.overTime - this.except >= 120) {
                                        this.overtimeCode = "2015_AA";
                                        this.notPayOverTime -=  120 + this.except;
                                    }
                                    else {
                                        this.overtimeCode = null;
                                    }
                                }    
                            } else {
                                this.overtimeCode = null;
                            }
                            
                            if (this.overTime < 0){
                                this.overTime = 0; // 초과근무시간이 마이너스인 경우 0으로 수정함
                                this.notPayOverTime = this.overTime;
                            }
                        }else{
                            this.overTime = 0; 
                            this.notPayOverTime = this.overTime;
                        }
                    }

                    /**
                     * 조기 출근 시간 계산
                     *  출근기준시간 - 출근시간
                     *  지각인 경우는 0
                     **/
                    if (!_.isNull(this.inTime) && !_.isNull(this.standardInTime)) {
                        this.earlyTime = this.standardInTime.diff(this.inTime, "minute");
                        if (this.earlyTime <= 0)
                            this.earlyTime = 0;
                    }
                }
                /**
                 * 휴일인 경우
                 **/
            }
            else if (this.isHoliday()) {
                /**
                 * 휴일 출퇴근 시간이 있을경우 계산한다.
                 *  휴일 근무 결재 내역이 있을 경우
                 *   휴일근무로 표시
                 *   4시간 : A형
                 *   6시간 : B형
                 *   8시간 : C형
                 *   (초과근무코드를 admin 이 변경한 적이 있을경우엔 초과근무코드는 변경하지 않는다)
                 *  휴일 근무 결재 내역이 없을 경우
                 *   휴일근무미결로 표시
                 **/
                if (!_.isNull(this.inTime) && !_.isNull(this.outTime)) {
                    this.overTime = this.outTime.diff(this.inTime, "minute"); // 휴일근무 시간

                    if (this.checkInOffice) {
                        if (this.overtimeCodeChange == 0) {
                            if (this.overTime >= 480)
                                this.overtimeCode = "2015_BC";
                            else if (this.overTime >= 360)
                                this.overtimeCode = "2015_BB";
                            else if (this.overTime >= 240)
                                this.overtimeCode = "2015_BA";
                        }
                        this.workType = WORKTYPE.HOLIDAYWORK;

                    }
                    else {
                        this.workType = WORKTYPE._HOLIDAYWORK;
                    }
                }
                else if (this.outOfficeCode == "W02") { // 휴일 출장일때
                    if (this.checkInOffice) { // 휴일 근무 결재가 완료 된 경우
                        this.workType = WORKTYPE.HOLIDAYWORK;
                    } else { // 휴일 근무 결재가 되지 않은 경우
                        this.workType = WORKTYPE._HOLIDAYWORK;
                    }
                }
                
                /**
                 * 수당 외 근무시간 계산
                 *  초과근무 시간 - 480분(8시간)
                 **/
                if (this.overTime > 480)
                    this.notPayOverTime = this.overTime - 480;
                else
                    this.notPayOverTime = 0;

            }
            else if (this.workType == WORKTYPE.VACATION) { // 종일 휴가인 경우

            }
        
            
            return {
                id: this.id,
                name: this.name,
                department: this.department,
                year: this.year,
                date: this.date,
                work_type: this.workType,
                standard_in_time: _.isNull(this.standardInTime) ? null : this.standardInTime.format(DATETIMEFORMAT),
                standard_out_time: _.isNull(this.standardOutTime) ? null : this.standardOutTime.format(DATETIMEFORMAT),
                in_time: _.isNull(this.inTime) ? null : this.inTime.format(DATETIMEFORMAT),
                out_time: _.isNull(this.outTime) ? null : this.outTime.format(DATETIMEFORMAT),
                normal : this.normal,
                in_time_type: this.inTimeType,
                out_time_type: this.outTimeType,
                late_time: this.lateTime,
                over_time: this.overTime,
                vacation_code: this.vacationCode,
                overtime_code: this.overtimeCode,
                out_office_code: this.outOfficeCode,
                out_office_start_time: _.isNull(this.outOfficeStartTime) ? null : Moment(this.outOfficeStartTime).format(DATETIMEFORMAT),
                out_office_end_time: _.isNull(this.outOfficeEndTime) ? null : Moment(this.outOfficeEndTime).format(DATETIMEFORMAT),
                in_time_change: this.inTimeChange,
                out_time_change: this.outTimeChange,
                normal_change: this.normalChange,
                overtime_code_change: this.overtimeCodeChange,
                early_time: this.earlyTime,
                not_pay_over_time: this.notPayOverTime,
                except: this.except,
                is_suwon: this.isSuwon
            };
        },

        /**
         * Collection 기준으로 Commute Result를 수정한다. 
         * 관리자가 수정하는 화면 (Comment에 의한 수정, 직접 수정) 에서 사용 함
         * 
         * parameter : 
         * 	destCollection : 어제 오늘 내일 3일치 데이터 (없을 경우 적게 들어올 수 있음)
         * 	inData : Object { changeInTime, changeOutTime, changeNormal }
         *  changeHistoryCollection : 관리자 수정 내역을 저장할 Collection
         *  todayIdx : destCollection에서 당일 데이터가 들어있는 Index
         *  
         * 	return resultCommuteCollection(today,tomorrow);
         **/
        modifyByCollection: function(destCommuteCollection, inData, changeHistoryCollection, todayIdx) {
            var dfd = new $.Deferred();
            var that = this;

            var resultCommuteCollection = new CommuteCollection();

            /**
             * 오늘, 내일 데이터를 계산하기전 초기화 한다.
             */
            var currentDayCommute = destCommuteCollection.models[todayIdx];
            var yesterdayCommute = null;
            var nextDayCommute = null;

            if (todayIdx != 0) {
                yesterdayCommute = destCommuteCollection.models[todayIdx - 1];
            }

            if (todayIdx + 1 < destCommuteCollection.length) {
                nextDayCommute = destCommuteCollection.models[todayIdx + 1];
            }

            this.initByModel(currentDayCommute);

            var selectedDate = {
                start: currentDayCommute.get("date"),
                end: Moment(currentDayCommute.get("date"), DATEFORMAT).add(1, "days").format(DATEFORMAT)
            };

            var inOfficeCollection = new InOfficeCollection();
            var outOfficeCollection = new OutOfficeCollection();

            /**
             * 오늘과 내일의 in, out office 내용을 조회한다.
             */
            $.when(
                outOfficeCollection.fetch({
                    data: selectedDate
                }),
                inOfficeCollection.fetch({
                    data: selectedDate
                })
            ).done(function() {
                if (!_.isUndefined(inData.changeInTime)) {
                    that.inTime = Moment(inData.changeInTime);
                    that.inTimeChange += 1;
                }

                if (!_.isUndefined(inData.changeOutTime)) {
                    that.outTime = Moment(inData.changeOutTime);
                    that.outTimeChange += 1;
                }
                
                if (!_.isUndefined(inData.changeNormal)) {
                    that.normal = inData.changeNormal;
                    that.normalChange += 1;
                }
                /**
                 * 어제의 퇴근시간을 가지고 출근 기준 시간을 구한다.
                 */
                var yesterdayOutTime = null;
                if (!_.isNull(yesterdayCommute)) {
                    yesterdayOutTime = yesterdayCommute.get("out_time");
                }
                that.setStandardTime(_.isNull(yesterdayOutTime) ? null : Moment(yesterdayOutTime, DATETIMEFORMAT));

                /**
                 * 조회된 in, out office 내용중 선택된 사용자에 해당하는 데이터가 있는지 확인한다.
                 */
                var userOutOfficeCollection = new OutOfficeCollection(); // 해당 사용자의 OutOffice Collection
                userOutOfficeCollection.add(outOfficeCollection.where({
                    id: that.id
                }));

                var userInOfficeCollection = new InOfficeCollection();
                userInOfficeCollection.add(inOfficeCollection.where({
                    id: that.id
                }));

                /**
                 * 휴일근무 여부를 판단한다.
                 */
                var todayInOffice = new InOfficeCollection(userInOfficeCollection.where({
                    date: selectedDate.start
                }));
                
                that.setInOffice(todayInOffice);

                /**
                 * 휴가, 외근, 출장 여부를 판단한다.
                 */
                var todayOutOffice = userOutOfficeCollection.where({
                    date: selectedDate.start
                });
                that.setOutOffice(todayOutOffice);

                /**
                 * 변경된 사항들은 반영하여 결과값을 산출한다.
                 */
                var currentResult = that.getResult();

                /**
                 * 초과근무를 관리자가 수정한 적이 있을경우는
                 * 계산으로 인해 추가근무가 변경되더라도 적용하지 않는다. 
                 */
                if (!_.isUndefined(inData.changeOvertimeCode)) {
                    currentResult.overtime_code = inData.changeOvertimeCode == "" ? null : inData.changeOvertimeCode;
                    currentResult.overtime_code_change += 1;
                }

                /**
                 * 계산 결과를 resultCommuteCollection에 추가한다.
                 */
                resultCommuteCollection.add(currentResult);

                /**
                 * 오늘의 결과값이 내일의 출근 기준시간에 영향을 줄 수 있으므로
                 * 내일의 결과값이 있을경우 다시 계산한다.
                 */
                if (!_.isNull(nextDayCommute)) {

                    that.initByModel(nextDayCommute);

                    /**
                     * 새로 계산된 오늘의 퇴근시간으로 출근 기준시간을 계산한다.
                     */
                    if (currentResult.out_time) {
                        that.setStandardTime(Moment(currentResult.out_time), DATETIMEFORMAT);
                    }

                    /**
                     * 휴일근무 여부를 판단한다.
                     */
                    var tomorrowInOffice = userInOfficeCollection.where({
                        date: selectedDate.end
                    });
                    that.setInOffice(tomorrowInOffice);

                    /**
                     * 휴가, 외근, 출장 여부를 판단한다.
                     */
                    var tomorrowOutOffice = userOutOfficeCollection.where({
                        date: selectedDate.end
                    });
                    that.setOutOffice(tomorrowOutOffice);
                    
                    /**
                     * 계산 결과를 resultCommuteCollection에 추가한다.
                     */
                    var tomorrowResult = that.getResult();
                    resultCommuteCollection.add(tomorrowResult);
                }

                /**
                 * resultCommuteCollection����� 추가된 값들을 DB에 반영한다.
                 */
                resultCommuteCollection.save({
                    success: function() {
                        dfd.resolve(resultCommuteCollection);
                    },
                    error: function() {
                        dfd.reject();
                    }
                }, currentResult.id, changeHistoryCollection);
            });

            return dfd.promise();
        },

        setNewModelData: function(nextDayCommute){
            var dfd = new $.Deferred();
            var that = this;
            that.initByModel(nextDayCommute);
            var selectedDate = {
                start: nextDayCommute.get("date"),
                end: Moment(nextDayCommute.get("date"), DATEFORMAT).add(1, "days").format(DATEFORMAT)
            };

            var inOfficeCollection = new InOfficeCollection();
            var outOfficeCollection = new OutOfficeCollection();

            $.when(
                outOfficeCollection.fetch({
                    data: selectedDate
                }),
                inOfficeCollection.fetch({
                    data: selectedDate
                })
            ).done(function() {
                /**
                 * 조회된 in, out office 내용중 선택된 사용자에 해당하는 데이터가 있는지 확인한다.
                 */
                var userOutOfficeCollection = new OutOfficeCollection(); // 해당 사용자의 OutOffice Collection
                userOutOfficeCollection.add(outOfficeCollection.where({
                    id: that.id
                }));

                var userInOfficeCollection = new InOfficeCollection();
                userInOfficeCollection.add(inOfficeCollection.where({
                    id: that.id
                }));

                /**
                 * 휴일근무 여부를 판단한다.
                 */
                var todayInOffice = new InOfficeCollection(userInOfficeCollection.where({
                    date: selectedDate.start
                }));
                
                that.setInOffice(todayInOffice);

                /**
                 * 휴가, 외근, 출장 여부를 판단한다.
                 */
                var todayOutOffice = userOutOfficeCollection.where({
                    date: selectedDate.start
                });
                that.setOutOffice(todayOutOffice);
                var tomorrowResult = that.getResult();  

                dfd.resolve(tomorrowResult);
            });

            return dfd.promise();

        },
        /**
         * In/Out Office 변경 사항을 적용하여 Commute Result를 수정한다. 
         * 결재로 인해 근태 내역이 변경될때 사용됨 (결재, 결재 취소)
         * 
         * parameter : 
         *  date : 날짜
         *  id : 사용자 ID
         *  type : "in", "out"
         *  model : in/outOfficeModel
         **/
        modifyByInOutOfficeType: function(date, id, type, model) {
            var dfd = new $.Deferred();
            var that = this;
            var commuteCollection = new CommuteCollection();


            /**
             * 선택된 일자에 만들어져 있는 commute result를 조회한다.
             **/
            commuteCollection.fetchDate(date).then(function(result) {
                var currentDayCommute = commuteCollection.where({
                    id: id
                });
                if (currentDayCommute.length > 0) {
                    currentDayCommute = currentDayCommute[0];
                }
                else {
                    console.log({
                        msg: "Fail to fetch commuteCollection"
                    });
                    dfd.resolve();
                    return;
                }
                
                that.initByModel(currentDayCommute);

                var inOfficeCollection = new InOfficeCollection();
                var outOfficeCollection = new OutOfficeCollection();

                var selectedDate = {
                    start: date,
                    end: date
                };

                if (type == "in") {
                    inOfficeCollection.add(model);
                    outOfficeCollection.fetch({
                        data: selectedDate
                    }).done(function() {
                        that.setInOffice(inOfficeCollection);
                        that.setOutOffice(outOfficeCollection.where({
                            id: id,
                            date: date
                        }));
                        
                        var result = that.getResult();
                        dfd.resolve(result);
                    });
                }
                else if (type == "out") {
                    outOfficeCollection.add(model);
                    inOfficeCollection.fetch({
                        data: selectedDate
                    }).done(function() {
                        that.setInOffice(inOfficeCollection.where({
                            id: id,
                            date: date
                        }));
                        that.setOutOffice(outOfficeCollection.where({
                            id: id,
                            date: that.date
                        }));
                        dfd.resolve(that.getResult());
                    });
                }
                else {
                    console.log({
                        msg: "Wrong type (in /out)"
                    });
                    dfd.resolve();
                }

            }, function() {
                dfd.reject();
            });

            return dfd.promise();
        }
    });

    return {
        TIMEFORMAT: TIMEFORMAT,
        DATEFORMAT: DATEFORMAT,
        DATETIMEFORMAT: DATETIMEFORMAT,
        WORKTYPE: WORKTYPE,
        Builder: function() {
            return new Builder();
        }
    };
});