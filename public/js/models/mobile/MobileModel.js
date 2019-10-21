define([
    'jquery',
    'underscore',
    'backbone'
  ], function($, _,Backbone){
      
      var MobileModel = Backbone.Model.extend({
          urlRoot: '/mobile/mobileVersion',
          idAttribute:"_id",
          initialize: function () {
          },
          default:{
              version : null
          },
      });
      
      return MobileModel;
  });