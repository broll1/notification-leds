var five;
/**
 * GET /
 * Home page.
 */
exports.index = function(req, res) {
  five.SetRainbowMode(true);
  res.render('home', {
    title: 'Home'
 });
};

exports.setFive = function(fiveBoard){
    five = fiveBoard;
}


exports.postUpdate = function(req, res){
    
}