(function(){
  var replaceSpaces = / /g,
      captureTimes = /(\d|\d+?[.]?\d+?)(s|ms)(?!\w)/gi,
      transPre = 'transition' in getComputedStyle(document.documentElement) ? 't' : xtag.prefix.js + 'T',
      transDel = transPre + 'ransitionDelay',
      transDur = transPre + 'ransitionDuration',
      ready = document.readyState == 'complete' ?
        xtag.skipFrame(function(){ ready = false }) :
        xtag.addEvent(document, 'readystatechange', function(){
          if (document.readyState == 'complete') {
            xtag.skipFrame(function(){ ready = false });
            xtag.removeEvent(document, 'readystatechange', ready);
          }
        });

  function parseTimes(style){
    var value = 0;
    style.replace(captureTimes, function(match, time, unit){
      time = parseFloat(time) * (unit === 's' ? 1000 : 1);
      if (time >= value) value = time;
    });
    return value;
  }

  function startTransition(node, name, transitions){
    var current = node.getAttribute('transition');
    if (transitions[current]) clearTimeout(transitions[current].timer);

    node.setAttribute('transition', name);

    var transition = transitions[name],
        max = transition.max;

    if (isNaN(max)) {
      var styles = getComputedStyle(node);
      max = transition.max = parseTimes(styles[transDel]) + parseTimes(styles[transDur]);
    }

    transition.timer = setTimeout(function(){
      node.removeAttribute('transitioning');
      if (transition.after) transition.after.call(node);
      xtag.fireEvent(node, name + '-transition');
    }, max);
  }

  xtag.transition = function(node, name, obj){
    if (node.getAttribute('transition') != name){

      var transitions = node.__transitions__ || (node.__transitions__ = {}),
          options = transitions[name] = obj || {};

      node.setAttribute('transitioning', name);

      if (options.immediate) options.immediate.call(node);

      if (options.before) {
        options.before.call(node);
        if (ready) xtag.skipTransition(node, function(){
          startTransition(node, name, transitions);
        });
        else xtag.skipFrame(function(){
          startTransition(node, name, transitions);
        });
      }
      else xtag.skipFrame(function(){
        startTransition(node, name, transitions);
      });
    }
  };

  xtag.pseudos.transition = {
    onCompiled: function(fn, pseudo){
      var when = pseudo.arguments[0] || 'immediate',
          name = pseudo.arguments[1] || pseudo.key.split(':')[0];
      return function(){
        var options = {},
            args = arguments;
        options[when] = function(){
          return fn.apply(this, args);
        }
        xtag.transition(this, name, options);
      }
    }
  }
})();
