/**
 * The MIT License
 *
 * Copyright (c) 2010 Adam Abrons and Misko Hevery http://getangular.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function(window, document, previousOnLoad){
////////////////////////////////////

if (typeof document.getAttribute == 'undefined')
  document.getAttribute = function() {};

var consoleNode,
    PRIORITY_FIRST    = -99999,
    PRIORITY_WATCH    = -1000,
    PRIORITY_LAST     =  99999,
    PRIORITY          = {'FIRST': PRIORITY_FIRST, 'LAST': PRIORITY_LAST, 'WATCH':PRIORITY_WATCH},
    NOOP              = 'noop',
    NG_EXCEPTION      = 'ng-exception',
    NG_VALIDATION_ERROR = 'ng-validation-error',
    jQuery            = window['jQuery'] || window['$'], // weirdness to make IE happy
    _                 = window['_'],
    msie              = !!/(msie) ([\w.]+)/.exec(lowercase(navigator.userAgent)),
    jqLite            = jQuery || jqLiteWrap,
    slice             = Array.prototype.slice,
    error             = window['console'] ? bind(window['console'], window['console']['error'] || noop) : noop,
    angular           = window['angular']    || (window['angular'] = {}),
    angularTextMarkup = extensionMap(angular, 'markup'),
    angularAttrMarkup = extensionMap(angular, 'attrMarkup'),
    angularDirective  = extensionMap(angular, 'directive'),
    angularWidget     = extensionMap(angular, 'widget', lowercase),
    angularValidator  = extensionMap(angular, 'validator'),
    angularFilter     = extensionMap(angular, 'filter'),
    angularFormatter  = extensionMap(angular, 'formatter'),
    angularService    = extensionMap(angular, 'service'),
    angularCallbacks  = extensionMap(angular, 'callbacks'),
    nodeName;

function foreach(obj, iterator, context) {
  var key;
  if (obj) {
    if (isFunction(obj)){
      for (key in obj) {
        if (key != 'prototype' && key != 'length' && key != 'name' && obj.hasOwnProperty(key)) {
          iterator.call(context, obj[key], key);
        }
      }
    } else if (obj.forEach) {
      obj.forEach(iterator, context);
    } else if (isObject(obj) && isNumber(obj.length)) {
      for (key = 0; key < obj.length; key++)
        iterator.call(context, obj[key], key);
    } else {
      for (key in obj)
        iterator.call(context, obj[key], key);
    }
  }
  return obj;
}

function foreachSorted(obj, iterator, context) {
  var keys = [];
  for (var key in obj) keys.push(key);
  keys.sort();
  for ( var i = 0; i < keys.length; i++) {
    iterator.call(context, obj[keys[i]], keys[i]);
  }
  return keys;
}


function extend(dst) {
  foreach(arguments, function(obj){
    if (obj !== dst) {
      foreach(obj, function(value, key){
        dst[key] = value;
      });
    }
  });
  return dst;
}

function inherit(parent, extra) {
  return extend(new (extend(function(){}, {prototype:parent}))(), extra);
};

function noop() {}
function identity($) {return $;}
function extensionMap(angular, name, transform) {
  var extPoint;
  return angular[name] || (extPoint = angular[name] = function (name, fn, prop){
    name = (transform || identity)(name);
    if (isDefined(fn)) {
      extPoint[name] = extend(fn, prop || {});
    }
    return extPoint[name];
  });
}

function jqLiteWrap(element) {
  // for some reasons the parentNode of an orphan looks like null but its typeof is object.
  if (element) {
    if (isString(element)) {
      var div = document.createElement('div');
      div.innerHTML = element;
      element = new JQLite(div.childNodes);
    } else if (!(element instanceof JQLite) && isElement(element)) {
      element =  new JQLite(element);
    }
  }
  return element;
}
function isUndefined(value){ return typeof value == 'undefined'; }
function isDefined(value){ return typeof value != 'undefined'; }
function isObject(value){ return typeof value == 'object';}
function isString(value){ return typeof value == 'string';}
function isNumber(value){ return typeof value == 'number';}
function isArray(value) { return value instanceof Array; }
function isFunction(value){ return typeof value == 'function';}
function isTextNode(node) { return nodeName(node) == '#text'; }
function lowercase(value){ return isString(value) ? value.toLowerCase() : value; }
function uppercase(value){ return isString(value) ? value.toUpperCase() : value; }
function trim(value) { return isString(value) ? value.replace(/^\s*/, '').replace(/\s*$/, '') : value; }
function isElement(node) {
  return node && (node.nodeName || node instanceof JQLite || (jQuery && node instanceof jQuery));
}

function HTML(html) {
  this.html = html;
}

if (msie) {
  nodeName = function(element) {
    element = element[0] || element;
    return (element.scopeName && element.scopeName != 'HTML' ) ? uppercase(element.scopeName + ':' + element.nodeName) : element.nodeName;
  };
} else {
  nodeName = function(element) {
    return (element[0] || element).nodeName;
  };
}

function isVisible(element) {
  var rect = element[0].getBoundingClientRect(),
      width = (rect.width || (rect.right||0 - rect.left||0)),
      height = (rect.height || (rect.bottom||0 - rect.top||0));
  return width>0 && height>0;
}

function map(obj, iterator, context) {
  var results = [];
  foreach(obj, function(value, index, list) {
    results.push(iterator.call(context, value, index, list));
  });
  return results;
}
function size(obj) {
  var size = 0;
  if (obj) {
    if (isNumber(obj.length)) {
      return obj.length;
    } else if (isObject(obj)){
      for (key in obj)
        size++;
    }
  }
  return size;
}
function includes(array, obj) {
  for ( var i = 0; i < array.length; i++) {
    if (obj === array[i]) return true;
  }
  return false;
}

function indexOf(array, obj) {
  for ( var i = 0; i < array.length; i++) {
    if (obj === array[i]) return i;
  }
  return -1;
}

function isLeafNode (node) {
  if (node) {
    switch (node.nodeName) {
    case "OPTION":
    case "PRE":
    case "TITLE":
      return true;
    }
  }
  return false;
}

function copy(source, destination){
  if (!destination) {
    if (source) {
      if (isArray(source)) {
        return copy(source, []);
      } else if (isObject(source)) {
        return copy(source, {});
      }
    }
    return source;
  } else {
    if (isArray(source)) {
      while(destination.length) {
        destination.pop();
      }
      for ( var i = 0; i < source.length; i++) {
        destination.push(copy(source[i]));
      }
    } else {
      foreach(destination, function(value, key){
        delete destination[key];
      });
      for ( var key in source) {
        destination[key] = copy(source[key]);
      }
    }
    return destination;
  }
}

function equals(o1, o2) {
  if (o1 == o2) return true;
  var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
  if (t1 == t2 && t1 == 'object') {
    if (o1 instanceof Array) {
      if ((length = o1.length) == o2.length) {
        for(key=0; key<length; key++) {
          if (!equals(o1[key], o2[key])) return false;
        }
        return true;
      }
    } else {
      keySet = {};
      for(key in o1) {
        if (key.charAt(0) !== '$' && !equals(o1[key], o2[key])) return false;
        keySet[key] = true;
      }
      for(key in o2) {
        if (key.charAt(0) !== '$' && keySet[key] !== true) return false;
      }
      return true;
    }
  }
  return false;
}

function setHtml(node, html) {
  if (isLeafNode(node)) {
    if (msie) {
      node.innerText = html;
    } else {
      node.textContent = html;
    }
  } else {
    node.innerHTML = html;
  }
}

function escapeHtml(html) {
  if (!html || !html.replace)
    return html;
  return html.
      replace(/&/g, '&amp;').
      replace(/</g, '&lt;').
      replace(/>/g, '&gt;');
}


function isRenderableElement(element) {
  var name = element && element[0] && element[0].nodeName;
  return name && name.charAt(0) != '#' &&
    !includes(['TR', 'COL', 'COLGROUP', 'TBODY', 'THEAD', 'TFOOT'], name);
}
function elementError(element, type, error) {
  while (!isRenderableElement(element)) {
    element = element.parent() || jqLite(document.body);
  }
  if (element[0]['$NG_ERROR'] !== error) {
    element[0]['$NG_ERROR'] = error;
    if (error) {
      element.addClass(type);
      element.attr(type, error);
    } else {
      element.removeClass(type);
      element.removeAttr(type);
    }
  }
}

function escapeAttr(html) {
  if (!html || !html.replace)
    return html;
  return html.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g,
      '&quot;');
}

function bind(_this, _function) {
  var curryArgs = slice.call(arguments, 2, arguments.length);
  if (typeof _function == 'function') {
    return curryArgs.length == 0 ?
      function() {
        return _function.apply(_this, arguments);
      } :
      function() {
        return _function.apply(_this, curryArgs.concat(slice.call(arguments, 0, arguments.length)));
      };
  } else {
    // in IE, native methods ore not functions and so they can not be bound (but they don't need to be)
    return _function;
  }
}

function outerHTML(node) {
  var temp = document.createElement('div');
  temp.appendChild(node);
  var outerHTML = temp.innerHTML;
  temp.removeChild(node);
  return outerHTML;
}

function toBoolean(value) {
  if (value && value.length !== 0) {
    var v = lowercase("" + value);
    value = !(v == 'f' || v == '0' || v == 'false' || v == 'no' || v == 'n' || v == '[]');
  } else {
    value = false;
  }
  return value;
}

function merge(src, dst) {
  for ( var key in src) {
    var value = dst[key];
    var type = typeof value;
    if (type == 'undefined') {
      dst[key] = fromJson(toJson(src[key]));
    } else if (type == 'object' && value.constructor != array &&
        key.substring(0, 1) != "$") {
      merge(src[key], value);
    }
  }
}

function compile(element, existingScope) {
  var compiler = new Compiler(angularTextMarkup, angularAttrMarkup, angularDirective, angularWidget),
      $element = jqLite(element);
  parent.$element = $element;
  return compiler.compile($element)($element, existingScope);
}
/////////////////////////////////////////////////

function parseKeyValue(keyValue) {
  var obj = {}, key_value, key;
  foreach((keyValue || "").split('&'), function(keyValue){
    if (keyValue) {
      key_value = keyValue.split('=');
      key = unescape(key_value[0]);
      obj[key] = key_value[1] ? unescape(key_value[1]) : true;
    }
  });
  return obj;
}

function toKeyValue(obj) {
  var parts = [];
  foreach(obj, function(value, key){
    parts.push(escape(key) + '=' + escape(value));
  });
  return parts.length ? parts.join('&') : '';
}

function angularInit(config){
  if (config.autobind) {
    // TODO default to the source of angular.js
    var scope = compile(window.document, null, {'$config':config});
    if (config.css)
      scope.$browser.addCss(config.base_url + config.css);
    scope.$init();
  }
}

function angularJsConfig(document, config) {
  var filename = /^(.*)\/angular(-([^\/]*))?.js(#(.*))?$/,
      scripts = document.getElementsByTagName("script"),
      match;
  config = extend({
    base_url: '',
    css: '../css/angular.css'
  }, config);
  for(var j = 0; j < scripts.length; j++) {
    match = (scripts[j].src || "").match(filename);
    if (match) {
      config.base_url = match[1] + '/';
      extend(config, parseKeyValue(match[5]));
      eachAttribute(jqLite(scripts[j]), function(value, name){
        if (/^ng:/.exec(name)) {
          name = name.substring(3).replace(/-/g, '_');
          if (name == 'autobind') value = true;
          config[name] = value;
        }
      });
    }
  }
  return config;
}
array = [].constructor;

function toJson(obj, pretty){
  var buf = [];
  toJsonArray(buf, obj, pretty ? "\n  " : null, []);
  return buf.join('');
}

function toPrettyJson(obj)  {
  return toJson(obj, true);
}

function fromJson(json) {
  if (!json) return json;
  try {
    var parser = new Parser(json, true);
    var expression =  parser.primary();
    parser.assertAllConsumed();
    return expression();
  } catch (e) {
    error("fromJson error: ", json, e);
    throw e;
  }
}

angular['toJson'] = toJson;
angular['fromJson'] = fromJson;

function toJsonArray(buf, obj, pretty, stack){
  if (typeof obj == "object") {
    if (includes(stack, obj)) {
      buf.push("RECURSION");
      return;
    }
    stack.push(obj);
  }
  var type = typeof obj;
  if (obj === null) {
    buf.push("null");
  } else if (type === 'function') {
    return;
  } else if (type === 'boolean') {
    buf.push('' + obj);
  } else if (type === 'number') {
    if (isNaN(obj)) {
      buf.push('null');
    } else {
      buf.push('' + obj);
    }
  } else if (type === 'string') {
    return buf.push(angular['String']['quoteUnicode'](obj));
  } else if (type === 'object') {
    if (obj instanceof Array) {
      buf.push("[");
      var len = obj.length;
      var sep = false;
      for(var i=0; i<len; i++) {
        var item = obj[i];
        if (sep) buf.push(",");
        if (typeof item == 'function' || typeof item == 'undefined') {
          buf.push("null");
        } else {
          toJsonArray(buf, item, pretty, stack);
        }
        sep = true;
      }
      buf.push("]");
    } else if (obj instanceof Date) {
      buf.push(angular['String']['quoteUnicode'](angular['Date']['toString'](obj)));
    } else {
      buf.push("{");
      if (pretty) buf.push(pretty);
      var comma = false;
      var childPretty = pretty ? pretty + "  " : false;
      var keys = [];
      for(var k in obj) {
        if (k.indexOf('$$') === 0 || obj[k] === undefined)
          continue;
        keys.push(k);
      }
      keys.sort();
      for ( var keyIndex = 0; keyIndex < keys.length; keyIndex++) {
        var key = keys[keyIndex];
        try {
          var value = obj[key];
          if (typeof value != 'function') {
            if (comma) {
              buf.push(",");
              if (pretty) buf.push(pretty);
            }
            buf.push(angular['String']['quote'](key));
            buf.push(":");
            toJsonArray(buf, value, childPretty, stack);
            comma = true;
          }
        } catch (e) {
        }
      }
      buf.push("}");
    }
  }
  if (typeof obj == "object") {
    stack.pop();
  }
}
/**
 * Template provides directions an how to bind to a given element.
 * It contains a list of init functions which need to be called to
 * bind to a new instance of elements. It also provides a list
 * of child paths which contain child templates
 */
function Template(priority) {
  this.paths = [];
  this.children = [];
  this.inits = [];
  this.priority = priority || 0;
}

Template.prototype = {
  init: function(element, scope) {
    var inits = {};
    this.collectInits(element, inits);
    foreachSorted(inits, function(queue){
      foreach(queue, function(fn){
        fn(scope);
      });
    });
  },

  collectInits: function(element, inits) {
    var queue = inits[this.priority];
    if (!queue) {
      inits[this.priority] = queue = [];
    }
    element = jqLite(element);
    foreach(this.inits, function(fn) {
      queue.push(function(scope) {
        scope.$tryEval(function(){
          return fn.call(scope, element);
        }, element);
      });
    });

    var i,
        childNodes = element[0].childNodes,
        children = this.children,
        paths = this.paths,
        length = paths.length;
    for (i = 0; i < length; i++) {
      children[i].collectInits(childNodes[paths[i]], inits);
    }
  },


  addInit:function(init) {
    if (init) {
      this.inits.push(init);
    }
  },


  addChild: function(index, template) {
    if (template) {
      this.paths.push(index);
      this.children.push(template);
    }
  },

  empty: function() {
    return this.inits.length === 0 && this.paths.length === 0;
  }
};

///////////////////////////////////
//Compiler
//////////////////////////////////
function Compiler(markup, attrMarkup, directives, widgets){
  this.markup = markup;
  this.attrMarkup = attrMarkup;
  this.directives = directives;
  this.widgets = widgets;
}

Compiler.prototype = {
  compile: function(rawElement) {
    rawElement = jqLite(rawElement);
    var index = 0,
        template,
        parent = rawElement.parent();
    if (parent && parent[0]) {
      parent = parent[0];
      for(var i = 0; i < parent.childNodes.length; i++) {
        if (parent.childNodes[i] == rawElement[0]) {
          index = i;
        }
      }
    }
    template = this.templatize(rawElement, index, 0) || new Template();
    return function(element, parentScope){
      element = jqLite(element);
      var scope = parentScope && parentScope.$eval ?
          parentScope :
          createScope(parentScope || {}, angularService);
      return extend(scope, {
        $element:element,
        $init: function() {
          template.init(element, scope);
          scope.$eval();
          delete scope.$init;
          return scope;
        }
      });
    };
  },

  templatize: function(element, elementIndex, priority){
    var self = this,
        widget,
        directiveFns = self.directives,
        descend = true,
        directives = true,
        template,
        selfApi = {
          compile: bind(self, self.compile),
          comment:function(text) {return jqLite(document.createComment(text));},
          element:function(type) {return jqLite(document.createElement(type));},
          text:function(text) {return jqLite(document.createTextNode(text));},
          descend: function(value){ if(isDefined(value)) descend = value; return descend;},
          directives: function(value){ if(isDefined(value)) directives = value; return directives;}
        };
    try {
      priority = element.attr('ng:eval-order') || priority || 0;
    } catch (e) {
      // for some reason IE throws error under some weird circumstances. so just assume nothing
      priority = priority || 0;
    }
    if (isString(priority)) {
      priority = PRIORITY[uppercase(priority)] || 0;
    }
    template = new Template(priority);
    eachAttribute(element, function(value, name){
      if (!widget) {
        if (widget = self.widgets('@' + name)) {
          widget = bind(selfApi, widget, value, element);
        }
      }
    });
    if (!widget) {
      if (widget = self.widgets(nodeName(element))) {
        widget = bind(selfApi, widget, element);
      }
    }
    if (widget) {
      descend = false;
      directives = false;
      var parent = element.parent();
      template.addInit(widget.call(selfApi, element));
      if (parent && parent[0]) {
        element = jqLite(parent[0].childNodes[elementIndex]);
      }
    }
    if (descend){
      // process markup for text nodes only
      eachTextNode(element, function(textNode){
        var text = textNode.text();
        foreach(self.markup, function(markup){
          markup.call(selfApi, text, textNode, element);
        });
      });
    }

    if (directives) {
      // Process attributes/directives
      eachAttribute(element, function(value, name){
        foreach(self.attrMarkup, function(markup){
          markup.call(selfApi, value, name, element);
        });
      });
      eachAttribute(element, function(value, name){
        template.addInit((directiveFns[name]||noop).call(selfApi, value, element));
      });
    }
    // Process non text child nodes
    if (descend) {
      eachNode(element, function(child, i){
        template.addChild(i, self.templatize(child, i, priority));
      });
    }
    return template.empty() ? null : template;
  }
};

function eachTextNode(element, fn){
  var i, chldNodes = element[0].childNodes || [], chld;
  for (i = 0; i < chldNodes.length; i++) {
    if(isTextNode(chld = chldNodes[i])) {
      fn(jqLite(chld), i);
    }
  }
}

function eachNode(element, fn){
  var i, chldNodes = element[0].childNodes || [], chld;
  for (i = 0; i < chldNodes.length; i++) {
    if(!isTextNode(chld = chldNodes[i])) {
      fn(jqLite(chld), i);
    }
  }
}

function eachAttribute(element, fn){
  var i, attrs = element[0].attributes || [], chld, attr, name, value, attrValue = {};
  for (i = 0; i < attrs.length; i++) {
    attr = attrs[i];
    name = attr.name;
    value = attr.value;
    if (msie && name == 'href') {
      value = decodeURIComponent(element[0].getAttribute(name, 2));
    }
    attrValue[name] = value;
  }
  foreachSorted(attrValue, fn);
}

function getter(instance, path, unboundFn) {
  if (!path) return instance;
  var element = path.split('.');
  var key;
  var lastInstance = instance;
  var len = element.length;
  for ( var i = 0; i < len; i++) {
    key = element[i];
    if (!key.match(/^[\$\w][\$\w\d]*$/))
        throw "Expression '" + path + "' is not a valid expression for accesing variables.";
    if (instance) {
      lastInstance = instance;
      instance = instance[key];
    }
    if (isUndefined(instance)  && key.charAt(0) == '$') {
      var type = angular['Global']['typeOf'](lastInstance);
      type = angular[type.charAt(0).toUpperCase()+type.substring(1)];
      var fn = type ? type[[key.substring(1)]] : undefined;
      if (fn) {
        instance = bind(lastInstance, fn, lastInstance);
        return instance;
      }
    }
  }
  if (!unboundFn && isFunction(instance) && !instance['$$factory']) {
    return bind(lastInstance, instance);
  }
  return instance;
}

function setter(instance, path, value){
  var element = path.split('.');
  for ( var i = 0; element.length > 1; i++) {
    var key = element.shift();
    var newInstance = instance[key];
    if (!newInstance) {
      newInstance = {};
      instance[key] = newInstance;
    }
    instance = newInstance;
  }
  instance[element.shift()] = value;
  return value;
}

///////////////////////////////////

var getterFnCache = {};
var JS_KEYWORDS = {};
foreach(
   ["abstract", "boolean", "break", "byte", "case", "catch", "char", "class", "const", "continue", "debugger", "default",
    "delete", "do", "double", "else", "enum", "export", "extends", "false", "final", "finally", "float", "for", "function", "goto",
    "if", "implements", "import", "ininstanceof", "intinterface", "long", "native", "new", "null", "package", "private",
    "protected", "public", "return", "short", "static", "super", "switch", "synchronized", "this", "throw", "throws",
    "transient", "true", "try", "typeof", "var", "volatile", "void", "while", "with"],
  function(key){ JS_KEYWORDS[key] = true;}
);
function getterFn(path){
  var fn = getterFnCache[path];
  if (fn) return fn;

  var code = 'function (self){\n';
  code += '  var last, fn, type;\n';
  foreach(path.split('.'), function(key) {
    key = (JS_KEYWORDS[key]) ? '["' + key + '"]' : '.' + key;
    code += '  if(!self) return self;\n';
    code += '  last = self;\n';
    code += '  self = self' + key + ';\n';
    code += '  if(typeof self == "function") \n';
    code += '    self = function(){ return last'+key+'.apply(last, arguments); };\n';
    if (key.charAt(1) == '$') {
      // special code for super-imposed functions
      var name = key.substr(2);
      code += '  if(!self) {\n';
      code += '    type = angular.Global.typeOf(last);\n';
      code += '    fn = (angular[type.charAt(0).toUpperCase() + type.substring(1)]||{})["' + name + '"];\n';
      code += '    if (fn)\n';
      code += '      self = function(){ return fn.apply(last, [last].concat(slice.call(arguments, 0, arguments.length))); };\n';
      code += '  }\n';
    }
  });
  code += '  return self;\n}';
  fn = eval('fn = ' + code);
  fn["toString"] = function(){ return code; };

  return getterFnCache[path] = fn;
}

///////////////////////////////////

var compileCache = {};
function expressionCompile(exp){
  if (typeof exp === 'function') return exp;
  var fn = compileCache[exp];
  if (!fn) {
    var parser = new Parser(exp);
    var fnSelf = parser.statements();
    parser.assertAllConsumed();
    fn = compileCache[exp] = extend(
      function(){ return fnSelf(this);},
      {fnSelf: fnSelf});
  }
  return fn;
}

function rethrow(e) { throw e; }
function errorHandlerFor(element, error) {
  elementError(element, NG_EXCEPTION, isDefined(error) ? toJson(error) : error);
}

var scopeId = 0;
function createScope(parent, services, existing) {
  function Parent(){}
  function API(){}
  function Behavior(){}

  var instance, behavior, api, evalLists = {sorted:[]}, servicesCache = extend({}, existing);

  parent = Parent.prototype = (parent || {});
  api = API.prototype = new Parent();
  behavior = Behavior.prototype = new API();
  instance = new Behavior();

  extend(api, {
    'this': instance,
    $id: (scopeId++),
    $parent: parent,
    $bind: bind(instance, bind, instance),
    $get: bind(instance, getter, instance),
    $set: bind(instance, setter, instance),

    $eval: function $eval(exp) {
      var type = typeof exp;
      if (type == 'undefined') {
        for ( var i = 0, iSize = evalLists.sorted.length; i < iSize; i++) {
          for ( var queue = evalLists.sorted[i],
              jSize = queue.length,
              j= 0; j < jSize; j++) {
            instance.$tryEval(queue[j].fn, queue[j].handler);
          }
        }
      } else if (type === 'function') {
        return exp.call(instance);
      } else  if (type === 'string') {
        return expressionCompile(exp).call(instance);
      }
    },

    $tryEval: function (expression, exceptionHandler) {
      var type = typeof expression;
      try {
        if (type == 'function') {
          return expression.call(instance);
        } else if (type == 'string'){
          return expressionCompile(expression).call(instance);
        }
      } catch (e) {
        (instance.$log || {error:error}).error(e);
        if (isFunction(exceptionHandler)) {
          exceptionHandler(e);
        } else if (exceptionHandler) {
          errorHandlerFor(exceptionHandler, e);
        } else if (isFunction(instance.$exceptionHandler)) {
          instance.$exceptionHandler(e);
        }
      }
    },

    $watch: function(watchExp, listener, exceptionHandler) {
      var watch = expressionCompile(watchExp),
          last;
      listener = expressionCompile(listener);
      function watcher(){
        var value = watch.call(instance),
            lastValue = last;
        if (last !== value) {
          last = value;
          instance.$tryEval(function(){
            return listener.call(instance, value, lastValue);
          }, exceptionHandler);
        }
      }
      instance.$onEval(PRIORITY_WATCH, watcher);
      watcher();
    },

    $onEval: function(priority, expr, exceptionHandler){
      if (!isNumber(priority)) {
        exceptionHandler = expr;
        expr = priority;
        priority = 0;
      }
      var evalList = evalLists[priority];
      if (!evalList) {
        evalList = evalLists[priority] = [];
        evalList.priority = priority;
        evalLists.sorted.push(evalList);
        evalLists.sorted.sort(function(a,b){return a.priority-b.priority;});
      }
      evalList.push({
        fn: expressionCompile(expr),
        handler: exceptionHandler
      });
    },

    $become: function(Class) {
      // remove existing
      foreach(behavior, function(value, key){ delete behavior[key]; });
      foreach((Class || noop).prototype, function(fn, name){
        behavior[name] = bind(instance, fn);
      });
      (Class || noop).call(instance);
    }

  });

  if (!parent.$root) {
    api.$root = instance;
    api.$parent = instance;
  }

  function inject(name){
    var service = servicesCache[name], factory, args = [];
    if (isUndefined(service)) {
      factory = services[name];
      if (!isFunction(factory))
        throw "Don't know how to inject '" + name + "'.";
      foreach(factory.inject, function(dependency){
        args.push(inject(dependency));
      });
      servicesCache[name] = service = factory.apply(instance, args);
    }
    return service;
  }

  foreach(services, function(_, name){
    var service = inject(name);
    if (service) {
      setter(instance, name, service);
    }
  });

  return instance;
}
function Lexer(text, parsStrings){
  this.text = text;
  // UTC dates have 20 characters, we send them through parser
  this.dateParseLength = parsStrings ? 20 : -1;
  this.tokens = [];
  this.index = 0;
}

Lexer.OPERATORS = {
    'null':function(self){return null;},
    'true':function(self){return true;},
    'false':function(self){return false;},
    'undefined':noop,
    '+':function(self, a,b){return (isDefined(a)?a:0)+(isDefined(b)?b:0);},
    '-':function(self, a,b){return (isDefined(a)?a:0)-(isDefined(b)?b:0);},
    '*':function(self, a,b){return a*b;},
    '/':function(self, a,b){return a/b;},
    '%':function(self, a,b){return a%b;},
    '^':function(self, a,b){return a^b;},
    '=':function(self, a,b){return setter(self, a, b);},
    '==':function(self, a,b){return a==b;},
    '!=':function(self, a,b){return a!=b;},
    '<':function(self, a,b){return a<b;},
    '>':function(self, a,b){return a>b;},
    '<=':function(self, a,b){return a<=b;},
    '>=':function(self, a,b){return a>=b;},
    '&&':function(self, a,b){return a&&b;},
    '||':function(self, a,b){return a||b;},
    '&':function(self, a,b){return a&b;},
//    '|':function(self, a,b){return a|b;},
    '|':function(self, a,b){return b(self, a);},
    '!':function(self, a){return !a;}
};
Lexer.ESCAPE = {"n":"\n", "f":"\f", "r":"\r", "t":"\t", "v":"\v", "'":"'", '"':'"'};

Lexer.prototype = {
  peek: function() {
    if (this.index + 1 < this.text.length) {
      return this.text.charAt(this.index + 1);
    } else {
      return false;
    }
  },

  parse: function() {
    var tokens = this.tokens;
    var OPERATORS = Lexer.OPERATORS;
    var canStartRegExp = true;
    while (this.index < this.text.length) {
      var ch = this.text.charAt(this.index);
      if (ch == '"' || ch == "'") {
        this.readString(ch);
        canStartRegExp = true;
      } else if (ch == '(' || ch == '[') {
        tokens.push({index:this.index, text:ch});
        this.index++;
      } else if (ch == '{' ) {
        var peekCh = this.peek();
        if (peekCh == ':' || peekCh == '(') {
          tokens.push({index:this.index, text:ch + peekCh});
          this.index++;
        } else {
          tokens.push({index:this.index, text:ch});
        }
        this.index++;
        canStartRegExp = true;
      } else if (ch == ')' || ch == ']' || ch == '}' ) {
        tokens.push({index:this.index, text:ch});
        this.index++;
        canStartRegExp = false;
      } else if ( ch == ':' || ch == '.' || ch == ',' || ch == ';') {
        tokens.push({index:this.index, text:ch});
        this.index++;
        canStartRegExp = true;
      } else if ( canStartRegExp && ch == '/' ) {
        this.readRegexp();
        canStartRegExp = false;
      } else if ( this.isNumber(ch) ) {
        this.readNumber();
        canStartRegExp = false;
      } else if (this.isIdent(ch)) {
        this.readIdent();
        canStartRegExp = false;
      } else if (this.isWhitespace(ch)) {
        this.index++;
      } else {
        var ch2 = ch + this.peek();
        var fn = OPERATORS[ch];
        var fn2 = OPERATORS[ch2];
        if (fn2) {
          tokens.push({index:this.index, text:ch2, fn:fn2});
          this.index += 2;
        } else if (fn) {
          tokens.push({index:this.index, text:ch, fn:fn});
          this.index += 1;
        } else {
          throw "Lexer Error: Unexpected next character [" +
              this.text.substring(this.index) +
              "] in expression '" + this.text +
              "' at column '" + (this.index+1) + "'.";
        }
        canStartRegExp = true;
      }
    }
    return tokens;
  },

  isNumber: function(ch) {
    return '0' <= ch && ch <= '9';
  },

  isWhitespace: function(ch) {
    return ch == ' ' || ch == '\r' || ch == '\t' ||
           ch == '\n' || ch == '\v';
  },

  isIdent: function(ch) {
    return 'a' <= ch && ch <= 'z' ||
           'A' <= ch && ch <= 'Z' ||
           '_' == ch || ch == '$';
  },

  readNumber: function() {
    var number = "";
    var start = this.index;
    while (this.index < this.text.length) {
      var ch = this.text.charAt(this.index);
      if (ch == '.' || this.isNumber(ch)) {
        number += ch;
      } else {
        break;
      }
      this.index++;
    }
    number = 1 * number;
    this.tokens.push({index:start, text:number,
      fn:function(){return number;}});
  },

  readIdent: function() {
    var ident = "";
    var start = this.index;
    while (this.index < this.text.length) {
      var ch = this.text.charAt(this.index);
      if (ch == '.' || this.isIdent(ch) || this.isNumber(ch)) {
        ident += ch;
      } else {
        break;
      }
      this.index++;
    }
    var fn = Lexer.OPERATORS[ident];
    if (!fn) {
      fn = getterFn(ident);
      fn.isAssignable = ident;
    }
    this.tokens.push({index:start, text:ident, fn:fn});
  },

  readString: function(quote) {
    var start = this.index;
    var dateParseLength = this.dateParseLength;
    this.index++;
    var string = "";
    var rawString = quote;
    var escape = false;
    while (this.index < this.text.length) {
      var ch = this.text.charAt(this.index);
      rawString += ch;
      if (escape) {
        if (ch == 'u') {
          var hex = this.text.substring(this.index + 1, this.index + 5);
          this.index += 4;
          string += String.fromCharCode(parseInt(hex, 16));
        } else {
          var rep = Lexer.ESCAPE[ch];
          if (rep) {
            string += rep;
          } else {
            string += ch;
          }
        }
        escape = false;
      } else if (ch == '\\') {
        escape = true;
      } else if (ch == quote) {
        this.index++;
        this.tokens.push({index:start, text:rawString, string:string,
          fn:function(){
            return (string.length == dateParseLength) ?
              angular['String']['toDate'](string) : string;
          }});
        return;
      } else {
        string += ch;
      }
      this.index++;
    }
    throw "Lexer Error: Unterminated quote [" +
        this.text.substring(start) + "] starting at column '" +
        (start+1) + "' in expression '" + this.text + "'.";
  },

  readRegexp: function(quote) {
    var start = this.index;
    this.index++;
    var regexp = "";
    var escape = false;
    while (this.index < this.text.length) {
      var ch = this.text.charAt(this.index);
      if (escape) {
        regexp += ch;
        escape = false;
      } else if (ch === '\\') {
        regexp += ch;
        escape = true;
      } else if (ch === '/') {
        this.index++;
        var flags = "";
        if (this.isIdent(this.text.charAt(this.index))) {
          this.readIdent();
          flags = this.tokens.pop().text;
        }
        var compiledRegexp = new RegExp(regexp, flags);
        this.tokens.push({index:start, text:regexp, flags:flags,
          fn:function(){return compiledRegexp;}});
        return;
      } else {
        regexp += ch;
      }
      this.index++;
    }
    throw "Lexer Error: Unterminated RegExp [" +
        this.text.substring(start) + "] starting at column '" +
        (start+1) + "' in expression '" + this.text + "'.";
  }
};

/////////////////////////////////////////

function Parser(text, parseStrings){
  this.text = text;
  this.tokens = new Lexer(text, parseStrings).parse();
  this.index = 0;
}

Parser.ZERO = function(){
  return 0;
};

Parser.prototype = {
  error: function(msg, token) {
    throw "Token '" + token.text +
      "' is " + msg + " at column='" +
      (token.index + 1) + "' of expression '" +
      this.text + "' starting at '" + this.text.substring(token.index) + "'.";
  },

  peekToken: function() {
    if (this.tokens.length === 0)
      throw "Unexpected end of expression: " + this.text;
    return this.tokens[0];
  },

  peek: function(e1, e2, e3, e4) {
    var tokens = this.tokens;
    if (tokens.length > 0) {
      var token = tokens[0];
      var t = token.text;
      if (t==e1 || t==e2 || t==e3 || t==e4 ||
          (!e1 && !e2 && !e3 && !e4)) {
        return token;
      }
    }
    return false;
  },

  expect: function(e1, e2, e3, e4){
    var token = this.peek(e1, e2, e3, e4);
    if (token) {
      this.tokens.shift();
      this.currentToken = token;
      return token;
    }
    return false;
  },

  consume: function(e1){
    if (!this.expect(e1)) {
      var token = this.peek();
      throw "Expecting '" + e1 + "' at column '" +
          (token.index+1) + "' in '" +
          this.text + "' got '" +
          this.text.substring(token.index) + "'.";
    }
  },

  _unary: function(fn, right) {
    return function(self) {
      return fn(self, right(self));
    };
  },

  _binary: function(left, fn, right) {
    return function(self) {
      return fn(self, left(self), right(self));
    };
  },

  hasTokens: function () {
    return this.tokens.length > 0;
  },

  assertAllConsumed: function(){
    if (this.tokens.length !== 0) {
      throw "Did not understand '" + this.text.substring(this.tokens[0].index) +
          "' while evaluating '" + this.text + "'.";
    }
  },

  statements: function(){
    var statements = [];
    while(true) {
      if (this.tokens.length > 0 && !this.peek('}', ')', ';', ']'))
        statements.push(this.filterChain());
      if (!this.expect(';')) {
        return function (self){
          var value;
          for ( var i = 0; i < statements.length; i++) {
            var statement = statements[i];
            if (statement)
              value = statement(self);
          }
          return value;
        };
      }
    }
  },

  filterChain: function(){
    var left = this.expression();
    var token;
    while(true) {
      if ((token = this.expect('|'))) {
        left = this._binary(left, token.fn, this.filter());
      } else {
        return left;
      }
    }
  },

  filter: function(){
    return this._pipeFunction(angularFilter);
  },

  validator: function(){
    return this._pipeFunction(angularValidator);
  },

  _pipeFunction: function(fnScope){
    var fn = this.functionIdent(fnScope);
    var argsFn = [];
    var token;
    while(true) {
      if ((token = this.expect(':'))) {
        argsFn.push(this.expression());
      } else {
        var fnInvoke = function(self, input){
          var args = [input];
          for ( var i = 0; i < argsFn.length; i++) {
            args.push(argsFn[i](self));
          }
          return fn.apply(self, args);
        };
        return function(){
          return fnInvoke;
        };
      }
    }
  },

  expression: function(){
    return this.throwStmt();
  },

  throwStmt: function(){
    if (this.expect('throw')) {
      var throwExp = this.assignment();
      return function (self) {
        throw throwExp(self);
      };
    } else {
     return this.assignment();
    }
  },

  assignment: function(){
    var left = this.logicalOR();
    var token;
    if (token = this.expect('=')) {
      if (!left.isAssignable) {
        throw "Left hand side '" +
            this.text.substring(0, token.index) + "' of assignment '" +
            this.text.substring(token.index) + "' is not assignable.";
      }
      var ident = function(){return left.isAssignable;};
      return this._binary(ident, token.fn, this.logicalOR());
    } else {
     return left;
    }
  },

  logicalOR: function(){
    var left = this.logicalAND();
    var token;
    while(true) {
      if ((token = this.expect('||'))) {
        left = this._binary(left, token.fn, this.logicalAND());
      } else {
        return left;
      }
    }
  },

  logicalAND: function(){
    var left = this.equality();
    var token;
    if ((token = this.expect('&&'))) {
      left = this._binary(left, token.fn, this.logicalAND());
    }
    return left;
  },

  equality: function(){
    var left = this.relational();
    var token;
    if ((token = this.expect('==','!='))) {
      left = this._binary(left, token.fn, this.equality());
    }
    return left;
  },

  relational: function(){
    var left = this.additive();
    var token;
    if (token = this.expect('<', '>', '<=', '>=')) {
      left = this._binary(left, token.fn, this.relational());
    }
    return left;
  },

  additive: function(){
    var left = this.multiplicative();
    var token;
    while(token = this.expect('+','-')) {
      left = this._binary(left, token.fn, this.multiplicative());
    }
    return left;
  },

  multiplicative: function(){
    var left = this.unary();
    var token;
    while(token = this.expect('*','/','%')) {
        left = this._binary(left, token.fn, this.unary());
    }
    return left;
  },

  unary: function(){
    var token;
    if (this.expect('+')) {
      return this.primary();
    } else if (token = this.expect('-')) {
      return this._binary(Parser.ZERO, token.fn, this.unary());
    } else if (token = this.expect('!')) {
      return this._unary(token.fn, this.unary());
    } else {
     return this.primary();
    }
  },

  functionIdent: function(fnScope) {
    var token = this.expect();
    var element = token.text.split('.');
    var instance = fnScope;
    var key;
    for ( var i = 0; i < element.length; i++) {
      key = element[i];
      if (instance)
        instance = instance[key];
    }
    if (typeof instance != 'function') {
      throw "Function '" + token.text + "' at column '" +
      (token.index+1)  + "' in '" + this.text + "' is not defined.";
    }
    return instance;
  },

  primary: function() {
    var primary;
    if (this.expect('(')) {
      var expression = this.filterChain();
      this.consume(')');
      primary = expression;
    } else if (this.expect('[')) {
      primary = this.arrayDeclaration();
    } else if (this.expect('{')) {
      primary = this.object();
    } else if (this.expect('{:')) {
      primary = this.closure(false);
    } else if (this.expect('{(')) {
      primary = this.closure(true);
    } else {
      var token = this.expect();
      primary = token.fn;
      if (!primary) {
        this.error("not a primary expression", token);
      }
    }
    var next;
    while (next = this.expect('(', '[', '.')) {
      if (next.text === '(') {
        primary = this.functionCall(primary);
      } else if (next.text === '[') {
        primary = this.objectIndex(primary);
      } else if (next.text === '.') {
        primary = this.fieldAccess(primary);
      } else {
        throw "IMPOSSIBLE";
      }
    }
    return primary;
  },

  closure: function(hasArgs) {
    var args = [];
    if (hasArgs) {
      if (!this.expect(')')) {
        args.push(this.expect().text);
        while(this.expect(',')) {
          args.push(this.expect().text);
        }
        this.consume(')');
      }
      this.consume(":");
    }
    var statements = this.statements();
    this.consume("}");
    return function(self) {
      return function($){
        var scope = createScope(self);
        scope['$'] = $;
        for ( var i = 0; i < args.length; i++) {
          setter(scope, args[i], arguments[i]);
        }
        return statements(scope);
      };
    };
  },

  fieldAccess: function(object) {
    var field = this.expect().text;
    var getter = getterFn(field);
    var fn = function (self){
      return getter(object(self));
    };
    fn.isAssignable = field;
    return fn;
  },

  objectIndex: function(obj) {
    var indexFn = this.expression();
    this.consume(']');
    if (this.expect('=')) {
      var rhs = this.expression();
      return function (self){
        return obj(self)[indexFn(self)] = rhs(self);
      };
    } else {
      return function (self){
        var o = obj(self);
        var i = indexFn(self);
        return (o) ? o[i] : undefined;
      };
    }
  },

  functionCall: function(fn) {
    var argsFn = [];
    if (this.peekToken().text != ')') {
      do {
        argsFn.push(this.expression());
      } while (this.expect(','));
    }
    this.consume(')');
    return function (self){
      var args = [];
      for ( var i = 0; i < argsFn.length; i++) {
        args.push(argsFn[i](self));
      }
    var fnPtr = fn(self) || noop;
    // IE stupidity!
    return fnPtr.apply ? 
      fnPtr.apply(self, args) : 
      fnPtr(args[0], args[1], args[2], args[3], args[4]);
    };
  },

  // This is used with json array declaration
  arrayDeclaration: function () {
    var elementFns = [];
    if (this.peekToken().text != ']') {
      do {
        elementFns.push(this.expression());
      } while (this.expect(','));
    }
    this.consume(']');
    return function (self){
      var array = [];
      for ( var i = 0; i < elementFns.length; i++) {
        array.push(elementFns[i](self));
      }
      return array;
    };
  },

  object: function () {
    var keyValues = [];
    if (this.peekToken().text != '}') {
      do {
        var token = this.expect(),
            key = token.string || token.text;
        this.consume(":");
        var value = this.expression();
        keyValues.push({key:key, value:value});
      } while (this.expect(','));
    }
    this.consume('}');
    return function (self){
      var object = {};
      for ( var i = 0; i < keyValues.length; i++) {
        var keyValue = keyValues[i];
        var value = keyValue.value(self);
        object[keyValue.key] = value;
      }
      return object;
    };
  },

  entityDeclaration: function () {
    var decl = [];
    while(this.hasTokens()) {
      decl.push(this.entityDecl());
      if (!this.expect(';')) {
        this.assertAllConsumed();
      }
    }
    return function (self){
      var code = "";
      for ( var i = 0; i < decl.length; i++) {
        code += decl[i](self);
      }
      return code;
    };
  },

  entityDecl: function () {
    var entity = this.expect().text;
    var instance;
    var defaults;
    if (this.expect('=')) {
      instance = entity;
      entity = this.expect().text;
    }
    if (this.expect(':')) {
      defaults = this.primary()(null);
    }
    return function(self) {
      var Entity = self.datastore.entity(entity, defaults);
      setter(self, entity, Entity);
      if (instance) {
        var document = Entity();
        document['$$anchor'] = instance;
        setter(self, instance, document);
        return "$anchor." + instance + ":{" +
            instance + "=" + entity + ".load($anchor." + instance + ");" +
            instance + ".$$anchor=" + angular['String']['quote'](instance) + ";" +
          "};";
      } else {
        return "";
      }
    };
  },

  watch: function () {
    var decl = [];
    while(this.hasTokens()) {
      decl.push(this.watchDecl());
      if (!this.expect(';')) {
        this.assertAllConsumed();
      }
    }
    this.assertAllConsumed();
    return function (self){
      for ( var i = 0; i < decl.length; i++) {
        var d = decl[i](self);
        self.addListener(d.name, d.fn);
      }
    };
  },

  watchDecl: function () {
    var anchorName = this.expect().text;
    this.consume(":");
    var expression;
    if (this.peekToken().text == '{') {
      this.consume("{");
      expression = this.statements();
      this.consume("}");
    } else {
      expression = this.expression();
    }
    return function(self) {
      return {name:anchorName, fn:expression};
    };
  }
};



function Route(template, defaults) {
  this.template = template = template + '#';
  this.defaults = defaults || {};
  var urlParams = this.urlParams = {};
  foreach(template.split(/\W/), function(param){
    if (param && template.match(new RegExp(":" + param + "\\W"))) {
      urlParams[param] = true;
    }
  });
}

Route.prototype = {
  url: function(params) {
    var path = [];
    var self = this;
    var url = this.template;
    params = params || {};
    foreach(this.urlParams, function(_, urlParam){
      var value = params[urlParam] || self.defaults[urlParam] || "";
      url = url.replace(new RegExp(":" + urlParam + "(\\W)"), value + "$1");
    });
    url = url.replace(/\/?#$/, '');
    var query = [];
    foreachSorted(params, function(value, key){
      if (!self.urlParams[key]) {
        query.push(encodeURI(key) + '=' + encodeURI(value));
      }
    });
    url = url.replace(/\/*$/, '');
    return url + (query.length ? '?' + query.join('&') : '');
  }
};

function ResourceFactory(xhr) {
  this.xhr = xhr;
}

ResourceFactory.DEFAULT_ACTIONS = {
  'get':    {method:'GET'},
  'save':   {method:'POST'},
  'query':  {method:'GET', isArray:true},
  'remove': {method:'DELETE'},
  'delete': {method:'DELETE'}
};

ResourceFactory.prototype = {
  route: function(url, paramDefaults, actions){
    var self = this;
    var route = new Route(url);
    actions = extend({}, ResourceFactory.DEFAULT_ACTIONS, actions);
    function extractParams(data){
      var ids = {};
      foreach(paramDefaults || {}, function(value, key){
        ids[key] = value.charAt && value.charAt(0) == '@' ? getter(data, value.substr(1)) : value;
      });
      return ids;
    }

    function Resource(value){
      copy(value || {}, this);
    }

    foreach(actions, function(action, name){
      var isGet = action.method == 'GET';
      var isPost = action.method == 'POST';
      Resource[name] = function (a1, a2, a3) {
        var params = {};
        var data;
        var callback = noop;
        switch(arguments.length) {
        case 3: callback = a3;
        case 2:
          if (isFunction(a2)) {
            callback = a2;
          } else {
            params = a1;
            data = a2;
            break;
          }
        case 1:
          if (isFunction(a1)) callback = a1;
          else if (isPost) data = a1;
          else params = a1;
          break;
        case 0: break;
        default:
          throw "Expected between 0-3 arguments [params, data, callback], got " + arguments.length + " arguments.";
        }

        var value = action.isArray ? [] : new Resource(data);
        self.xhr(
          action.method,
          route.url(extend({}, action.params || {}, extractParams(data), params)),
          data,
          function(status, response, clear) {
            if (status == 200) {
              if (action.isArray) {
                value.length = 0;
                foreach(response, function(item){
                  value.push(new Resource(item));
                });
              } else {
                copy(response, value);
              }
              (callback||noop)(value);
            } else {
              throw {status: status, response:response, message: status + ": " + response};
            }
          },
          action.verifyCache
        );
        return value;
      };

      Resource.bind = function(additionalParamDefaults){
        return self.route(url, extend({}, paramDefaults, additionalParamDefaults), actions);
      };

      if (!isGet) {
        Resource.prototype['$' + name] = function(a1, a2){
          var params = {};
          var callback = noop;
          switch(arguments.length) {
          case 2: params = a1; callback = a2;
          case 1: if (typeof a1 == 'function') callback = a1; else params = a1;
          case 0: break;
          default:
            throw "Expected between 1-2 arguments [params, callback], got " + arguments.length + " arguments.";
          }
          var self = this;
          Resource[name](params, this, function(response){
            copy(response, self);
            callback(self);
          });
        };
      }
    });
    return Resource;
  }
};
//////////////////////////////
// Browser
//////////////////////////////

function Browser(location, document, head) {
  this.delay = 50;
  this.expectedUrl = location.href;
  this.urlListeners = [];
  this.hoverListener = noop;
  this.isMock = false;
  this.outstandingRequests = { count: 0, callbacks:[]};

  this.XHR = window.XMLHttpRequest || function () {
    try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch (e1) {}
    try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch (e2) {}
    try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch (e3) {}
    throw new Error("This browser does not support XMLHttpRequest.");
  };
  this.setTimeout = function(fn, delay) {
   window.setTimeout(fn, delay);
  };

  this.location = location;
  this.document = document;
  this.head = head;
  this.idCounter = 0;
}

Browser.prototype = {

  bind: function() {
    var self = this;
    self.document.bind("mouseover", function(event){
      self.hoverListener(jqLite(msie ? event.srcElement : event.target), true);
      return true;
    });
    self.document.bind("mouseleave mouseout click dblclick keypress keyup", function(event){
      self.hoverListener(jqLite(event.target), false);
      return true;
    });
  },

  hover: function(hoverListener) {
    this.hoverListener = hoverListener;
  },

  addCss: function(url) {
    var doc = this.document[0],
        head = jqLite(doc.getElementsByTagName('head')[0]),
        link = jqLite(doc.createElement('link'));
    link.attr('rel', 'stylesheet');
    link.attr('type', 'text/css');
    link.attr('href', url);
    head.append(link);
  },

  xhr: function(method, url, post, callback){
    if (isFunction(post)) {
      callback = post;
      post = null;
    }
    if (lowercase(method) == 'json') {
      var callbackId = "angular_" + Math.random() + '_' + (this.idCounter++);
      callbackId = callbackId.replace(/\d\./, '');
      var script = this.document[0].createElement('script');
      script.type = 'text/javascript';
      script.src = url.replace('JSON_CALLBACK', callbackId);
      this.head.append(script);
      window[callbackId] = function(data){
        window[callbackId] = undefined;
        callback(200, data);
      };
    } else {
      var xhr = new this.XHR(),
      self = this;
      xhr.open(method, url, true);
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      xhr.setRequestHeader("Accept", "application/json, text/plain, */*");
      xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
      this.outstandingRequests.count ++;
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
          try {
            callback(xhr.status || 200, xhr.responseText);
          } finally {
            self.outstandingRequests.count--;
            self.processRequestCallbacks();
          }
        }
      };
      xhr.send(post || '');
    }
  },

  processRequestCallbacks: function(){
    if (this.outstandingRequests.count === 0) {
      while(this.outstandingRequests.callbacks.length) {
        try {
          this.outstandingRequests.callbacks.pop()();
        } catch (e) {
        }
      }
    }
  },

  notifyWhenNoOutstandingRequests: function(callback){
    if (this.outstandingRequests.count === 0) {
      callback();
    } else {
      this.outstandingRequests.callbacks.push(callback);
    }
  },

  watchUrl: function(fn){
    this.urlListeners.push(fn);
  },

  startUrlWatcher: function() {
   var self = this;
   (function pull () {
     if (self.expectedUrl !== self.location.href) {
       foreach(self.urlListeners, function(listener){
         try {
           listener(self.location.href);
         } catch (e) {
           error(e);
         }
       });
       self.expectedUrl = self.location.href;
     }
     self.setTimeout(pull, self.delay);
   })();
  },

  setUrl: function(url) {
   var existingURL = this.location.href;
   if (!existingURL.match(/#/)) existingURL += '#';
   if (!url.match(/#/)) url += '#';
   if (existingURL != url) {
     this.location.href = this.expectedUrl = url;
   }
  },

  getUrl: function() {
   return this.location.href;
  }
};
//////////////////////////////////
//JQLite
//////////////////////////////////

var jqCache = {};
var jqName = 'ng-' + new Date().getTime();
var jqId = 1;
function jqNextId() { return (jqId++); }

var addEventListener = window.document.attachEvent ?
    function(element, type, fn) {
      element.attachEvent('on' + type, fn);
    } : function(element, type, fn) {
      element.addEventListener(type, fn, false);
    };

var removeEventListener = window.document.detachEvent ?
    function(element, type, fn) {
      element.detachEvent('on' + type, fn);
    } : function(element, type, fn) {
      element.removeEventListener(type, fn, false);
    };

function jqClearData(element) {
  var cacheId = element[jqName],
      cache = jqCache[cacheId];
  if (cache) {
    foreach(cache.bind || {}, function(fn, type){
      removeEventListener(element, type, fn);
    });
    delete jqCache[cacheId];
    if (msie)
      element[jqName] = ''; // ie does not allow deletion of attributes on elements.
    else
      delete element[jqName];
  }
}

function getStyle(element) {
  var current = {}, style = element[0].style, value, name, i;
  if (typeof style.length == 'number') {
    for(i = 0; i < style.length; i++) {
      name = style[i];
      current[name] = style[name];
    }
  } else {
    for (name in style) {
      value = style[name];
      if (1*name != name && name != 'cssText' && value && typeof value == 'string' && value !='false')
        current[name] = value;
    }
  }
  return current;
}

function JQLite(element) {
  if (isElement(element)) {
    this[0] = element;
    this.length = 1;
  } else if (isDefined(element.length) && element.item) {
    for(var i=0; i < element.length; i++) {
      this[i] = element[i];
    }
    this.length = element.length;
  }
}

JQLite.prototype = {
  data: function(key, value) {
    var element = this[0],
        cacheId = element[jqName],
        cache = jqCache[cacheId || -1];
    if (isDefined(value)) {
      if (!cache) {
        element[jqName] = cacheId = jqNextId();
        cache = jqCache[cacheId] = {};
      }
      cache[key] = value;
    } else {
      return cache ? cache[key] : null;
    }
  },

  removeData: function(){
    jqClearData(this[0]);
  },

  dealoc: function(){
    (function dealoc(element){
      jqClearData(element);
      for ( var i = 0, children = element.childNodes; i < children.length; i++) {
        dealoc(children[i]);
      }
    })(this[0]);
  },

  bind: function(type, fn){
    var self = this,
        element = self[0],
        bind = self.data('bind'),
        eventHandler;
    if (!bind) this.data('bind', bind = {});
    foreach(type.split(' '), function(type){
      eventHandler = bind[type];
      if (!eventHandler) {
        bind[type] = eventHandler = function(event) {
          if (!event.preventDefault) {
            event.preventDefault = function(){
              event.returnValue = false;
            };
          }
          foreach(eventHandler.fns, function(fn){
            fn.call(self, event);
          });
        };
        eventHandler.fns = [];
        addEventListener(element, type, eventHandler);
      }
      eventHandler.fns.push(fn);
    });
  },

  trigger: function(type) {
    var evnt = document.createEvent('MouseEvent');
    evnt.initMouseEvent(type, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    this[0].dispatchEvent(evnt);
  },

  replaceWith: function(replaceNode) {
    this[0].parentNode.replaceChild(jqLite(replaceNode)[0], this[0]);
  },

  children: function() {
    return new JQLite(this[0].childNodes);
  },

  append: function(node) {
    var self = this[0];
    node = jqLite(node);
    foreach(node, function(child){
      self.appendChild(child);
    });
  },

  remove: function() {
    this.dealoc();
    var parentNode = this[0].parentNode;
    if (parentNode) parentNode.removeChild(this[0]);
  },

  removeAttr: function(name) {
    this[0].removeAttribute(name);
  },

  after: function(element) {
    this[0].parentNode.insertBefore(jqLite(element)[0], this[0].nextSibling);
  },

  hasClass: function(selector) {
    var className = " " + selector + " ";
    if ( (" " + this[0].className + " ").replace(/[\n\t]/g, " ").indexOf( className ) > -1 ) {
      return true;
    }
    return false;
  },

  removeClass: function(selector) {
    this[0].className = trim((" " + this[0].className + " ").replace(/[\n\t]/g, " ").replace(" " + selector + " ", ""));
  },

  toggleClass: function(selector, condition) {
   var self = this;
   (condition ? self.addClass : self.removeClass).call(self, selector);
  },

  addClass: function( selector ) {
    if (!this.hasClass(selector)) {
      this[0].className = trim(this[0].className + ' ' + selector);
    }
  },

  css: function(name, value) {
    var style = this[0].style;
    if (isString(name)) {
      if (isDefined(value)) {
        style[name] = value;
      } else {
        return style[name];
      }
    } else {
      extend(style, name);
    }
  },

  attr: function(name, value){
    var e = this[0];
    if (isObject(name)) {
      foreach(name, function(value, name){
        e.setAttribute(name, value);
      });
    } else if (isDefined(value)) {
      e.setAttribute(name, value);
    } else {
      var attributes = e.attributes,
          item = attributes ? attributes.getNamedItem(name) : undefined;
      return item && item.specified ? item.value : undefined;
    }
  },

  text: function(value) {
    if (isDefined(value)) {
      this[0].textContent = value;
    }
    return this[0].textContent;
  },

  val: function(value) {
    if (isDefined(value)) {
      this[0].value = value;
    }
    return this[0].value;
  },

  html: function(value) {
    if (isDefined(value)) {
      var i = 0, childNodes = this[0].childNodes;
      for ( ; i < childNodes.length; i++) {
        jqLite(childNodes[i]).dealoc();
      }
      this[0].innerHTML = value;
    }
    return this[0].innerHTML;
  },

  parent: function() {
    return jqLite(this[0].parentNode);
  },

  clone: function() { return jqLite(this[0].cloneNode(true)); }
};

if (msie) {
  extend(JQLite.prototype, {
    text: function(value) {
      var e = this[0];
      // NodeType == 3 is text node
      if (e.nodeType == 3) {
        if (isDefined(value)) e.nodeValue = value;
        return e.nodeValue;
      } else {
        if (isDefined(value)) e.innerText = value;
        return e.innerText;
      }
    },

    trigger: function(type) {
      this[0].fireEvent('on' + type);
    }
  });
}
var angularGlobal = {
  'typeOf':function(obj){
    if (obj === null) return "null";
    var type = typeof obj;
    if (type == "object") {
      if (obj instanceof Array) return "array";
      if (obj instanceof Date) return "date";
      if (obj.nodeType == 1) return "element";
    }
    return type;
  }
};

var angularCollection = {
  'copy': copy,
  'size': size,
  'equals': equals
};
var angularObject = {
  'extend': extend
};
var angularArray = {
  'indexOf': indexOf,
  'include': includes,
  'includeIf':function(array, value, condition) {
    var index = indexOf(array, value);
    if (condition) {
      if (index == -1)
        array.push(value);
    } else {
      array.splice(index, 1);
    }
    return array;
  },
  'sum':function(array, expression) {
    var fn = angular['Function']['compile'](expression);
    var sum = 0;
    for (var i = 0; i < array.length; i++) {
      var value = 1 * fn(array[i]);
      if (!isNaN(value)){
        sum += value;
      }
    }
    return sum;
  },
  'remove':function(array, value) {
    var index = indexOf(array, value);
    if (index >=0)
      array.splice(index, 1);
    return value;
  },
  'find':function(array, condition, defaultValue) {
    if (!condition) return undefined;
    var fn = angular['Function']['compile'](condition);
    foreach(array, function($){
      if (fn($)){
        defaultValue = $;
        return true;
      }
    });
    return defaultValue;
  },
  'findById':function(array, id) {
    return angular.Array.find(array, function($){return $.$id == id;}, null);
  },
  'filter':function(array, expression) {
    var predicates = [];
    predicates.check = function(value) {
      for (var j = 0; j < predicates.length; j++) {
        if(!predicates[j](value)) {
          return false;
        }
      }
      return true;
    };
    var search = function(obj, text){
      if (text.charAt(0) === '!') {
        return !search(obj, text.substr(1));
      }
      switch (typeof obj) {
      case "boolean":
      case "number":
      case "string":
        return ('' + obj).toLowerCase().indexOf(text) > -1;
      case "object":
        for ( var objKey in obj) {
          if (objKey.charAt(0) !== '$' && search(obj[objKey], text)) {
            return true;
          }
        }
        return false;
      case "array":
        for ( var i = 0; i < obj.length; i++) {
          if (search(obj[i], text)) {
            return true;
          }
        }
        return false;
      default:
        return false;
      }
    };
    switch (typeof expression) {
      case "boolean":
      case "number":
      case "string":
        expression = {$:expression};
      case "object":
        for (var key in expression) {
          if (key == '$') {
            (function(){
              var text = (''+expression[key]).toLowerCase();
              if (!text) return;
              predicates.push(function(value) {
                return search(value, text);
              });
            })();
          } else {
            (function(){
              var path = key;
              var text = (''+expression[key]).toLowerCase();
              if (!text) return;
              predicates.push(function(value) {
                return search(getter(value, path), text);
              });
            })();
          }
        }
        break;
      case "function":
        predicates.push(expression);
        break;
      default:
        return array;
    }
    var filtered = [];
    for ( var j = 0; j < array.length; j++) {
      var value = array[j];
      if (predicates.check(value)) {
        filtered.push(value);
      }
    }
    return filtered;
  },
  'add':function(array, value) {
    array.push(isUndefined(value)? {} : value);
    return array;
  },
  'count':function(array, condition) {
    if (!condition) return array.length;
    var fn = angular['Function']['compile'](condition), count = 0;
    foreach(array, function(value){
      if (fn(value)) {
        count ++;
      }
    });
    return count;
  },
  'orderBy':function(array, expression, descend) {
    function reverse(comp, descending) {
      return toBoolean(descending) ?
          function(a,b){return comp(b,a);} : comp;
    }
    function compare(v1, v2){
      var t1 = typeof v1;
      var t2 = typeof v2;
      if (t1 == t2) {
        if (t1 == "string") v1 = v1.toLowerCase();
        if (t1 == "string") v2 = v2.toLowerCase();
        if (v1 === v2) return 0;
        return v1 < v2 ? -1 : 1;
      } else {
        return t1 < t2 ? -1 : 1;
      }
    }
    expression = isArray(expression) ? expression: [expression];
    expression = map(expression, function($){
      var descending = false;
      if (typeof $ == "string" && ($.charAt(0) == '+' || $.charAt(0) == '-')) {
        descending = $.charAt(0) == '-';
        $ = $.substring(1);
      }
      var get = $ ? expressionCompile($).fnSelf : identity;
      return reverse(function(a,b){
        return compare(get(a),get(b));
      }, descending);
    });
    var comparator = function(o1, o2){
      for ( var i = 0; i < expression.length; i++) {
        var comp = expression[i](o1, o2);
        if (comp !== 0) return comp;
      }
      return 0;
    };
    var arrayCopy = [];
    for ( var i = 0; i < array.length; i++) { arrayCopy.push(array[i]); }
    return arrayCopy.sort(reverse(comparator, descend));
  },
  'orderByToggle':function(predicate, attribute) {
    var STRIP = /^([+|-])?(.*)/;
    var ascending = false;
    var index = -1;
    foreach(predicate, function($, i){
      if (index == -1) {
        if ($ == attribute) {
          ascending = true;
          index = i;
          return true;
        }
        if (($.charAt(0)=='+'||$.charAt(0)=='-') && $.substring(1) == attribute) {
          ascending = $.charAt(0) == '+';
          index = i;
          return true;
        }
      }
    });
    if (index >= 0) {
      predicate.splice(index, 1);
    }
    predicate.unshift((ascending ? "-" : "+") + attribute);
    return predicate;
  },
  'orderByDirection':function(predicate, attribute, ascend, descend) {
    ascend = ascend || 'ng-ascend';
    descend = descend || 'ng-descend';
    var att = predicate[0] || '';
    var direction = true;
    if (att.charAt(0) == '-') {
      att = att.substring(1);
      direction = false;
    } else if(att.charAt(0) == '+') {
      att = att.substring(1);
    }
    return att == attribute ? (direction ? ascend : descend) : "";
  },
  'merge':function(array, index, mergeValue) {
    var value = array[index];
    if (!value) {
      value = {};
      array[index] = value;
    }
    merge(mergeValue, value);
    return array;
  }
};

var angularString = {
  'quote':function(string) {
    return '"' + string.replace(/\\/g, '\\\\').
                        replace(/"/g, '\\"').
                        replace(/\n/g, '\\n').
                        replace(/\f/g, '\\f').
                        replace(/\r/g, '\\r').
                        replace(/\t/g, '\\t').
                        replace(/\v/g, '\\v') +
             '"';
  },
  'quoteUnicode':function(string) {
    var str = angular['String']['quote'](string);
    var chars = [];
    for ( var i = 0; i < str.length; i++) {
      var ch = str.charCodeAt(i);
      if (ch < 128) {
        chars.push(str.charAt(i));
      } else {
        var encode = "000" + ch.toString(16);
        chars.push("\\u" + encode.substring(encode.length - 4));
      }
    }
    return chars.join('');
  },
  'toDate':function(string){
    var match;
    if (typeof string == 'string' &&
        (match = string.match(/^(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)Z$/))){
      var date = new Date(0);
      date.setUTCFullYear(match[1], match[2] - 1, match[3]);
      date.setUTCHours(match[4], match[5], match[6], 0);
      return date;
    }
    return string;
  }
};

var angularDate = {
    'toString':function(date){
      function pad(n) { return n < 10 ? "0" + n : n; }
      return  !date ? date :
        date.getUTCFullYear() + '-' +
        pad(date.getUTCMonth() + 1) + '-' +
        pad(date.getUTCDate()) + 'T' +
        pad(date.getUTCHours()) + ':' +
        pad(date.getUTCMinutes()) + ':' +
        pad(date.getUTCSeconds()) + 'Z' ;
    }
  };

var angularFunction = {
  'compile':function(expression) {
    if (isFunction(expression)){
      return expression;
    } else if (expression){
      return expressionCompile(expression).fnSelf;
    } else {
      return identity;
    }
  }
};

function defineApi(dst, chain, underscoreNames){
  if (_) {
    var lastChain = _.last(chain);
    foreach(underscoreNames, function(name){
      lastChain[name] = _[name];
    });
  }
  angular[dst] = angular[dst] || {};
  foreach(chain, function(parent){
    extend(angular[dst], parent);
  });
}
defineApi('Global', [angularGlobal],
    ['extend', 'clone','isEqual',
     'isElement', 'isArray', 'isFunction', 'isUndefined']);
defineApi('Collection', [angularGlobal, angularCollection],
    ['each', 'map', 'reduce', 'reduceRight', 'detect',
     'select', 'reject', 'all', 'any', 'include',
     'invoke', 'pluck', 'max', 'min', 'sortBy',
     'sortedIndex', 'toArray', 'size']);
defineApi('Array', [angularGlobal, angularCollection, angularArray],
    ['first', 'last', 'compact', 'flatten', 'without',
     'uniq', 'intersect', 'zip', 'indexOf', 'lastIndexOf']);
defineApi('Object', [angularGlobal, angularCollection, angularObject],
    ['keys', 'values']);
defineApi('String', [angularGlobal, angularString], []);
defineApi('Date', [angularGlobal, angularDate], []);
//IE bug
angular['Date']['toString'] = angularDate['toString'];
defineApi('Function', [angularGlobal, angularCollection, angularFunction],
    ['bind', 'bindAll', 'delay', 'defer', 'wrap', 'compose']);
var angularFilterGoogleChartApi;

foreach({
  'currency': function(amount){
    this.$element.toggleClass('ng:format-negative', amount < 0);
    return '$' + angularFilter['number'].apply(this, [amount, 2]);
  },

  'number': function(amount, fractionSize){
    if (isNaN(amount) || !isFinite(amount)) {
      return '';
    }
    fractionSize = typeof fractionSize == 'undefined' ? 2 : fractionSize;
    var isNegative = amount < 0;
    amount = Math.abs(amount);
    var pow = Math.pow(10, fractionSize);
    var text = "" + Math.round(amount * pow);
    var whole = text.substring(0, text.length - fractionSize);
    whole = whole || '0';
    var frc = text.substring(text.length - fractionSize);
    text = isNegative ? '-' : '';
    for (var i = 0; i < whole.length; i++) {
      if ((whole.length - i)%3 === 0 && i !== 0) {
        text += ',';
      }
      text += whole.charAt(i);
    }
    if (fractionSize > 0) {
      for (var j = frc.length; j < fractionSize; j++) {
        frc += '0';
      }
      text += '.' + frc.substring(0, fractionSize);
    }
    return text;
  },

  'date': function(date) {
    if (date instanceof Date)
      return date.toLocaleDateString();
    else
      return date;
  },

  'json': function(object) {
    this.$element.addClass("ng-monospace");
    return toJson(object, true);
  },

  'trackPackage': (function(){
    var MATCHERS = [
      { name: "UPS",
        url: "http://wwwapps.ups.com/WebTracking/processInputRequest?sort_by=status&tracknums_displayed=1&TypeOfInquiryNumber=T&loc=en_US&track.x=0&track.y=0&InquiryNumber1=",
        regexp: [
          /^1Z[0-9A-Z]{16}$/i]},
      { name: "FedEx",
        url: "http://www.fedex.com/Tracking?tracknumbers=",
        regexp: [
          /^96\d{10}?$/i,
          /^96\d{17}?$/i,
          /^96\d{20}?$/i,
          /^\d{15}$/i,
          /^\d{12}$/i]},
      { name: "USPS",
        url: "http://trkcnfrm1.smi.usps.com/PTSInternetWeb/InterLabelInquiry.do?origTrackNum=",
        regexp: [
          /^(91\d{20})$/i,
          /^(91\d{18})$/i]}];
    return function(trackingNo, noMatch) {
      trackingNo = trim(trackingNo);
      var tNo = trackingNo.replace(/ /g, '');
      var returnValue;
      foreach(MATCHERS, function(carrier){
        foreach(carrier.regexp, function(regexp){
          if (!returnValue && regexp.test(tNo)) {
            var text = carrier.name + ": " + trackingNo;
            var url = carrier.url + trackingNo;
            returnValue = jqLite('<a></a>');
            returnValue.text(text);
            returnValue.attr('href', url);
          }
        });
      });
      if (returnValue)
        return returnValue;
      else if (trackingNo)
        return noMatch || trackingNo + " is not recognized";
      else
        return null;
    };})(),

  'link': function(obj, title) {
    if (obj) {
      var text = title || obj.text || obj;
      var url = obj.url || obj;
      if (url) {
        if (angular.validator.email(url) === null) {
          url = "mailto:" + url;
        }
        var a = jqLite('<a></a>');
        a.attr('href', url);
        a.text(text);
        return a;
      }
    }
    return obj;
  },


  'bytes': (function(){
    var SUFFIX = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    return function(size) {
      if(size === null) return "";

      var suffix = 0;
      while (size > 1000) {
        size = size / 1024;
        suffix++;
      }
      var txt = "" + size;
      var dot = txt.indexOf('.');
      if (dot > -1 && dot + 2 < txt.length) {
        txt = txt.substring(0, dot + 2);
      }
      return txt + " " + SUFFIX[suffix];
    };
  })(),

  'image': function(obj, width, height) {
    if (obj && obj.url) {
      var style = "", img = jqLite('<img>');
      if (width) {
        img.css('max-width', width + 'px');
        img.css('max-height', (height || width) + 'px');
      }
      img.attr('src', obj.url);
      return img;
    }
    return null;
  },

  'lowercase': lowercase,

  'uppercase': uppercase,

  'linecount': function (obj) {
    if (isString(obj)) {
      if (obj==='') return 1;
      return obj.split(/\n|\f/).length;
    }
    return 1;
  },

  'if': function (result, expression) {
    return expression ? result : undefined;
  },

  'unless': function (result, expression) {
    return expression ? undefined : result;
  },

  'googleChartApi': extend(
    function(type, data, width, height) {
      data = data || {};
      var chart = {
          'cht':type,
          'chco':angularFilterGoogleChartApi['collect'](data, 'color'),
          'chtt':angularFilterGoogleChartApi['title'](data),
          'chdl':angularFilterGoogleChartApi['collect'](data, 'label'),
          'chd':angularFilterGoogleChartApi['values'](data),
          'chf':'bg,s,FFFFFF00'
        };
      if (_.isArray(data['xLabels'])) {
        chart['chxt']='x';
        chart['chxl']='0:|' + data.xLabels.join('|');
      }
      return angularFilterGoogleChartApi['encode'](chart, width, height);
    },
    {
      'values': function(data){
        var seriesValues = [];
        foreach(data['series']||[], function(serie){
          var values = [];
          foreach(serie['values']||[], function(value){
            values.push(value);
          });
          seriesValues.push(values.join(','));
        });
        var values = seriesValues.join('|');
        return values === "" ? null : "t:" + values;
      },

      'title': function(data){
        var titles = [];
        var title = data['title'] || [];
        foreach(_.isArray(title)?title:[title], function(text){
          titles.push(encodeURIComponent(text));
        });
        return titles.join('|');
      },

      'collect': function(data, key){
        var outterValues = [];
        var count = 0;
        foreach(data['series']||[], function(serie){
          var innerValues = [];
          var value = serie[key] || [];
          foreach(_.isArray(value)?value:[value], function(color){
              innerValues.push(encodeURIComponent(color));
              count++;
            });
          outterValues.push(innerValues.join('|'));
        });
        return count?outterValues.join(','):null;
      },

      'encode': function(params, width, height) {
        width = width || 200;
        height = height || width;
        var url = "http://chart.apis.google.com/chart?",
            urlParam = [],
            img = jqLite('<img>');
        params['chs'] = width + "x" + height;
        foreach(params, function(value, key){
          if (value) {
            urlParam.push(key + "=" + value);
          }
        });
        urlParam.sort();
        url += urlParam.join("&");
        img.attr('src', url);
        img.css({width: width + 'px', height: height + 'px'});
        return img;
      }
    }
  ),


  'qrcode': function(value, width, height) {
    return angularFilterGoogleChartApi['encode']({
      'cht':'qr', 'chl':encodeURIComponent(value)}, width, height);
  },
  'chart': {
    'pie':function(data, width, height) {
      return angularFilterGoogleChartApi('p', data, width, height);
    },
    'pie3d':function(data, width, height) {
      return angularFilterGoogleChartApi('p3', data, width, height);
    },
    'pieConcentric':function(data, width, height) {
      return angularFilterGoogleChartApi('pc', data, width, height);
    },
    'barHorizontalStacked':function(data, width, height) {
      return angularFilterGoogleChartApi('bhs', data, width, height);
    },
    'barHorizontalGrouped':function(data, width, height) {
      return angularFilterGoogleChartApi('bhg', data, width, height);
    },
    'barVerticalStacked':function(data, width, height) {
      return angularFilterGoogleChartApi('bvs', data, width, height);
    },
    'barVerticalGrouped':function(data, width, height) {
      return angularFilterGoogleChartApi('bvg', data, width, height);
    },
    'line':function(data, width, height) {
      return angularFilterGoogleChartApi('lc', data, width, height);
    },
    'sparkline':function(data, width, height) {
      return angularFilterGoogleChartApi('ls', data, width, height);
    },
    'scatter':function(data, width, height) {
      return angularFilterGoogleChartApi('s', data, width, height);
    }
  },

  'html': function(html){
    return new HTML(html);
  },

  'linky': function(text){
    if (!text) return text;
    function regExpEscape(text) {
      return text.replace(/([\/\.\*\+\?\|\(\)\[\]\{\}\\])/g, '\\$1');
    }
    var URL = /(ftp|http|https|mailto):\/\/([^\(\)|\s]+)/;
    var match;
    var raw = text;
    var html = [];
    while (match=raw.match(URL)) {
      var url = match[0].replace(/[\.\;\,\(\)\{\}\<\>]$/,'');
      var i = raw.indexOf(url);
      html.push(escapeHtml(raw.substr(0, i)));
      html.push('<a href="' + url + '">');
      html.push(url);
      html.push('</a>');
      raw = raw.substring(i + url.length);
    }
    html.push(escapeHtml(raw));
    return new HTML(html.join(''));
  }
}, function(v,k){angularFilter[k] = v;});

angularFilterGoogleChartApi = angularFilter['googleChartApi'];
function formatter(format, parse) {return {'format':format, 'parse':parse || format};}
function toString(obj) {return (isDefined(obj) && obj !== null) ? "" + obj : obj;}

var NUMBER = /^\s*[-+]?\d*(\.\d*)?\s*$/;

extend(angularFormatter, {
  'noop':formatter(identity, identity),
  'json':formatter(toJson, fromJson),
  'boolean':formatter(toString, toBoolean),
  'number':formatter(toString,
      function(obj){
        if (isString(obj) && NUMBER.exec(obj)) {
          return obj ? 1*obj : null;
        }
        throw "Not a number";
      }),

  'list':formatter(
    function(obj) { return obj ? obj.join(", ") : obj; },
    function(value) {
      var list = [];
      foreach((value || '').split(','), function(item){
        item = trim(item);
        if (item) list.push(item);
      });
      return list;
    }
  ),

  'trim':formatter(
    function(obj) { return obj ? trim("" + obj) : ""; }
  )
});
foreach({
  'noop': function() { return null; },

  'regexp': function(value, regexp, msg) {
    if (!value.match(regexp)) {
      return msg ||
        "Value does not match expected format " + regexp + ".";
    } else {
      return null;
    }
  },

  'number': function(value, min, max) {
    var num = 1 * value;
    if (num == value) {
      if (typeof min != 'undefined' && num < min) {
        return "Value can not be less than " + min + ".";
      }
      if (typeof min != 'undefined' && num > max) {
        return "Value can not be greater than " + max + ".";
      }
      return null;
    } else {
      return "Not a number";
    }
  },

  'integer': function(value, min, max) {
    var numberError = angularValidator['number'](value, min, max);
    if (numberError) return numberError;
    if (!("" + value).match(/^\s*[\d+]*\s*$/) || value != Math.round(value)) {
      return "Not a whole number";
    }
    return null;
  },

  'date': function(value, min, max) {
    if (value.match(/^\d\d?\/\d\d?\/\d\d\d\d$/)) {
      return null;
    }
    return "Value is not a date. (Expecting format: 12/31/2009).";
  },

  'ssn': function(value) {
    if (value.match(/^\d\d\d-\d\d-\d\d\d\d$/)) {
      return null;
    }
    return "SSN needs to be in 999-99-9999 format.";
  },

  'email': function(value) {
    if (value.match(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/)) {
      return null;
    }
    return "Email needs to be in username@host.com format.";
  },

  'phone': function(value) {
    if (value.match(/^1\(\d\d\d\)\d\d\d-\d\d\d\d$/)) {
      return null;
    }
    if (value.match(/^\+\d{2,3} (\(\d{1,5}\))?[\d ]+\d$/)) {
      return null;
    }
    return "Phone number needs to be in 1(987)654-3210 format in North America or +999 (123) 45678 906 internationaly.";
  },

  'url': function(value) {
    if (value.match(/^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/)) {
      return null;
    }
    return "URL needs to be in http://server[:port]/path format.";
  },

  'json': function(value) {
    try {
      fromJson(value);
      return null;
    } catch (e) {
      return e.toString();
    }
  },

  /*
   * cache is attached to the element
   * cache: {
   *   inputs : {
   *     'user input': {
   *        response: server response,
   *        error: validation error
   *     },
   *   current: 'current input'
   * }
   *
   */
  'asynchronous': function(input, asynchronousFn, updateFn) {
    if (!input) return;
    var scope = this;
    var element = scope.$element;
    var cache = element.data('$asyncValidator');
    if (!cache) {
      element.data('$asyncValidator', cache = {inputs:{}});
    }

    cache.current = input;

    var inputState = cache.inputs[input];
    if (!inputState) {
      cache.inputs[input] = inputState = { inFlight: true };
      scope.$invalidWidgets.markInvalid(scope.$element);
      element.addClass('ng-input-indicator-wait');
      asynchronousFn(input, function(error, data) {
        inputState.response = data;
        inputState.error = error;
        inputState.inFlight = false;
        if (cache.current == input) {
          element.removeClass('ng-input-indicator-wait');
          scope.$invalidWidgets.markValid(element);
        }
        element.data('$validate')();
        scope.$root.$eval();
      });
    } else if (inputState.inFlight) {
      // request in flight, mark widget invalid, but don't show it to user
      scope.$invalidWidgets.markInvalid(scope.$element);
    } else {
      (updateFn||noop)(inputState.response);
    }
    return inputState.error;
  }

}, function(v,k) {angularValidator[k] = v;});
angularService("$window", bind(window, identity, window));
angularService("$document", function(window){
  return jqLite(window.document);
}, {inject:['$window']});

var URL_MATCH = /^(file|ftp|http|https):\/\/(\w+:{0,1}\w*@)?([\w\.-]*)(:([0-9]+))?([^\?#]+)(\?([^#]*))?(#(.*))?$/;
var HASH_MATCH = /^([^\?]*)?(\?([^\?]*))?$/;
var DEFAULT_PORTS = {'http': 80, 'https': 443, 'ftp':21};
angularService("$location", function(browser){
  var scope = this,
      location = {parse:parseUrl, toString:toString, update:update},
      lastLocation = {};

  browser.watchUrl(function(url){
    update(url);
    scope.$root.$eval();
  });
  this.$onEval(PRIORITY_FIRST, update);
  this.$onEval(PRIORITY_LAST, update);
  update(browser.getUrl());
  return location;

  function update(href){
    if (href) {
      parseUrl(href);
    } else {
      href = check('href') || checkProtocol();
      var hash = check('hash');
      if (isUndefined(hash)) hash = checkHashPathSearch();
      if (isDefined(hash)) {
        href = (href || location.href).split('#')[0];
        href+= '#' + hash;
      }
      if (isDefined(href)) {
        parseUrl(href);
        browser.setUrl(href);
      }
    }
  }

  function check(param) {
    return lastLocation[param] == location[param] ? undefined : location[param];
  }

  function checkProtocol(){
    if (lastLocation.protocol === location.protocol &&
        lastLocation.host === location.host &&
        lastLocation.port === location.port &&
        lastLocation.path === location.path &&
        equals(lastLocation.search, location.search))
      return undefined;
    var url = toKeyValue(location.search);
    var port = (location.port == DEFAULT_PORTS[location.protocol] ? null : location.port);
    return location.protocol  + '://' + location.host +
          (port ? ':' + port : '') + location.path +
          (url ? '?' + url : '');
  }

  function checkHashPathSearch(){
    if (lastLocation.hashPath === location.hashPath &&
        equals(lastLocation.hashSearch, location.hashSearch) )
      return undefined;
    var url = toKeyValue(location.hashSearch);
    return escape(location.hashPath) + (url ? '?' + url : '');
  }

  function parseUrl(url){
    if (isDefined(url)) {
      var match = URL_MATCH.exec(url);
      if (match) {
        location.href = url.replace('#$', '');
        location.protocol = match[1];
        location.host = match[3] || '';
        location.port = match[5] || DEFAULT_PORTS[location.protocol] || null;
        location.path = match[6];
        location.search = parseKeyValue(match[8]);
        location.hash = match[10] || '';
        match = HASH_MATCH.exec(location.hash);
        location.hashPath = unescape(match[1] || '');
        location.hashSearch = parseKeyValue(match[3]);

        copy(location, lastLocation);
      }
    }
  }

  function toString() {
    update();
    return location.href;
  }
}, {inject: ['$browser']});

angularService("$log", function($window){
  var console = $window.console || {log: noop, warn: noop, info: noop, error: noop},
      log = console.log || noop;
  return {
    log: bind(console, log),
    warn: bind(console, console.warn || log),
    info: bind(console, console.info || log),
    error: bind(console, console.error || log)
  };
}, {inject:['$window']});

angularService('$exceptionHandler', function($log){
  return function(e) {
    $log.error(e);
  };
}, {inject:['$log']});

angularService("$hover", function(browser, document) {
  var tooltip, self = this, error, width = 300, arrowWidth = 10, body = jqLite(document[0].body);;
  browser.hover(function(element, show){
    if (show && (error = element.attr(NG_EXCEPTION) || element.attr(NG_VALIDATION_ERROR))) {
      if (!tooltip) {
        tooltip = {
            callout: jqLite('<div id="ng-callout"></div>'),
            arrow: jqLite('<div></div>'),
            title: jqLite('<div class="ng-title"></div>'),
            content: jqLite('<div class="ng-content"></div>')
        };
        tooltip.callout.append(tooltip.arrow);
        tooltip.callout.append(tooltip.title);
        tooltip.callout.append(tooltip.content);
        body.append(tooltip.callout);
      }
      var docRect = body[0].getBoundingClientRect(),
          elementRect = element[0].getBoundingClientRect(),
          leftSpace = docRect.right - elementRect.right - arrowWidth;
      tooltip.title.text(element.hasClass("ng-exception") ? "EXCEPTION:" : "Validation error...");
      tooltip.content.text(error);
      if (leftSpace < width) {
        tooltip.arrow.addClass('ng-arrow-right');
        tooltip.arrow.css({left: (width + 1)+'px'});
        tooltip.callout.css({
          position: 'fixed',
          left: (elementRect.left - arrowWidth - width - 4) + "px",
          top: (elementRect.top - 3) + "px",
          width: width + "px"
        });
      } else {
        tooltip.arrow.addClass('ng-arrow-left');
        tooltip.callout.css({
          position: 'fixed',
          left: (elementRect.right + arrowWidth) + "px",
          top: (elementRect.top - 3) + "px",
          width: width + "px"
        });
      }
    } else if (tooltip) {
      tooltip.callout.remove();
      tooltip = null;
    }
  });
}, {inject:['$browser', '$document']});

angularService("$invalidWidgets", function(){
  var invalidWidgets = [];
  invalidWidgets.markValid = function(element){
    var index = indexOf(invalidWidgets, element);
    if (index != -1)
      invalidWidgets.splice(index, 1);
  };
  invalidWidgets.markInvalid = function(element){
    var index = indexOf(invalidWidgets, element);
    if (index === -1)
      invalidWidgets.push(element);
  };
  invalidWidgets.visible = function() {
    var count = 0;
    foreach(invalidWidgets, function(widget){
      count = count + (isVisible(widget) ? 1 : 0);
    });
    return count;
  };
  invalidWidgets.clearOrphans = function() {
    for(var i = 0; i < invalidWidgets.length;) {
      var widget = invalidWidgets[i];
      if (isOrphan(widget[0])) {
        invalidWidgets.splice(i, 1);
      } else {
        i++;
      }
    }
  };
  function isOrphan(widget) {
    if (widget == window.document) return false;
    var parent = widget.parentNode;
    return !parent || isOrphan(parent);
  }
  return invalidWidgets;
});

function switchRouteMatcher(on, when, dstName) {
  var regex = '^' + when.replace(/[\.\\\(\)\^\$]/g, "\$1") + '$',
      params = [],
      dst = {};
  foreach(when.split(/\W/), function(param){
    if (param) {
      var paramRegExp = new RegExp(":" + param + "([\\W])");
      if (regex.match(paramRegExp)) {
        regex = regex.replace(paramRegExp, "([^\/]*)$1");
        params.push(param);
      }
    }
  });
  var match = on.match(new RegExp(regex));
  if (match) {
    foreach(params, function(name, index){
      dst[name] = match[index + 1];
    });
    if (dstName) this.$set(dstName, dst);
  }
  return match ? dst : null;
}

angularService('$route', function(location){
  var routes = {},
      onChange = [],
      matcher = switchRouteMatcher,
      parentScope = this,
      dirty = 0,
      $route = {
        routes: routes,
        onChange: bind(onChange, onChange.push),
        when:function (path, params){
          if (angular.isUndefined(path)) return routes;
          var route = routes[path];
          if (!route) route = routes[path] = {};
          if (params) angular.extend(route, params);
          dirty++;
          return route;
        }
      };
  function updateRoute(){
    var childScope;
    $route.current = null;
    angular.foreach(routes, function(routeParams, route) {
      if (!childScope) {
        var pathParams = matcher(location.hashPath, route);
        if (pathParams) {
          childScope = angular.scope(parentScope);
          $route.current = angular.extend({}, routeParams, {
            scope: childScope,
            params: angular.extend({}, location.hashSearch, pathParams)
          });
        }
      }
    });
    angular.foreach(onChange, parentScope.$tryEval);
    if (childScope) {
      childScope.$become($route.current.controller);
      parentScope.$tryEval(childScope.init);
    }
  }
  this.$watch(function(){return dirty + location.hash;}, updateRoute);
  return $route;
}, {inject: ['$location']});

angularService('$xhr', function($browser, $error, $log){
  var self = this;
  return function(method, url, post, callback){
    if (isFunction(post)) {
      callback = post;
      post = null;
    }
    if (post && isObject(post)) {
      post = toJson(post);
    }
    $browser.xhr(method, url, post, function(code, response){
      try {
        if (isString(response) && /^\s*[\[\{]/.exec(response) && /[\}\]]\s*$/.exec(response)) {
          response = fromJson(response);
        }
        if (code == 200) {
          callback(code, response);
        } else {
          $error(
            {method: method, url:url, data:post, callback:callback},
            {status: code, body:response});
        }
      } catch (e) {
        $log.error(e);
      } finally {
        self.$eval();
      }
    });
  };
}, {inject:['$browser', '$xhr.error', '$log']});

angularService('$xhr.error', function($log){
  return function(request, response){
    $log.error('ERROR: XHR: ' + request.url, request, response);
  };
}, {inject:['$log']});

angularService('$xhr.bulk', function($xhr, $error, $log){
  var requests = [],
      scope = this;
  function bulkXHR(method, url, post, callback) {
    if (isFunction(post)) {
      callback = post;
      post = null;
    }
    var currentQueue;
    foreach(bulkXHR.urls, function(queue){
      if (isFunction(queue.match) ? queue.match(url) : queue.match.exec(url)) {
        currentQueue = queue;
      }
    });
    if (currentQueue) {
      if (!currentQueue.requests) currentQueue.requests = [];
      currentQueue.requests.push({method: method, url: url, data:post, callback:callback});
    } else {
      $xhr(method, url, post, callback);
    }
  }
  bulkXHR.urls = {};
  bulkXHR.flush = function(callback){
    foreach(bulkXHR.urls, function(queue, url){
      var currentRequests = queue.requests;
      if (currentRequests && currentRequests.length) {
        queue.requests = [];
        queue.callbacks = [];
        $xhr('POST', url, {requests:currentRequests}, function(code, response){
          foreach(response, function(response, i){
            try {
              if (response.status == 200) {
                (currentRequests[i].callback || noop)(response.status, response.response);
              } else {
                $error(currentRequests[i], response);
              }
            } catch(e) {
              $log.error(e);
            }
          });
          (callback || noop)();
        });
        scope.$eval();
      }
    });
  };
  this.$onEval(PRIORITY_LAST, bulkXHR.flush);
  return bulkXHR;
}, {inject:['$xhr', '$xhr.error', '$log']});

angularService('$xhr.cache', function($xhr){
  var inflight = {}, self = this;;
  function cache(method, url, post, callback, verifyCache){
    if (isFunction(post)) {
      callback = post;
      post = null;
    }
    if (method == 'GET') {
      var data;
      if (data = cache.data[url]) {
        callback(200, copy(data.value));
        if (!verifyCache)
          return;
      }

      if (data = inflight[url]) {
        data.callbacks.push(callback);
      } else {
        inflight[url] = {callbacks: [callback]};
        cache.delegate(method, url, post, function(status, response){
          if (status == 200)
            cache.data[url] = { value: response };
          var callbacks = inflight[url].callbacks;
          delete inflight[url];
          foreach(callbacks, function(callback){
            try {
              (callback||noop)(status, copy(response));
            } catch(e) {
              self.$log.error(e);
            }
          });
        });
      }

    } else {
      cache.data = {};
      cache.delegate(method, url, post, callback);
    }
  }
  cache.data = {};
  cache.delegate = $xhr;
  return cache;
}, {inject:['$xhr.bulk']});

angularService('$resource', function($xhr){
  var resource = new ResourceFactory($xhr);
  return bind(resource, resource.route);
}, {inject: ['$xhr.cache']});
angularDirective("ng:init", function(expression){
  return function(element){
    this.$tryEval(expression, element);
  };
});

angularDirective("ng:controller", function(expression){
  return function(element){
    var controller = getter(window, expression, true) || getter(this, expression, true);
    if (!controller)
      throw "Can not find '"+expression+"' controller.";
    if (!isFunction(controller))
      throw "Reference '"+expression+"' is not a class.";
    this.$become(controller);
    (this.init || noop)();
  };
});

angularDirective("ng:eval", function(expression){
  return function(element){
    this.$onEval(expression, element);
  };
});

angularDirective("ng:bind", function(expression){
  return function(element) {
    var lastValue = noop, lastError = noop;
    this.$onEval(function() {
      var error, value, isHtml, isDomElement,
          oldElement = this.hasOwnProperty('$element') ? this.$element : undefined;
      this.$element = element;
      value = this.$tryEval(expression, function(e){
        error = toJson(e);
      });
      this.$element = oldElement;
      if (lastValue === value && lastError == error) return;
      isHtml = value instanceof HTML,
      isDomElement = isElement(value);
      if (!isHtml && !isDomElement && isObject(value)) {
        value = toJson(value);
      }
      if (value != lastValue || error != lastError) {
        lastValue = value;
        lastError = error;
        elementError(element, NG_EXCEPTION, error);
        if (error) value = error;
        if (isHtml) {
          element.html(value.html);
        } else if (isDomElement) {
          element.html('');
          element.append(value);
        } else {
          element.text(value);
        }
      }
    }, element);
  };
});

var bindTemplateCache = {};
function compileBindTemplate(template){
  var fn = bindTemplateCache[template];
  if (!fn) {
    var bindings = [];
    foreach(parseBindings(template), function(text){
      var exp = binding(text);
      bindings.push(exp ? function(element){
        var error, value = this.$tryEval(exp, function(e){
          error = toJson(e);
        });
        elementError(element, NG_EXCEPTION, error);
        return error ? error : value;
      } : function() {
        return text;
      });
    });
    bindTemplateCache[template] = fn = function(element){
      var parts = [], self = this,
         oldElement = this.hasOwnProperty('$element') ? self.$element : undefined;
      self.$element = element;
      for ( var i = 0; i < bindings.length; i++) {
        var value = bindings[i].call(self, element);
        if (isElement(value))
          value = '';
        else if (isObject(value))
          value = toJson(value, true);
        parts.push(value);
      };
      self.$element = oldElement;
      return parts.join('');
    };
  }
  return fn;
}

angularDirective("ng:bind-template", function(expression){
  var templateFn = compileBindTemplate(expression);
  return function(element) {
    var lastValue;
    this.$onEval(function() {
      var value = templateFn.call(this, element);
      if (value != lastValue) {
        element.text(value);
        lastValue = value;
      }
    }, element);
  };
});

var REMOVE_ATTRIBUTES = {
  'disabled':'disabled',
  'readonly':'readOnly',
  'checked':'checked'
};
angularDirective("ng:bind-attr", function(expression){
  return function(element){
    var lastValue = {};
    this.$onEval(function(){
      var values = this.$eval(expression);
      for(var key in values) {
        var value = compileBindTemplate(values[key]).call(this, element),
            specialName = REMOVE_ATTRIBUTES[lowercase(key)];
        if (lastValue[key] !== value) {
          lastValue[key] = value;
          if (specialName) {
            if (element[specialName] = toBoolean(value)) {
              element.attr(specialName, value);
            } else {
              element.removeAttr(key);
            }
            (element.data('$validate')||noop)();
          } else {
            element.attr(key, value);
          }
        }
      };
    }, element);
  };
});

angularWidget("@ng:non-bindable", noop);

angularWidget("@ng:repeat", function(expression, element){
  element.removeAttr('ng:repeat');
  element.replaceWith(this.comment("ng:repeat: " + expression));
  var template = this.compile(element);
  return function(reference){
    var match = expression.match(/^\s*(.+)\s+in\s+(.*)\s*$/),
        lhs, rhs, valueIdent, keyIdent;
    if (! match) {
      throw "Expected ng:repeat in form of 'item in collection' but got '" +
      expression + "'.";
    }
    lhs = match[1];
    rhs = match[2];
    match = lhs.match(/^([\$\w]+)|\(([\$\w]+)\s*,\s*([\$\w]+)\)$/);
    if (!match) {
      throw "'item' in 'item in collection' should be identifier or (key, value) but got '" +
      keyValue + "'.";
    }
    valueIdent = match[3] || match[1];
    keyIdent = match[2];

    var children = [], currentScope = this;
    this.$onEval(function(){
      var index = 0, childCount = children.length, childScope, lastElement = reference,
          collection = this.$tryEval(rhs, reference), is_array = isArray(collection);
      for ( var key in collection) {
        if (!is_array || collection.hasOwnProperty(key)) {
          if (index < childCount) {
            // reuse existing child
            childScope = children[index];
            childScope[valueIdent] = collection[key];
            if (keyIdent) childScope[keyIdent] = key;
          } else {
            // grow children
            childScope = template(element.clone(), createScope(currentScope));
            childScope[valueIdent] = collection[key];
            if (keyIdent) childScope[keyIdent] = key;
            lastElement.after(childScope.$element);
            childScope.$index = index;
            childScope.$element.attr('ng:repeat-index', index);
            childScope.$init();
            children.push(childScope);
          }
          childScope.$eval();
          lastElement = childScope.$element;
          index ++;
        }
      };
      // shrink children
      while(children.length > index) {
        children.pop().$element.remove();
      }
    }, reference);
  };
});

angularDirective("ng:click", function(expression, element){
  return function(element){
    var self = this;
    element.bind('click', function(event){
      self.$tryEval(expression, element);
      self.$root.$eval();
      event.preventDefault();
    });
  };
});

angularDirective("ng:watch", function(expression, element){
  return function(element){
    var self = this;
    new Parser(expression).watch()({
      addListener:function(watch, exp){
        self.$watch(watch, function(){
          return exp(self);
        }, element);
      }
    });
  };
});

function ngClass(selector) {
  return function(expression, element){
    var existing = element[0].className + ' ';
    return function(element){
      this.$onEval(function(){
        if (selector(this.$index)) {
          var value = this.$eval(expression);
          if (isArray(value)) value = value.join(' ');
          element[0].className = trim(existing + value);
        }
      }, element);
    };
  };
}

angularDirective("ng:class", ngClass(function(){return true;}));
angularDirective("ng:class-odd", ngClass(function(i){return i % 2 === 0;}));
angularDirective("ng:class-even", ngClass(function(i){return i % 2 === 1;}));

angularDirective("ng:show", function(expression, element){
  return function(element){
    this.$onEval(function(){
      element.css('display', toBoolean(this.$eval(expression)) ? '' : 'none');
    }, element);
  };
});

angularDirective("ng:hide", function(expression, element){
  return function(element){
    this.$onEval(function(){
      element.css('display', toBoolean(this.$eval(expression)) ? 'none' : '');
    }, element);
  };
});

angularDirective("ng:style", function(expression, element){
  return function(element){
    var resetStyle = getStyle(element);
    this.$onEval(function(){
      var style = this.$eval(expression) || {}, key, mergedStyle = {};
      for(key in style) {
        if (resetStyle[key] === undefined) resetStyle[key] = '';
        mergedStyle[key] = style[key];
      }
      for(key in resetStyle) {
        mergedStyle[key] = mergedStyle[key] || resetStyle[key];
      }
      element.css(mergedStyle);
    }, element);
  };
});

function parseBindings(string) {
  var results = [];
  var lastIndex = 0;
  var index;
  while((index = string.indexOf('{{', lastIndex)) > -1) {
    if (lastIndex < index)
      results.push(string.substr(lastIndex, index - lastIndex));
    lastIndex = index;

    index = string.indexOf('}}', index);
    index = index < 0 ? string.length : index + 2;

    results.push(string.substr(lastIndex, index - lastIndex));
    lastIndex = index;
  }
  if (lastIndex != string.length)
    results.push(string.substr(lastIndex, string.length - lastIndex));
  return results.length === 0 ? [ string ] : results;
}

function binding(string) {
  var binding = string.replace(/\n/gm, ' ').match(/^\{\{(.*)\}\}$/);
  return binding ? binding[1] : null;
}

function hasBindings(bindings) {
  return bindings.length > 1 || binding(bindings[0]) !== null;
}

angularTextMarkup('{{}}', function(text, textNode, parentElement) {
  var bindings = parseBindings(text),
      self = this;
  if (hasBindings(bindings)) {
    if (isLeafNode(parentElement[0])) {
      parentElement.attr('ng:bind-template', text);
    } else {
      var cursor = textNode, newElement;
      foreach(parseBindings(text), function(text){
        var exp = binding(text);
        if (exp) {
          newElement = self.element('span');
          newElement.attr('ng:bind', exp);
        } else {
          newElement = self.text(text);
        }
        if (msie && text.charAt(0) == ' ') {
          newElement = jqLite('<span>&nbsp;</span>');
          var nbsp = newElement.html();
          newElement.text(text.substr(1));
          newElement.html(nbsp + newElement.html());
        }
        cursor.after(newElement);
        cursor = newElement;
      });
    }
    textNode.remove();
  }
});

// TODO: this should be widget not a markup
angularTextMarkup('OPTION', function(text, textNode, parentElement){
  if (nodeName(parentElement) == "OPTION") {
    var select = document.createElement('select');
    select.insertBefore(parentElement[0].cloneNode(true), null);
    if (!select.innerHTML.match(/<option(\s.*\s|\s)value\s*=\s*.*>.*<\/\s*option\s*>/gi)) {
      parentElement.attr('value', text);
    }
  }
});

var NG_BIND_ATTR = 'ng:bind-attr';
angularAttrMarkup('{{}}', function(value, name, element){
  // don't process existing attribute markup
  if (angularDirective(name) || angularDirective("@" + name)) return;
  if (msie && name == 'src')
    value = decodeURI(value);
  var bindings = parseBindings(value),
      bindAttr;
  if (hasBindings(bindings)) {
    element.removeAttr(name);
    bindAttr = fromJson(element.attr(NG_BIND_ATTR) || "{}");
    bindAttr[name] = value;
    element.attr(NG_BIND_ATTR, toJson(bindAttr));
  }
});
function modelAccessor(scope, element) {
  var expr = element.attr('name');
  if (!expr) throw "Required field 'name' not found.";
  return {
    get: function() {
      return scope.$eval(expr);
    },
    set: function(value) {
      if (value !== undefined) {
        return scope.$tryEval(expr + '=' + toJson(value), element);
      }
    }
  };
}

function modelFormattedAccessor(scope, element) {
  var accessor = modelAccessor(scope, element),
      formatterName = element.attr('ng:format') || NOOP,
      formatter = angularFormatter(formatterName);
  if (!formatter) throw "Formatter named '" + formatterName + "' not found.";
  return {
    get: function() {
      return formatter.format(accessor.get());
    },
    set: function(value) {
      return accessor.set(formatter.parse(value));
    }
  };
}

function compileValidator(expr) {
  return new Parser(expr).validator()();
}

function valueAccessor(scope, element) {
  var validatorName = element.attr('ng:validate') || NOOP,
      validator = compileValidator(validatorName),
      requiredExpr = element.attr('ng:required'),
      formatterName = element.attr('ng:format') || NOOP,
      formatter = angularFormatter(formatterName),
      format, parse, lastError, required;
      invalidWidgets = scope.$invalidWidgets || {markValid:noop, markInvalid:noop};
  if (!validator) throw "Validator named '" + validatorName + "' not found.";
  if (!formatter) throw "Formatter named '" + formatterName + "' not found.";
  format = formatter.format;
  parse = formatter.parse;
  if (requiredExpr) {
    scope.$watch(requiredExpr, function(newValue) {
      required = newValue;
      validate();
    });
  } else {
    required = requiredExpr === '';
  }

  element.data('$validate', validate);
  return {
    get: function(){
      if (lastError)
        elementError(element, NG_VALIDATION_ERROR, null);
      try {
        var value = parse(element.val());
        validate();
        return value;
      } catch (e) {
        lastError = e;
        elementError(element, NG_VALIDATION_ERROR, e);
      }
    },
    set: function(value) {
      var oldValue = element.val(),
          newValue = format(value);
      if (oldValue != newValue) {
        element.val(newValue || ''); // needed for ie
      }
      validate();
    }
  };

  function validate() {
    var value = trim(element.val());
    if (element[0].disabled || element[0].readOnly) {
      elementError(element, NG_VALIDATION_ERROR, null);
      invalidWidgets.markValid(element);
    } else {
      var error, validateScope = inherit(scope, {$element:element});
      error = required && !value ?
              'Required' :
              (value ? validator(validateScope, value) : null);
      elementError(element, NG_VALIDATION_ERROR, error);
      lastError = error;
      if (error) {
        invalidWidgets.markInvalid(element);
      } else {
        invalidWidgets.markValid(element);
      }
    }
  }
}

function checkedAccessor(scope, element) {
  var domElement = element[0], elementValue = domElement.value;
  return {
    get: function(){
      return !!domElement.checked;
    },
    set: function(value){
      domElement.checked = toBoolean(value);
    }
  };
}

function radioAccessor(scope, element) {
  var domElement = element[0];
  return {
    get: function(){
      return domElement.checked ? domElement.value : null;
    },
    set: function(value){
      domElement.checked = value == domElement.value;
    }
  };
}

function optionsAccessor(scope, element) {
  var options = element[0].options;
  return {
    get: function(){
      var values = [];
      foreach(options, function(option){
        if (option.selected) values.push(option.value);
      });
      return values;
    },
    set: function(values){
      var keys = {};
      foreach(values, function(value){ keys[value] = true; });
      foreach(options, function(option){
        option.selected = keys[option.value];
      });
    }
  };
}

function noopAccessor() { return { get: noop, set: noop }; }

var textWidget = inputWidget('keyup change', modelAccessor, valueAccessor, initWidgetValue()),
    buttonWidget = inputWidget('click', noopAccessor, noopAccessor, noop),
    INPUT_TYPE = {
      'text':            textWidget,
      'textarea':        textWidget,
      'hidden':          textWidget,
      'password':        textWidget,
      'button':          buttonWidget,
      'submit':          buttonWidget,
      'reset':           buttonWidget,
      'image':           buttonWidget,
      'checkbox':        inputWidget('click', modelFormattedAccessor, checkedAccessor, initWidgetValue(false)),
      'radio':           inputWidget('click', modelFormattedAccessor, radioAccessor, radioInit),
      'select-one':      inputWidget('change', modelFormattedAccessor, valueAccessor, initWidgetValue(null)),
      'select-multiple': inputWidget('change', modelFormattedAccessor, optionsAccessor, initWidgetValue([]))
//      'file':            fileWidget???
    };

function initWidgetValue(initValue) {
  return function (model, view) {
    var value = view.get();
    if (!value && isDefined(initValue)) {
      value = copy(initValue);
    }
    if (isUndefined(model.get()) && isDefined(value)) {
      model.set(value);
    }
  };
}

function radioInit(model, view, element) {
 var modelValue = model.get(), viewValue = view.get(), input = element[0];
 input.checked = false;
 input.name = this.$id + '@' + input.name;
 if (isUndefined(modelValue)) {
   model.set(modelValue = null);
 }
 if (modelValue == null && viewValue !== null) {
   model.set(viewValue);
 }
 view.set(modelValue);
}

function inputWidget(events, modelAccessor, viewAccessor, initFn) {
  return function(element) {
    var scope = this,
        model = modelAccessor(scope, element),
        view = viewAccessor(scope, element),
        action = element.attr('ng:change') || '',
        lastValue;
    initFn.call(scope, model, view, element);
    this.$eval(element.attr('ng:init')||'');
    // Don't register a handler if we are a button (noopAccessor) and there is no action
    if (action || modelAccessor !== noopAccessor) {
      element.bind(events, function(event){
        model.set(view.get());
        lastValue = model.get();
        scope.$tryEval(action, element);
        scope.$root.$eval();
        // if we have noop initFn than we are just a button,
        // therefore we want to prevent default action
        if(initFn == noop)
          event.preventDefault();
      });
    }
    view.set(lastValue = model.get());
    scope.$watch(model.get, function(value){
      if (lastValue !== value) {
        view.set(lastValue = value);
      }
    });
  };
}

function inputWidgetSelector(element){
  this.directives(true);
  return INPUT_TYPE[lowercase(element[0].type)] || noop;
}

angularWidget('input', inputWidgetSelector);
angularWidget('textarea', inputWidgetSelector);
angularWidget('button', inputWidgetSelector);
angularWidget('select', function(element){
  this.descend(true);
  return inputWidgetSelector.call(this, element);
});


angularWidget('ng:include', function(element){
  var compiler = this,
      srcExp = element.attr("src"),
      scopeExp = element.attr("scope") || '';
  if (element[0]['ng:compiled']) {
    this.descend(true);
    this.directives(true);
  } else {
    element[0]['ng:compiled'] = true;
    return function(element){
      var scope = this, childScope;
      var changeCounter = 0;
      function incrementChange(){ changeCounter++;}
      this.$watch(srcExp, incrementChange);
      this.$watch(scopeExp, incrementChange);
      scope.$onEval(function(){
        if (childScope) childScope.$eval();
      });
      this.$watch(function(){return changeCounter;}, function(){
        var src = this.$eval(srcExp),
        useScope = this.$eval(scopeExp);
        if (src) {
          scope.$xhr.cache('GET', src, function(code, response){
            element.html(response);
            childScope = useScope || createScope(scope);
            compiler.compile(element)(element, childScope);
            childScope.$init();
          });
        }
      });
    };
  }
});

var ngSwitch = angularWidget('ng:switch', function (element){
  var compiler = this,
      watchExpr = element.attr("on"),
      usingExpr = (element.attr("using") || 'equals'),
      usingExprParams = usingExpr.split(":"),
      usingFn = ngSwitch[usingExprParams.shift()],
      changeExpr = element.attr('change') || '',
      cases = [];
  if (!usingFn) throw "Using expression '" + usingExpr + "' unknown.";
  eachNode(element, function(caseElement){
    var when = caseElement.attr('ng:switch-when');
    if (when) {
      cases.push({
        when: function(scope, value){
          var args = [value, when];
          foreach(usingExprParams, function(arg){
            args.push(arg);
          });
          return usingFn.apply(scope, args);
        },
        change: changeExpr,
        element: caseElement,
        template: compiler.compile(caseElement)
      });
    }
  });

  // this needs to be here for IE
  foreach(cases, function(_case){
    _case.element.remove();
  });

  element.html('');
  return function(element){
    var scope = this, childScope;
    this.$watch(watchExpr, function(value){
      element.html('');
      childScope = createScope(scope);
      foreach(cases, function(switchCase){
        if (switchCase.when(childScope, value)) {
          var caseElement = switchCase.element.clone();
          element.append(caseElement);
          childScope.$tryEval(switchCase.change, element);
          switchCase.template(caseElement, childScope);
          if (scope.$invalidWidgets)
            scope.$invalidWidgets.clearOrphans();
          childScope.$init();
        }
      });
    });
    scope.$onEval(function(){
      if (childScope) childScope.$eval();
    });
  };
}, {
  equals: function(on, when) {
    return on == when;
  },
  route: switchRouteMatcher
});
var browserSingleton;
angularService('$browser', function browserFactory(){
  if (!browserSingleton) {
    browserSingleton = new Browser(
        window.location,
        jqLite(window.document),
        jqLite(window.document.getElementsByTagName('head')[0]));
    browserSingleton.startUrlWatcher();
    browserSingleton.bind();
  }
  return browserSingleton;
});

extend(angular, {
  'element': jqLite,
  'compile': compile,
  'scope': createScope,
  'copy': copy,
  'extend': extend,
  'equals': equals,
  'foreach': foreach,
  'noop':noop,
  'bind':bind,
  'toJson': toJson,
  'fromJson': fromJson,
  'identity':identity,
  'isUndefined': isUndefined,
  'isDefined': isDefined,
  'isString': isString,
  'isFunction': isFunction,
  'isObject': isObject,
  'isNumber': isNumber,
  'isArray': isArray
});


  window.onload = function(){
    try {
      if (previousOnLoad) previousOnLoad();
    } catch(e) {}
    angularInit(angularJsConfig(document));
  };

})(window, document, window.onload);
