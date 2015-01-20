// Author: sanghee park <novles@naver.com>
// Create Date: 2014.12.18
define([
  'jquery',
  'underscore',
  'backbone',
  'log',
  'dialog',
  'schemas',
  'i18n!nls/common',
  'i18n!nls/error',
  'text!templates/default/form.html',
  'text!templates/default/input.html',
  'text!templates/default/datepicker.html',
  'text!templates/default/combo.html',
  'text!templates/default/hidden.html',
  ], function($, _, Backbone, log, Dialog, Schemas, i18Common, i18nError, FormHTML, InputHTML, DatePickerHTML, ComboHTML, HiddenHTML){
    var LOG=log.getLogger('Form');
    var _formId=0;
    var _inputId=0;
    var _formName="form_";
    
    var _defaultInputType={
        input:{
            getElement:function(data){
                var _InputTemp=_.template(InputHTML);
                var _input=_.noop();
                _input=_InputTemp(data);
                return $(_input);
            }
        },
        date:{
            getElement:function(data){
                var _dateTemp=_.template(DatePickerHTML);
                var _datePicker=_.noop();
                _datePicker=$(_dateTemp(data));
                
                 _datePicker.find("#"+data.id).datetimepicker({
                   pickTime: false,
                   format: data.format
                });
                return _datePicker; 
            }
        },
        combo:{
            getElement:function(data){
                var _comboTemp=_.template(ComboHTML);
                var _combo=_.noop();
                _combo=$(_comboTemp(data));
                
                var _select=_combo.find("select");
                var _options=data.collection.models;
                
                if (_.isArray(data.collection)){
                    for (var index in data.collection){
                        var _option= data.collection[index];
                        var _code=_option.key;
                        var _text=_option.value;
                        if (_code==data.value){
                            _select.append("<option selected='selected' value='"+_code+"'>"+_text+"</option>");
                        } else {
                            _select.append("<option value='"+_code+"'>"+_text+"</option>");
                        }
                    }
                } else {
                    
                    for (var index in _options){
                        var _option= _options[index].attributes;
                        var _code=_option[data.codeKey];
                        var _text=_option[[data.textKey]];
                        if (_code==data.value){
                            _select.append("<option selected='selected' value='"+_code+"'>"+_text+"</option>");
                        } else {
                            _select.append("<option value='"+_code+"'>"+_text+"</option>");
                        }
                    }
                    _select.on('change', function(e){
                        var _text=$(this).find("option:selected").text();
                        if (!_.isUndefined(data.linkField)){
                            $('[data-hidden="'+data.linkField+'"]').val(_text);
                        }
                    });
                }
                
                return _combo;  
            }
        },
        hidden:{
            getElement:function(data){
                var _hiddenTemp=_.template(HiddenHTML);
                var _hidden=_.noop();
                _hidden=$(_hiddenTemp(data));
                return _hidden;  
            }
        }
    };
    var Form = Backbone.View.extend({
        initialize:function(options){
            var _formSchema=Schemas.getSchema('form');
            this.options=_formSchema.getDefault(options);
            
            var _formTemp=_.template(FormHTML);
            this.formTemp=_formTemp;
            this.childs=this.options.childs;
            this.elements=[];
            
            if (_.isUndefined(this.options.form.id)){
                this.id = _formName+(_formId++);    
            }
            
            var autoRender=this.options.autoRender;
            if (autoRender){
                this.render();   
            }
            _.bindAll(this, 'render');
            _.bindAll(this, 'getData');
        },
        render:function(){
            var dfd= new $.Deferred();
            
            var _view=this;
            var _form=$(_view.formTemp(this.options.form));
            var _childs=_view.childs;
            
            for (var i=0; i < _childs.length; i++){// form child make
                var _child=_childs[i];
                if (_.isObject(_child)){
                    var _childement,_type,_config;
                    
                    //child Type check
                    if (_.isUndefined(_child.type)){
                        LOG.error("Input Component type is null.");
                        dfd.reject();
                        return dfd.promise();
                    }
                 
                    _type=_child.type;
                    var _schema=Schemas.getSchema(_type);//default config
                    _config=_schema.getDefault(_child);
                    _config=_.extend(_config, {id:_view.id+"_"+_type+"_"+(_inputId++)}); //setting config
                    
                    _childement=_defaultInputType[_type].getElement(_config);
                    _view.elements.push(_childement);
                    
                    if (!_.isUndefined(_view.el)){
                        _form.append(_childement);     
                    }
                } else {
                    Dialog.error(i18nError.NOT_SUPPORT_FORM_CHILD);
                    dfd.reject();
                }
            }
            _view.form=_form;
            $(_view.el).html(_form);
            dfd.resolve(_view);
            return dfd.promise();
        },
        getData: function() {
            var unindexed_array = this.form.serializeArray();
            var indexed_array= {};
            
            $.map(unindexed_array, function(n, i){
                indexed_array[n['name']] = n['value'];
            });
            return indexed_array;
        }
   });
   return Form;
});