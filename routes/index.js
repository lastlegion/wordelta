
/*
 * GET home page.
 */

var game_ = require("../game");
exports.index = function(req, res){
  res.render('index', { title: 'WorDelta' });
};

exports.game = function(req, res) {
    res.render('game', {title: 'WorDelta'});
};
exports.reset = function(req, res) {
    game_.start();
    res.render('index', {title: 'WorDelta', reset: true})
}
