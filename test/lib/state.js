var sys = require('sys');
/* we use a dict to save the state which can't be passwd to WeChat by 'state', too long */
var __state = { };
var __gid = 0;
/* */
var urlstate = exports.urlstate = {
  /* add a tmp string */
  add: function(str){
     var id = ''+(__gid++);
     __state[id] = str;
     return id;
  },

  
  /* get and delete the tmp string */
  pop: function(id,str){
      var result = __state[id];
      if(result != undefined){
          delete __state[id];
      };
      return result;
  }
};