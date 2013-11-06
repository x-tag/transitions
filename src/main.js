(function(){

  var replaceSpaces = / /g,
      captureTimes = /(\d|\d+?[.]?\d+?)(s|ms)(?!\w)/gi;
    
  function getTransitions(node){
    return node.__transitions__ = node.__transitions__ || {};
  }
  
  xtag.addEvents(document, {
    transitionend: function(e){
      var node = e.target,
          name = node.getAttribute('transition');
      if (name) {
        var i = max = 0,
            prop = null,
            style = getComputedStyle(node),
            transitions = getTransitions(node),
            props = (style.transitionProperty || style[xtag.prefix.js + 'TransitionProperty']).replace(replaceSpaces, '').split(',');
        (style.transitionDuration || style[xtag.prefix.js + 'TransitionDuration']).replace(captureTimes, function(match, time, unit){
          var time = parseFloat(time) * (unit === 's' ? 1000 : 1);
          if (time > max) prop = i, max = time;
          i++;
        });
        prop = props[prop];
        if (!prop) throw new SyntaxError('No matching transition property found');
        else if (e.propertyName == prop && transitions[name].after) transitions[name].after();
      }
    }
  });
  
  xtag.transition = function(node, name, obj){
    var options = obj || {},
        transitions = getTransitions(node),
        trans = transitions[name] = transitions[name] || options;
        trans.immediate = options.immediate || trans.immediate;
        trans.before = options.before || trans.before;
        trans.after = options.after || trans.after;
    if (trans.immediate) trans.immediate();
    if (trans.before) {
      trans.before();
      xtag.requestFrame(function(){
        xtag.requestFrame(function(){
          node.setAttribute('transition', name);
        });
      });
    }
    else node.setAttribute('transition', name);
  };
  
  xtag.pseudos.transition = {
    onCompiled: function(fn, pseudo){
      var options = {},
          when = pseudo.arguments[0] || 'immediate',
          name = pseudo.arguments[1] || pseudo.key.split(':')[0];
      return function(){
        var target = this,
            args = xtag.toArray(arguments);
        if (this.hasAttribute('transition')) {
          options[when] = options[when] || function(){
            return fn.apply(target, args);
          }
          xtag.transition(this, name, options);
        }
        else return fn.apply(this, args);
      }
    }
  }

})();