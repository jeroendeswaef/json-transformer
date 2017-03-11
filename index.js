var antlr4 = require('antlr4');
var JSONLexer = require('./JSONLexer');
var JSONParser = require('./JSONParser');
var JSONListener = require('./JSONListener').JSONListener;
var fs = require('fs');

function doWithInput(input) {
  var chars = new antlr4.InputStream(input);
  var lexer = new JSONLexer.JSONLexer(chars);
  var tokens = new antlr4.CommonTokenStream(lexer);
  var parser = new JSONParser.JSONParser(tokens);
  parser.buildParseTrees = true;
  var tree = parser.json();
  var chain = [];

  FlatValuesCreator = function () {
    JSONListener.call(this); // inherit default listener
    return this;
  };

  // inherit default listener
  FlatValuesCreator.prototype = Object.create(JSONListener.prototype);
  FlatValuesCreator.prototype.constructor = FlatValuesCreator;

  // override default listener behavior
  FlatValuesCreator.prototype.enterPair = function (ctx) {
    const start = ctx.STRING().symbol.start;
    const end = ctx.STRING().symbol.stop + 1;
    const key = input.substring(start, end).replace(/"/g,"");
    chain.push(key);
  };

  // override default listener behavior
  FlatValuesCreator.prototype.exitPair = function (ctx) {
    const start = ctx.STRING().symbol.start;
    const end = ctx.STRING().symbol.stop + 1;
    const key = input.substring(start, end).replace(/"/g,"");
    if (chain.length > 0 && chain[chain.length - 1] === key) {
       chain.pop();
    }
    const fullKey = (chain.length > 0 ? [chain.join('.'), key].join('.') : key);
    if (ctx.value().obj() === null) {
      const startValue = ctx.value().STRING().symbol.start;
      const endValue = ctx.value().STRING().symbol.stop + 1;
      console.log(fullKey + ": " + input.substring(startValue, endValue));
    }
  };

  var flatValuesCreator = new FlatValuesCreator();
  antlr4.tree.ParseTreeWalker.DEFAULT.walk(flatValuesCreator, tree);
}

fs.readFile('test.json', 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  doWithInput(data);
});
