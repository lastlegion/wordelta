
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , fs = require('fs');
var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', routes.index);

app.listen(1337);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

/*
 * Game Variables
 */
var scores, words;
var word_list;
var players;
var game_word = "Dinosaur".toUpperCase();


/*
 * Read dictionary
 */
fs.readFile('word_list.txt', 'utf-8', init);


/*
 * Helper functions
 */
function isInDict(word){
    for(var i=0; i<word_list.length; i++){
        if(word == word_list[i])
            return true;
    }
    return false;
}
function isNotUsed(word){
    for(player in words){
        for(var i=0; i< player.length; i++){
            if(words[player][i] == word){
                return false;
            }   
        }
    }
    return true;
}

/*
 *  Initialize
 */

function init(err, data){
    //players = [];
    scores = {};
    words = {};
    players = 0;
    io = require('socket.io').listen(app);
    if(err){
        console.log("Error reading dictionary: "+err);
    } 
    
    //Listify dictionary
    word_list = data.toString().split("\n");
    
    //Listen for events
    setEventHandlers();
}


setEventHandlers = function( ) {
    io.sockets.on("connection", onSocketConnection);
}
onAddWord = function(data){
    var word = data.word;
    var player = data.player
    console.log("onAddWord "+player);
    console.log(scores);
    console.log(words);
    if(isInDict(word)){
        if(isNotUsed(word)){
            var points = word.length;
            scores[player]+= points;
            words[player].push(word);
            //console.log(word+" broadcasted");
            io.sockets.emit("word added", {word: word, score: scores[player], player_id:player, added: true }) ;    
        } else {
            io.sockets.emit("word added", {added: false, reason: "used", player_id: player})
        }
    } else {
        io.sockets.emit("word added", {added: false, reason: "invalid", player_id: player});
    }

};
onDisconnect = function(){
    players--;
};

onNewPlayer = function(data) {
    words[this.id] = new Array();
    scores[this.id] = 0;
    console.log("New player "+this.id);
    if(players == 1){
        this.emit("new player", {player_id: this.id, game_word: game_word, waiting: true});
    } else {
        io.sockets.emit("new player", {player_id: this.id, game_word: game_word, waiting: false}); 
    }
};

onSocketConnection = function(client){
    console.log("New player connected "+client.id);
//    scores = {};
//    words = {};
    players++;
    
    client.on("new player", onNewPlayer);
    client.on("add word", onAddWord);
    client.on("disconnect", onDisconnect);
};


/*
var io = require('socket.io').listen(app);
fs.readFile('word_list.txt',"utf-8", function(err, data){
    if(err){
        console.log(err);
    } 
    var word_list = data.toString().split("\n");
    var players=0;
    var p1_words = [];
    var p1_points = 0; 
    var p2_words =[];
    var p2_points = 0;
    var one = false;
    io.sockets.on('connection', function(socket){
        if(one == false){
            socket.id =  1;
            one = true;
        } else{
            socket.id = 2;
            one = false;
        }
        //players++;
        socket.on('disconnect',function(r){
            if(socket.id == 1){
                p1_words = [];
                p1_points = 0;
                one = false;
            } else {
                p2_words = [];
                p2_points = [];
                one = true;
            }
        });
        socket.emit("assignId", {player_id: socket.id});

        socket.on("adduser", function(user){ 
            //socket.emit("assignId", {player_id: socket.id});
            console.log("assigned id: "+socket.id );
        });

        socket.on("check_word", function(check_word){
            var status="";
            var flag= false;
            word = check_word.word;
            if(word == "")
                status = "false"
            for(var i=0; i<p1_words.length; i++){
                if(p1_words[i] == word){
                    status="duplicate";
                    break;
                }
            }
            for(var i=0; i<p2_words.length; i++){
                if(p2_words[i] == word){
                    status = "duplicate";
                    break;
                }
            }
            if(status == ""){ 
                for(var i=0; i<word_list.length; i++){
                    if(word_list[i].toUpperCase() == word.toUpperCase()){
                        status = "true";
                        if(check_word.player == 1){
                            //Add points
                            p1_points = p1_points + word.length;
                            p1_words.push(word);
                            console.log("p1 pushed");
                        } else if(check_word.player == 2){
                            p2_points = p2_points + word.length;
                            p2_words.push(word);
                            console.log("p2 pushed");
                        }
                        //console.log(p1_words);
                        flag = true;
                        break;
                    }
                }
                if(flag == false){
                    status = "false";
                }
            }
            if(status== "true"){
                if(check_word.player == 1){
                    socket.emit("points", {points: p1_points, player: check_word.player});
                }else //(check_word.player ==2 ){
                    {
                    socket.emit("points", {points: p2_points, player: check_word.player});
                }
            }
            io.sockets.emit("word_found", {found: status, player: check_word.player, word: check_word.word});
        
            console.log(p1_words);
            console.log(p2_words);
        });
    });
    //console.log(data);
    
});
*/

