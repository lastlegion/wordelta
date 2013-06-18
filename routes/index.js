
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'WorDelta' });
};

exports.game = function(req, res) {
    res.render('game', {title: 'WorDelta'});
};
