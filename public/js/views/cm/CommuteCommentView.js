/**
 * Comment 관리
 */
define([
        'jquery',
        'underscore',
        'backbone',
        'util',
        'schemas',
        'grid',
        'dialog',
        'datatables',
        'cmoment',
        'core/BaseView',
        'text!templates/default/head.html',
        'text!templates/default/content.html',
        'text!templates/layout/default.html',
        'text!templates/default/row.html',
        'text!templates/default/datepickerRange.html',
        'text!templates/default/rowbuttoncontainer.html',
        'text!templates/default/rowbutton.html',
        'models/sm/SessionModel',
        'collection/cm/CommentCollection',
        'views/cm/popup/CommentUpdatePopupView',
        'text!templates/cm/searchFormTemplate.html'
], function(
		$, _, Backbone, Util, Schemas, Grid, Dialog, Datatables, Moment, 
		BaseView,
		HeadHTML, ContentHTML, LayoutHTML, RowHTML, DatePickerHTML, RowButtonContainerHTML, RowButtonHTML,
		SessionModel, CommentCollection,
		CommentUpdatePopupView,	searchFormTemplate){
	
	function _getCommentUpdateBtn(view){
		var that = view;
		return {
	        type:"custom",
	        name: (SessionModel.get("user").admin == 1)?"edit" : "read",
	        click:function(_grid){
	        	var selectItem =_grid.getSelectItem();
	        	if ( Util.isNull(selectItem) ) {
        			Dialog.warning("사원을 선택 하여 주시기 바랍니다.");
        			return;
	        	}
	        	
	            var commentUpdatePopupView = new CommentUpdatePopupView(selectItem);	            
	            var buttons = [];
	            
	            if(SessionModel.get("user").admin == 1 && selectItem.state != "처리완료") { // 관리자만 수정 가능
	            	buttons.push({
                        id: 'updateCommentBtn',
                        cssClass: Dialog.CssClass.SUCCESS,
                        label: '수정',
                        action: function(dialog) {
                        	commentUpdatePopupView.updateComment().done(function(result){
                        		Dialog.show("성공", function() {
                        			that.grid.updateRow(result.attributes[0]);	// 업데이트 후 재조회한 데이터 
                    				dialog.close();
                    			});                        		
                            }).fail(function(){
                            	Dialog.show("업데이트가 실패했습니다.");
                            });
                        }
                    });
	            }
	            buttons.push({
                    label : "취소",
                    action : function(dialog){
                        dialog.close();
                    }
                });
	            
	            Dialog.show({
	                title:"Comment 입력", 
                    content: commentUpdatePopupView,
                    buttons: buttons
	            });
	        }
	    };
	}

	var CommuteCommentView = BaseView.extend({
		el:$(".main-container"),
		setSearchParam : function(searchParam) {
			this.searchParam = searchParam; // url + 검색 조건으로 페이지 이동시 조건감들 {id: id, date: date}
		},
		initialize:function(){
    		this.commentCollection = new CommentCollection();
    		this.gridOption = {
        		    el: "commute_content",
        		    id: "commuteDataTable",
        		    column:[
        		    	   { data : "comment_date", "title" : "신청일자"},
    			           { data : "name", "title" : "이름",
     			        	   render: function(data, type, full, meta) {
    			        		   return full.name + "</br>(" + full.id +")";
    			        	   }
    			           },
    			           { data : "date", "title" : "일자" },
    			           { data : "comment", "title" : "접수내용",
     			        	   render: function(data, type, full, meta) {
    			        		   var comment = full.comment; 
    			        		   if (comment.length > 7) {
    			        			   comment = comment.substring(0, 10) + "...";
    			        		   }
    			        		   return comment;
    			        	   }
    			           },
    			           { data : "writer_name", "title" : "작성자",
     			        	   render: function(data, type, full, meta) {
    			        		   return full.writer_name + "</br>(" + full.writer_id +")";
    			        	   }
    			           },
    			           { data : "comment_reply", "title" : "처리내용",
     			        	   render: function(data, type, full, meta) {
    			        		   var comment_reply = full.comment_reply; 
    			        		   if (comment_reply.length > 7) {
    			        			   comment_reply = comment_reply.substring(0, 10) + "...";
    			        		   }
    			        		   return comment_reply;
    			        	   }    			        	   
    			           },
    			           { data : "comment_reply_date", "title" : "업데이트일자"},
    			           { data : "reply_name", "title" : "답변자",
     			        	   render: function(data, type, full, meta) {
    			        		   if (full.reply_id == "" || full.reply_name == "") {
    			        			   return "";
    			        		   } else {
    			        			   return full.reply_name + "</br>(" + full.reply_id +")";  
    			        		   }
    			        	   }
    			           },
    			           { data : "state", "title" : "처리상태"}
             	        ],
        		    collection: this.commentCollection,
        		    dataschema:["date", "name", "comment", "writer_name", "comment_date", "comment_reply", "reply_name", "comment_reply_date", "state"],
        		    detail: true,
        		    buttons: ["search"],
        		    fetch: false
        	};    		
    		this.buttonInit();
		},
		events: {
			'click #ccmSearchBtn' : 'onClickSearchBtn'
		},
		buttonInit: function(){
    	    // tool btn
    	    this.gridOption.buttons.push( _getCommentUpdateBtn(this) );
    	},
		render: function(){
	   	    //var _view=this;
    	    var _headSchema=Schemas.getSchema('headTemp');
    	    var _headTemp=_.template(HeadHTML);
    	    var _layOut=$(LayoutHTML);
    	    var _head=$(_headTemp(_headSchema.getDefault({title:"근태 관리", subTitle:"Comment 관리"})));
    	    
    	    _head.addClass("no-margin");
    	    _head.addClass("relative-layout");

            var _row=$(RowHTML);
    	    var _datepickerRange=$(_.template(DatePickerHTML)(
    	    	{ obj : 
    	    		{
    	    			fromId : "ccmFromDatePicker",
    	    			toId : "ccmToDatePicker"
    	    		}
    	    		
    	    	})
    	    );
    	    var _btnContainer = $(_.template(RowButtonContainerHTML)({
    	            obj: {
    	                id: "ccmBtnContainer"
    	            }
    	        })
    	    );
    	    
    	    var _searchBtn = $(_.template(RowButtonHTML)({
    	            obj: {
    	                id: "ccmSearchBtn",
    	                label: "검색"
    	            }
    	        })
	        );
	        _btnContainer.append(_searchBtn);
	        
    	    _row.append(_datepickerRange);
    	    _row.append(_btnContainer);
    	    
    	    var _content=$(ContentHTML).attr("id", this.gridOption.el);
    	    _layOut.append(_head);
    	    _layOut.append(_row);
    	    _layOut.append(_content);
    	      	    
    	    $(this.el).html(_layOut);

            var today = new Date();
    	    var firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    	    $(this.el).find("#ccmFromDatePicker").datetimepicker({
            	pickTime: false,
		        language: "ko",
		        todayHighlight: true,
		        format: "YYYY-MM-DD",
		        defaultDate: Moment(firstDay).format("YYYY-MM-DD")
            });
            
            $(this.el).find("#ccmToDatePicker").datetimepicker({
            	pickTime: false,
		        language: "ko",
		        todayHighlight: true,
		        format: "YYYY-MM-DD",
		        defaultDate: Moment(today).format("YYYY-MM-DD")
            });
    	    var _gridSchema=Schemas.getSchema('grid');
    	    this.grid= new Grid(_gridSchema.getDefault(this.gridOption));
            this.grid.render();

            if (Util.isNotNull(this.searchParam) ) { // URL로 이동한 경우  셋팅된 검색 조건이 있을 경우 
            	$(this.el).find("#ccmFromDatePicker").data("DateTimePicker").setDate(this.searchParam.date);
     		    $(this.el).find("#ccmToDatePicker").data("DateTimePicker").setDate(this.searchParam.date);
            }
            
            this.selectComments();
            return this;
    	},
    	onClickSearchBtn: function() {
    		this.selectComments();
    	},
     	getSearchForm: function() {	// 검색 조건
     		var data = {
     		    startDate : $(this.el).find("#ccmFromDatePicker").data("DateTimePicker").getDate().format("YYYY-MM-DD"),
     		    endDate : $(this.el).find("#ccmToDatePicker").data("DateTimePicker").getDate().format("YYYY-MM-DD")
     		}
     		
     		if (Util.isNotNull(this.searchParam) ) { // URL로 이동한 경우  셋팅된 검색 조건이 있을 경우 
     			data.id = this.searchParam.id;
     			this.searchParam = null; // url 접속 - 최초 검색 후 초기화 
     		}
     		
     		if ( Util.isNull(data.startDate) ) {
     			alert("검색 시작 날짜를 선택해주세요");
     			return null;
     		} else if ( Util.isNull(data.endDate) ) {
     			alert("검색 끝 날짜를 선택해주세요");
     			return null;
     		}
     		
     		return data;
     	},
     	selectComments: function() {	// 데이터 조회
     		var data = this.getSearchForm();     		
     		if (Util.isNull (data) ) {
     			return;
     		}

            var _this = this;
     		this.commentCollection.fetch({ 
     			data: data,
	 			success: function(result) {
	 				_this.grid.render();
	 			},
	 			error : function(result) {
	 				alert("데이터 조회가 실패했습니다.");
	 			}
     		}); 
     	}
    });
	
	return CommuteCommentView;
});