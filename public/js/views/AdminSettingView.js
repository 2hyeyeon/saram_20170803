define([
	'jquery',
	'underscore',
	'backbone',
	'util',
	'cmoment',
	'comboBox',
	'dialog',
	'jqFileDownload',
	'models/MessageModel',
	'models/mobile/MobileModel',
	'models/sm/SessionModel',
	'i18n!nls/common',
	'lib/component/form',
], function($, _, Backbone, Util, Moment,
	ComboBox, Dialog,
	JqFileDownload,
	MessageModel, MobileModel, SessionModel,
	i18nCommon, Form,
) {
	var AdminSettingView = Backbone.View.extend({
    elements: {
      isChangeCleanDay: false
    },
		initialize: function() {
			this.messageModel = new MessageModel();
			this.mobileModel = new MobileModel();
		},
		afterRender: function() {
			var _this = this;
			this.el.find("#btnCreateExcel").click(function() {
				var _formObj = _this.getSearchForm();
				if (_formObj == null) {
					return;
				}

				Dialog.loading({
					action: function() {
						var dfd = new $.Deferred();
						var url = "";
						var isCsv = true;

						if (_formObj.reportType == "commuteYear") {
							url = "/report/commuteYearReport";
							isCsv = false;
						}
						else if (_formObj.reportType == "commuteYear_csv") {
							url = "/report/commuteYearReport";
							isCsv = true;
						}
						else if (_formObj.reportType == "commuteYear25") {
							url = "/report/commuteYearReport25";
							isCsv = false;
						}
						else if (_formObj.reportType == "commuteYear25_csv") {
							url = "/report/commuteYearReport25";
							isCsv = true;
						}
						else if (_formObj.reportType == "commuteResult") {
							url = "/report/commuteResultTblReport";
						}
						else {
							new Error("Error: Invalid report type.");
						}

						url += "?startTime=" + _formObj.startTime + "&endTime=" + _formObj.endTime + "&isInLeaveWorker=" + _formObj.isInLeaveWorker + "&csv=" + isCsv;

						$.fileDownload(url, {
							successCallback: function(url) {
								dfd.resolve();
							},
							failCallback: function(html, url) {
								dfd.reject();
							}
						});
						return dfd.promise();
					},

					actionCallBack: function(res) { //response schema

					},
					errorCallBack: function(response) {
						Dialog.error("보고서 생성 실패");
					},
				});


			});

			this.el.find("#btnCreateMsg").click(function() {
				var messageModel = new MessageModel(_this.getMessageForm());
				messageModel.save().then(function(result) {
					Dialog.info("공지사항 설정을 변경했습니다.");
				}, function(result) {
					Dialog.error("공지사항 변경 실패!!")
				})
      });
      
      this.el.find("#btnSetCleanDay").click(function() {
        var data = _this.form.getData();
				var param = {
          text: data.cleanDate,
          visible: (data.chkCleanDay === true ? 1 : 0)
        }
        Util.ajaxCall("/cleanDay", "POST", param).then(function(){
          _this.elements.isChangeCleanDay = true;
					Dialog.info("클린데이 설정을 변경했습니다.");
				}, function() {
					Dialog.error("클린데이 변경 실패!!");
				})
      });
      
      this.el.find("#settingVersion").click(function() {
        var data = _this.form.getData();
        var version = data.versionTextArea;
        if ('' == version) {
          return;
        } else {
          var param = {
            version : version
          }
          var mobileModel = new MobileModel(param);
          mobileModel.save().then(function(result) {
            Dialog.info("최신 버전을 변경했습니다.");
          }, function() {
            Dialog.error("버전 변경 실패!!");
          });
        };
      });
		},

		render: function(el) {
			var dfd = new $.Deferred();
			this.el = el;

			var _view = this;

			this.messageModel.fetch({
				success: function() {

          _view.mobileModel.fetch({
            success: function() {
              Util.ajaxCall("/cleanDay", "GET").then(function(resultCleanDay){
                var _form = new Form({
                  el: _view.el,
                  form: undefined,
                  group: [{
                    name: "reportGroup",
                    label: "통계 자료 생성",
                    initOpen: true
                  }, {
                    name: "memoGroup",
                    label: "공지 사항 설정",
                    initOpen: true
                  }, {
                    name: "cleanDayGroup",
                    label: "클린데이 설정",
                    initOpen: true
                  }, {
                    name: "mobileVersionGroup",
                    label: "어플리케이션 버전",
                    initOpen: true
                  }],

                  childs: [{
                    type: "datetime",
                    name: "startTime",
                    label: "시작일",
                    value: Moment().startOf('year').format("YYYY-MM-DD"),
                    format: "YYYY-MM-DD",
                    group: "reportGroup"
                  }, {
                    type: "datetime",
                    name: "endTime",
                    label: "종료일",
                    value: Moment().endOf('year').format("YYYY-MM-DD"),
                    format: "YYYY-MM-DD",
                    group: "reportGroup"
                  }, {
                    type: "combo",
                    name: "reportType",
                    label: "자료 선택",
                    collection: [
                      { key: "commuteYear_csv", value: "CSV - 근태 보고서" },
                      { key: "commuteYear25_csv", value: "CSV - 초과근무수당_25" },
                      { key: "commuteYear", value: "XLS - 근태 보고서" },
                      { key: "commuteYear25", value: "XLS - 초과근무수당_25" },
                      { key: "commuteResult", value: "CSV - 근태 DB 자료" }
                    ],
                    group: "reportGroup"
                  }, {
                    type: "checkBox",
                    name: "chkleaveWorker",
                    label: "&nbsp",
                    checkLabel: '퇴사자 포함',
                    value: false,
                    group: "reportGroup",
                    full: false
                  }, {
                    type: "text",
                    name: "msgTextArea",
                    label: "공지사항",
                    value: _view.messageModel.get("text"),
                    group: "memoGroup"
                  }, {
                    type: "checkBox",
                    name: "chkMsgVisible",
                    label: "&nbsp",
                    checkLabel: '공지 표시',
                    value: (_view.messageModel.get("visible") == 1) ? true : false,
                    group: "memoGroup",
                    full: true
                  }, {
                    type: "date",
                    name: "cleanDate",
                    label: "클린데이",
                    value: resultCleanDay.text,
                    format: "YYYY-MM-DD",
                    group: "cleanDayGroup"
                  }, {
                    type: "checkBox",
                    name: "chkCleanDay",
                    label: "&nbsp",
                    checkLabel: '표시',
                    value: (resultCleanDay.visible == 1) ? true : false,
                    group: "cleanDayGroup",
                    full: false
                  }, {
                    type: "input",
                    name: "versionTextArea",
                    label: "버전",
                    value: _view.mobileModel.get("version"),
                    group: "mobileVersionGroup",
                    full: true
                  }]
                });

                _form.render().done(function(result) {
                  _view.form = _form;

                  var panels = _view.el.find('.panel-body');
                  var tmpl = '<button id="btnCreateExcel" class="btn btn-success btn-block " type="button">Excel 생성</button>';
                  $(panels[0]).append(tmpl);

                  tmpl = '<button id="btnCreateMsg" class="btn btn-success btn-block " type="button">공지 설정</button>';
                  $(panels[1]).append(tmpl);
                  
                  tmpl = '<button id="btnSetCleanDay" class="btn btn-success btn-block " type="button">설정</button>';
                  $(panels[2]).append(tmpl);

                  tmpl = '<button id="settingVersion" class="btn btn-success btn-block " type="button">버전 설정</button>';
                  $(panels[3]).append(tmpl);

                  dfd.resolve(_view);
                }).fail(function() {
                  dfd.reject();
                });

                // el.find("#msgTextArea").val(_this.messageModel.get("text"));
                //    			if(_this.messageModel.get("visible") == 1){
                //    				el.find("#chkMsgVisible").prop("checked", true);		
                //    			};
                // dfd.resolve(_this);		
              });
            }
          });
        }
      });
			return dfd.promise();
		},
		getSearchForm: function() { // 검색 조건

			var _view = this,
				_form = this.form,
				_data = _form.getData();
			var selDataObj = {
				reportType: _data.reportType,
				startTime: _data.startTime,
				endTime: _data.endTime,
				isInLeaveWorker: _data.chkleaveWorker
			};

			if (selDataObj.startTime == "" || selDataObj.endTime == "") {
				Dialog.warning("날짜를 입력하시기 바랍니다.");
				return null;
			}
			else if (selDataObj.startTime.substring(0, 4) != selDataObj.endTime.substring(0, 4)) {
				Dialog.warning("동일한 해(년) 기간을 선택해주시기 바랍니다.");
				return null;
			}

			return selDataObj;
		},

		getMessageForm: function() {
			var _view = this,
				_form = this.form,
				_data = _form.getData();
			return {
				text: _data.msgTextArea,
				visible: _data.chkMsgVisible
			};
    },
    
    isChangeCleanDay: function() {
      return this.elements.isChangeCleanDay;
    }
	});

	return AdminSettingView;
});
