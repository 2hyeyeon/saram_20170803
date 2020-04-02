define([
  'jquery',
  'underscore',
  'backbone',
  'core/BaseView',
  'grid',
  'schemas',
  'dialog',
  'i18n!nls/common',
  'text!templates/default/head.html',
  'text!templates/default/content.html',
  'text!templates/layout/default.html',
  'text!templates/default/row.html',
  'text!templates/default/rowcombo.html',
  
  'collection/common/HolidayCollection',
  'models/common/HolidayModel',
  'views/Holiday/popup/CreateHolidayPopup',
  'views/Holiday/popup/AddHolidayPopup',
], function(
    $, _, Backbone, BaseView, Grid, Schemas, Dialog, i18nCommon,
    HeadHTML, ContentHTML, LayoutHTML,RowHTML, RowComboHTML,
    HolidayCollection, HolidayModel,
    CreateHolidayPopup, AddHolidayPopup
){
    
    var holidayManagerView = BaseView.extend({
        el:".main-container",
        
    	initialize:function(){
    	    this.holidayCollection = new HolidayCollection();
    	    
    		this.gridOption = {
    		    el:"holidayList_content",
    		    id:"holidayListTable",
    		    column:[
    		        i18nCommon.HOLIDAY_MANAGER.GRID_COL_NAME.DATE,
    		        i18nCommon.HOLIDAY_MANAGER.GRID_COL_NAME.MEMO
    		    ],
    		    dataschema:["date", "memo"],
    		    collection:this.holidayCollection,
    		    detail: true,
    		    fetch:false,
    		    buttons:["search"],
    		    order: [[1,"asc"]]
    		};
    		
            this._buttonInit();
    	},
    	events : {
            "change #hoCombo" : "_renderTable"
        },
    	_addAddBtn: function(){
    	    var that = this;
    	    this.gridOption.buttons.push({
    	        type:"custom",
    	        name:"add",
    	        tooltip:i18nCommon.HOLIDAY_MANAGER.ADD_DIALOG.TOOLTIP,
    	        click:function(){
    	            var addHolidayPopup = new AddHolidayPopup();
    	            Dialog.show({
    	                title:i18nCommon.HOLIDAY_MANAGER.ADD_DIALOG.TITLE, 
                        content:addHolidayPopup, 
                        buttons: [{
                            id: 'addHolidayBtn',
                            cssClass: Dialog.CssClass.SUCCESS,
                            label: i18nCommon.HOLIDAY_MANAGER.ADD_DIALOG.BUTTON.ADD,
                            action: function(dialog) {
                                addHolidayPopup.addHoliday().then(
                                    function(){
                                        dialog.close();
                                        that._renderTable();
										Dialog.info(i18nCommon.HOLIDAY_MANAGER.ADD_DIALOG.MSG.HOLIDAY_ADD_COMPLETE);
                                    }, function(){
                                        dialog.close(i18nCommon.HOLIDAY_MANAGER.ADD_DIALOG.MSG.HOLIDAY_ADD_FAIL);
                                        Dialog.error();
                                    }
                                );
                            }
                        }, {
                            label : i18nCommon.HOLIDAY_MANAGER.ADD_DIALOG.BUTTON.CANCEL,
                            action : function(dialog){
                                dialog.close();
                            }
                        }]
    	            });
    	        }
    	    });
    	},
    	_addRemoveBtn : function(){
    	    var that = this;
    	    this.gridOption.buttons.push({
    	       type:"custom",
    	        name:"remove",
    	        tooltip: i18nCommon.HOLIDAY_MANAGER.REMOVE_DIALOG.TOOLTIP,
    	        click:function(_grid){ 
    	            var selectedItem = _grid.getSelectItem();
    	            if(_.isUndefined(selectedItem)){
    	                Dialog.error(i18nCommon.HOLIDAY_MANAGER.REMOVE_DIALOG.MSG.NOTING_SELECTED);
    	                return;
    	            }
    	            selectedItem["_date"] = selectedItem.date;
    	            var selectHolidayModel = new HolidayModel(selectedItem);
    	            selectHolidayModel.destroy({
    	                success : function(){
    	                    that._renderTable();
    	                    Dialog.info(i18nCommon.HOLIDAY_MANAGER.REMOVE_DIALOG.MSG.HOLIDAY_REMOVE_COMPLETE);    
    	                },
    	                error : function(){
    	                    Dialog.error(i18nCommon.HOLIDAY_MANAGER.REMOVE_DIALOG.MSG.HOLIDAY_REMOVE_FAIL);    
    	                }
    	            });
    	        }
    	    });
    	},
    	_addToolBtn: function(){
    	    var that = this;
    	    this.gridOption.buttons.push({
    	        type:"custom",
    	        name:"wrench",
    	        tooltip:i18nCommon.HOLIDAY_MANAGER.CREATE_DIALOG.TOOLTIP,
    	        click:function(_grid){
    	            var createHolidayPopup = new CreateHolidayPopup();
    	            Dialog.show({
    	                title:i18nCommon.HOLIDAY_MANAGER.CREATE_DIALOG.TITLE, 
                        content:createHolidayPopup, 
                        buttons: [{
                            id: 'createHolidayBtn',
                            cssClass: Dialog.CssClass.SUCCESS,
                            label: i18nCommon.HOLIDAY_MANAGER.CREATE_DIALOG.BUTTON.CREATE,
                            action: function(dialog) {
                                createHolidayPopup.createHoliday().then(
                                    function(){
                                        Dialog.info(i18nCommon.HOLIDAY_MANAGER.CREATE_DIALOG.MSG.HOLIDAY_CREATE_COMPLETE);
                                        that._renderTable();
                                        dialog.close();
                                    },
                                    function(){
                                        Dialog.error(i18nCommon.HOLIDAY_MANAGER.CREATE_DIALOG.MSG.HOLIDAY_CREATE_FAIL);
                                        dialog.close();
                                    }
                                );
                            }
                        }, {
                            label : i18nCommon.HOLIDAY_MANAGER.CREATE_DIALOG.BUTTON.CANCEL,
                            action : function(dialog){
                                dialog.close();
                            }
                        }]
    	            });
    	        }
    	    });
 
    	},
    	_buttonInit: function(){
    	    this._addAddBtn();
    	    this._addRemoveBtn();
    	    this._addToolBtn();
    	},
        
    	render:function(){
    	    var _headSchema=Schemas.getSchema('headTemp');
    	    var _headTemp=_.template(HeadHTML);
    	    var _layOut=$(LayoutHTML);
    	    var _head=$(_headTemp(_headSchema.getDefault({title:i18nCommon.HOLIDAY_MANAGER.TITLE, subTitle:i18nCommon.HOLIDAY_MANAGER.SUB_TITLE})));
    	    
    	    _head.addClass("no-margin");
    	    _head.addClass("relative-layout");

    	    var _content=$(ContentHTML).attr("id", this.gridOption.el);
    	    var _gridSchema=Schemas.getSchema('grid');
    	    this.grid= new Grid(_gridSchema.getDefault(this.gridOption));
    	    
    	    	
        	var _row=$(RowHTML);
	        var _combo = $(_.template(RowComboHTML)({
    	            obj : { id : "hoCombo", label : "연도"}
    	        })
	        );
	        
    	    _row.append(_combo);
    	    
    	    _layOut.append(_head);
    	    _layOut.append(_row);
    	    _layOut.append(_content);
    	    
    	    $(this.el).html(_layOut);
    	    
            this._setYearCombo();
    	    this._renderTable();
            return this;
     	},
     	
     	_setYearCombo : function(){
     	    var today = new Date();
    	    var year = today.getFullYear();
    	    for(var i = -1; i< 5; i++){
                $(this.el).find("#hoCombo").append($("<option>"+(year + i)+"</option>"));
            }
    	    $(this.el).find("#hoCombo").val(year);
     	},
     	_renderTable: function(){
            var that=this;
            var _yearCombo = $(this.el).find("#hoCombo");
            var year = _yearCombo.val();
            this.holidayCollection.fetch({
                data : {  
                    year : year
                },
                success : function(){
                    that.grid.render();
                }
            });
        },
    });
    
    
    return holidayManagerView;
});