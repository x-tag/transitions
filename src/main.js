(function(){

  var matchNum = /[1-9]/,
      replaceSpaces = / /g,
      captureTimes = /(\d|\d+?[.]?\d+?)(s|ms)(?!\w)/gi;

  function getTransitions(node){
    return node.__transitions__ = node.__transitions__ || {};
  }
  
  function startTransition(node, name, transitions){
    var style = getComputedStyle(node);
    node.setAttribute('transition', name);
    if (transitions[name].after && !(style.transitionDuration || style[xtag.prefix.js + 'TransitionDuration']).match(matchNum)){
      transitions[name].after();
    }
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
    var transitions = getTransitions(node),
        options = transitions[name] = obj || {};
    if (options.immediate) options.immediate();
    if (options.before) {
      options.before();
      xtag.requestFrame(function(){
        xtag.requestFrame(function(){
          startTransition(node, name, transitions);
        });
      });
    }
    else startTransition(node, name, transitions);
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