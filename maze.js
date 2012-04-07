"use strict";

//BEGIN: Initialization

    var collision = require("./collision");

    var app = require('express').createServer(),
        io = require('socket.io').listen(app);

    var port = process.env.PORT || 8080;//8080 for localhost
    app.listen(port);

    io.configure(function () { 
      io.set("transports", ["xhr-polling"]); 
      io.set("polling duration", 10); 
    });

    app.get('/', function (req, res) {
      res.sendfile(__dirname + '/maze.html');
    });

    app.get('/main.css', function (req, res) {
      res.sendfile(__dirname + '/main.css');
    });

    app.get('/d3/d3.v2.js', function (req, res) {
      res.sendfile(__dirname + '/d3/d3.v2.js');
    });

    app.get('/d3maze.js', function (req, res) {
      res.sendfile(__dirname + '/d3maze.js');
    });

    app.get('/canvas.js', function (req, res) {
      res.sendfile(__dirname + '/canvas.js');
    });

    app.get('/mouseEvents.js', function (req, res) {
      res.sendfile(__dirname + '/mouseEvents.js');
    });

    app.get('/ui.js', function (req, res) {
      res.sendfile(__dirname + '/ui.js');
    });

    app.get('/mazeIO.js', function (req, res) {
      res.sendfile(__dirname + '/mazeIO.js');
    });

//END: Initialization

//BEGIN: Game Structures
    var games = {};
    var gameQueue = {};


    var canvasWidth=600;
    var startingBlockWidth = 45;


    function Player(socket,room){ //to replace users
        this.socket = socket;
        this.room = room;
        this.points = 0;
        //this.mazeWriter;
        //this.points = []; this will now be handled by Game
        //this.lastValidPoint = null;
        //this.game;
        //this.otherPlayer; //their socket
    }

    function GameRoom(player1,player2,room){
        this.player1 = player1;
        this.player2 = player2;
        this.mazePath = [];
        this.trailPath = [];
        this.room = room; //socket.io room
        this.session = 0;
        this.inSession = true;//if inSession is false we will ignore sendline. This will occur when we change players after the pathfinder escapes the maze.

        player1.game = this;
        player2.game = this;

        player1.room = room;
        player2.room = room;

        this.points1 = [];
        this.points2 = [];

        player1.otherPlayer = player2;
        player2.otherPlayer = player1;

        player1.socket.join(room);
        player2.socket.join(room);

        this.initSession(2, true);

    }

    GameRoom.prototype.initSession = function(pathFinder,twoPlayer){

        this.player1.points =  0;
        this.player2.points =  0;
        this.trailPath = [];
        this.inSession = true;

        var thisGameRoom = this;

        setTimeout(
            function (){
                    console.log("initSession");
                    if (pathFinder == 2){
                        //console.log(thisGameRoom);
                        thisGameRoom.player1.mazeWriter = true;
                        thisGameRoom.player2.mazeWriter = false;
                        thisGameRoom.player2.socket.emit('startGamePathFinder',
                            {sessionNumber:thisGameRoom.session, room:thisGameRoom.room});
                        thisGameRoom.dualPlay(thisGameRoom.player1 ,twoPlayer);
                    }
                    else{
                        thisGameRoom.player2.mazeWriter = true;
                        thisGameRoom.player1.mazeWriter = false;
                        thisGameRoom.player1.socket.emit('startGamePathFinder',
                            {sessionNumber:thisGameRoom.session, room:thisGameRoom.room});
                        thisGameRoom.dualPlay(thisGameRoom.player2, twoPlayer);
                    }
                },0);
    };

    GameRoom.prototype.dualPlay = function (player, twoPlayer){
        //if it is a twoplayer game we clear the current maze.
        if (twoPlayer){
            this.mazePath = [];
            player.socket.emit('startGameMazeWriter',
                {sessionNumber:this.session, room:this.room});
        }
        //if it is a single player game we draw the current maze
        else{
            player.socket.emit('watchMode', this.room);
            this.drawState();
        }
    };

    GameRoom.prototype.drawState = function (){
        //to be implemented
        this.drawPath(this.trailPath);
        this.drawPath(this.mazePath);
    };

    GameRoom.prototype. drawPath = function (path){
        for(var i = 0; i< path.length-1; i++){
            if(!path[i].end){
                io.sockets.in(this.room).emit('drawMazeLine',{
                                        x1:path[i].x,
                                        y1:path[i].y,
                                        x2:path[i+1].x,
                                        y2:path[i+1].y
                                                            });
            }
        }
    };


    GameRoom.prototype.endSession = function(){
        this.points1.push(this.player1.points);
        this.points2.push(this.player2.points);
        this.player1.lastValidPoint = null;
        this.player2.lastValidPoint = null;
        //inorder to do these saves need to write a copy function for arrays not going to deal with that now.
            // this.game1.mazePath = this.mazePath;
            // this.game1.trialPath = this.trailPath;

        this.session++;

        if(this.session == 1){
            //player1 is going to go through the maze that player1 made
            this.initSession(1,false);
        }
        else if(this.session == 2 ){
            //Player2 is now the mazeWriter and player 1 will traverse the maze
            this.initSession(1, true);
        }
        else if(this.session == 3 ){
            //player2 is going to go through the maze that player2 made
            this.initSession(2, false);
        }
        else if(this.session == 4){
            //the game is actually over.  Everybody cleanup
            this.deleteGame;
        }
        else{
            console.log("ERROR THIS SHOULD NOT BE REACHED");
        }
        
    };


    GameRoom.prototype.deleteGame = function(){
            delete games[this.room];
            delete this.mazePath;
            delete this.trailPath;
            delete this.player1;
            delete this.player2;
            delete this.room;
    };



    GameRoom.prototype.disconnect = function(disconnectedPlayer){
        if(this.player1 === disconnectedPlayer ){
            delete this.player2.room;
            this.player2.socket.emit('otherPlayerDisconnect');
        }else{
            delete this.player1.room;
            this.player1.socket.emit('otherPlayerDisconnect');
        }
        disconnectedPlayer.game.deleteGame();
    };
//END: Game Structures

//BEGIN: Game Structure Functions

    //takes a socket returns a player
    // i am going to for now make this a loop
    // will hopefully make a hash to make O(n) operation in future
    //will only find players that are in games fyi
    //this should perhaps become part of a prototype?
    function playerLookUp(socket){
        for( var game in games ){
            if( games[game].player1.socket == socket){
                return games[game].player1;
            }
            else if( games[game].player2.socket == socket){
                return games[game].player2;
            }
        }
        for( var game in gameQueue ){
            if( gameQueue[game].socket == socket){
                return gameQueue[game];
            }
            else if( gameQueue[game].socket == socket){
                return gameQueue[game];
            }
        }
        console.log('no player found');
        return false; //no player found
    }

    function playerPath(player){
        if(player){
            if(player.mazeWriter){
                return player.game.mazePath;
            }
            else{
                return player.game.trailPath;
            }
        }
    }

    function checkDone(point){
        if( (point.x > (canvasWidth - startingBlockWidth)) && (point.y > (canvasWidth - startingBlockWidth))){
            return true;
        }
        return false;
    }
//END: Game Structure Functions

//BEGIN:Points
    Player.prototype.addPoint = function(increment){
        if(increment){
            this.points += increment;
        }else{
            this.points++;
        }
    };
//END: Points


//BEGIN: On Connection
io.sockets.on('connection', function (socket) {

    socket.on('enterGame', function(room){
        if(games[room]){
            socket.emit('roomOccupied');
            console.log('ENTERGAME : occupied room');
        }
        else if(gameQueue[room]){
            //Create and join game
            console.log("ENTERGAME : found partner in queue");
            games[room] = new GameRoom(gameQueue[room], new Player(socket), room);
            delete gameQueue[room];
        }
        else{
            //add room to the queue of rooms
            console.log("ENTERGAME : added new game");
            gameQueue[room] = new Player(socket, room);
            socket.emit('waitingRoom',room);
        }
    });

    socket.on('disconnect', function () {
        var player = playerLookUp(socket);
        if(player){
            if(player.game){
                player.game.disconnect(player);
            }else{
                delete gameQueue[player.room];
            }
        }else{
            console.log("PLAYER NOT DEFINED ON DISCONNECT used to be, now being caught (this should now be resolved and not occur). BUG WARNING!  ");
        }
        console.log('done with disconnect');
    });

    socket.on('endLine', function () {
        var player = playerLookUp(socket);
        player.lastValidPoint = null;

        var path = playerPath(player);
        if(path && path.length<0){
            path[ path.length-1 ].end = true;
        }
    });

    socket.on('sendLine', function (msgData) { //we are receiving the line the client is sending it.
        var player = playerLookUp(socket);
        var pointB = {x:msgData.x2,y:msgData.y2};
        var path = playerPath(player);
        var collisionPath = playerPath(player.otherPlayer);
        var session = msgData.session;
        var sessionOver = false;

        console.log("this session", player.game.session, "session", session);

        if(player && player.room && player.game.inSession && player.game.session == session ){
            var pointA = player.lastValidPoint || {x:msgData.x1,y:msgData.y1};
            if (collision.lineCollide(pointA, pointB, collisionPath)) {
                io.sockets.in(player.room).emit('collision');
                player.addPoint(-1);
            }else{
                if(player.mazeWriter){
                    player.otherPlayer.addPoint();
                     io.sockets.in(player.room).emit('drawMazeLine',{
                                                x1:pointA.x,
                                                y1:pointA.y,
                                                x2:pointB.x,
                                                y2:pointB.y
                                                                        });
                     player.addPoint(-1);
                }
                else{
                    io.sockets.in(player.room).emit('drawPathLine',msgData);
                    player.addPoint(-1);
                    if(checkDone(pointB) && player.game.inSession){
                        player.room.inSession = false;
                        io.sockets.in(player.room).emit('mazeComplete');
                        player.game.endSession(); //ends the minigame (session)
                        player.addPoint(1000);
                        sessionOver = true;
                    }
                }

                //assignment of lastValidPoint needs to happen after sending lines to client.
                if (msgData.end){
                    pointB.end = true;
                    player.lastValidPoint = null;
                }else if(!sessionOver){
                    player.lastValidPoint = pointB;
                }
                if (path.length === 0 || path[ path.length-1 ].end){
                    path.push(pointA);
                }
                path.push(pointB);
            }
            player.socket.emit('points', {you:player.points, opponent:player.otherPlayer.points});
            player.otherPlayer.socket.emit('points', {you: player.otherPlayer.points, opponent:player.points});
        }

    });
});
//END: On Connection