var fs = require('fs');
/*
 * Game Variables
 */
var scores, words;
var word_list;
var games = [];
var players;
var game_word = "Dinosaur".toUpperCase();

var app;
/*
 * Read dictionary
 */
function start (app_){
    if(app_ === undefined){
        reset();
        return;
    } else{
    
    app = app_;
    fs.readFile('word_list.txt', 'utf-8', init);
    }
}

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

function reset(){
    scores = {};
    words = {};
    players = 0;

}

function init(err, data){
    console.log("init called");
    //players = [];
    reset();
    io = require('socket.io').listen(app);

    //Production configs
    io.configure(function(){
    
        io.set('transports',["xhr-polling"]);
        io.set("polling duration", 10);
    
    });
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
        this.emit("new player", {player_id: this.id, game_word: game_word, waiting: false}); 
        io.sockets.emit("two players", { waiting:false});
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

exports.start = start;
