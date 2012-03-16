"use strict";

var app = require('express').createServer(),
    io = require('socket.io').listen(app);

//app.listen(15564); //8080 for localhost
app.listen(8080); //8080 for localhost


app.get('/', function (req, res) {
  res.sendfile(__dirname + '/mouse.html');
});


var numGames = 0;
var games = {};


var waitingPlayer = false;

var roomNames = ['first','second','third','fourth','fifth','sixth','seventh'];

function Player(socket){ //to replace users
    this.socket = socket;
    this.room = false;
    this.mazeWriter = false;
    //this.points = []; this will now be handled by Game
    this.lastValidPoint = false;
    this.game = false;
    this.otherPlayer= false; //their socket
}

function GameRoom(player1,player2,room){
    this.player1 = player1;
    this.player2 = player2;
    this.mazePath = [];
    this.trailPath = [];
    this.room = room; //socket.io room

    player1.mazeWriter = true;

    player1.game = this;
    player2.game = this;

    player1.room = room;
    player2.room = room;

    player1.otherPlayer = player2;
    player2.otherPlayer = player1;

    player1.socket.join(room);
    player2.socket.join(room);

    player1.socket.emit('startGameMAzeWriter');
    player2.socket.emit('startGamePathFinder');
}

GameRoom.prototype.disconnect = function(disconnectedPlayer){
    if(this.player1 === disconnectedPlayer ){
        this.player2.socket.emit('otherPlayerDisconnect');
        freePlayer(this.player2.socket);
    }else{
        this.player1.socket.emit('otherPlayerDisconnect');
        freePlayer(this.player1.socket);
    }

    this.mazePath = false;
    this.trailPath = false;
    this.player1 = false;
    this.player2 = false;
};

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
        if( games[game].player2.socket == socket){
            return games[game].player2;
        }
    }
    console.log('no player found');
    return false; //no player found
}

function playerPath(player){
    if(player.mazeWriter){
        return player.game.mazePath;
    }
    else{
        return player.game.trailPath;
    }
}


//Collision Geometry BEGIN:

    function pixelCollide(current_point, current_user) {

        for (var user in users) {
            if(user != current_user.name) {
                for (var i in users[user].points) {
                    var other_user_points = users[user].points;
                    if(current_point.x == other_user_points[i].x && current_point.y == other_user_points[i].y) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function lineCollide(pointA, pointB, path) {
        var inputLine = [pointA,pointB];
        for (var i = 0; i+1< path.length; i++){
            var firstPoint = path[i];
            if(!firstPoint.end){
                var iterLine = [ firstPoint, path[i+1] ];
                if( boeIntersect(inputLine, iterLine) ) {
                    return true;
                }
            }
        }
        return false;
    }

    function boeIntersect(line1,line2) {

        var line1Specs = getLineSpecs(line1);
        var line2Specs = getLineSpecs(line2);

        if(line1Specs.m == line2Specs.m && line1Specs.b == line2Specs.b ) {
            // vertical lines with different x-coordinates can't collide
            if( (line1Specs.m == Infinity || line2Specs.m == -Infinity) && (line1Specs.anX != line2Specs.anX) ) {
                return false;
            }
            // any other lines with the same slope and same y-intercept should collide
            return true;
        }

        // return true if either endpoint of one line segment is on the other line segment
        if(pointOnLineSeg(line1,line2,line2Specs) || pointOnLineSeg(line2,line1,line1Specs)) {
            return true;
        }

        return((counterClockwise(line1[0],line2[0],line2[1]) != counterClockwise(line1[1],line2[0],line2[1])
                ) && (counterClockwise(line1[0],line1[1],line2[0]) != counterClockwise(line1[0],line1[1],line2[1])));
    }

    // helper functions for boeIntersect(), which is what lineCollide() relies upon
    function counterClockwise(point1,point2,point3){
        var slope_1_2 = (point3.y - point1.y) * (point2.x - point1.x);
        var slope_1_3 = (point2.y - point1.y) * (point3.x - point1.x);
        return(slope_1_2 > slope_1_3);
    }

    function pointOnLineSeg(line1,line2,line2Specs) {
        // check whether either endpoint of one line segment is on the other line
        var onLine = pointOnLine(line1[0],line2Specs) || pointOnLine(line1[1],line2Specs);
        // check whether either endpoint is on the line segment, not just the line in its entirety
        var onLineSeg = xInRange(line1[0],line2) && xInRange(line1[1],line2);
        if( onLine && onLineSeg ) {
            return true;
        }
        return false;
    }

    function pointOnLine(point,lineSpecs) {
        return(point.y == (lineSpecs.m * point.x) + lineSpecs.b);
    }

    function xInRange(point,line){
        var xMax = (line[0].x > line[1].x) ? line[0].x : line[1].x;
        var xMin = (line[0].x < line[1].x) ? line[0].x : line[1].x;
        return(point.x >= xMin && point.x <= xMax);
    }

    function getLineSpecs(line){
        var m = slope(line[0],line[1]);
        return {m:m, b: yIntercept(line[0],m), anX:line[0].x};
    }
     
    function slope(a,b){
        return (a.y - b.y) / (a.x - b.x);
    }

    function yIntercept(a,m){
        if(m===0){
            return a.y;
        }
        else if(m == Infinity || m == -Infinity){ // NaN
            return null;
        }
        return  (a.y - (m * a.x));
    }

    // deprecated helper functions for the old version of lineCollide()
    function xIntersect(line1,line2){
        if(line1.b  === null){
            return line1.anX;
        }
        else if(line2.b === null){
            return line2.anX;
        }else{
            return ((line2.b - line1.b) / (line1.m - line2.m));
        }
    }

//Collision Geometry END

function freePlayer(socket){
    var rooms = io.sockets.manager.rooms;

    console.log(rooms);
    console.log(typeof rooms);


    if(!waitingPlayer){
        //There are an even number of players add this player to the player queue until there is another
        waitingPlayer = new Player(socket);
        socket.emit('ready');
    }else{
        //There is a player waiting lets make a new gameRoom for these players
        var roomName = roomNames[numGames];
        numGames++;
        games[roomName] = new GameRoom(new Player(socket), waitingPlayer, roomName);
    
        socket.emit('inGame');
        waitingPlayer.socket.emit('newPlayer',socket.id);
        waitingPlayer = false;
    }
}

io.sockets.on('connection', function (socket) {

    freePlayer(socket);

    socket.on('disconnect', function () {
        var player = playerLookUp(socket);
        player.game.disconnect(player);
        console.log('done with disconnect');
    });

    socket.on('endLine', function () {
        var player = playerLookUp(socket);
        player.lastValidPoint = false;

        var path = playerPath(player);
        path[ path.length-1 ].path = true;
    });


    socket.on('sendLine', function (msgData) { //we are receiving the line the client is sending it.
        var player = playerLookUp(socket);
        var pointB = {x:msgData.x2,y:msgData.y2};
        var path = playerPath(player);
        var collisionPath = playerPath(player.otherPlayer);

        if(player && player.room){
            var pointA = player.lastValidPoint || {x:msgData.x1,y:msgData.y1};
            if (lineCollide(pointA, pointB, collisionPath)) {
                io.sockets.in(player.room).emit('collision');
            }else{
                if(player.mazeWriter){
                    io.sockets.in(player.room).emit('drawMazeLine',{
                                                x1:pointA.x,
                                                y1:pointA.y,
                                                x2:pointB.x,
                                                y2:pointB.y
                                                                        });
                }
                else{
                    io.sockets.in(player.room).emit('drawPathLine',msgData);
                }

                //assignment of lastValidPoint needs to happent after sending lines to client.
                if(msgData.end){
                    pointB.end = true;
                    player.lastValidPoint = null;
                }else{
                    player.lastValidPoint = pointB;
                }

                if( path.length === 0 || path[ path.length-1 ].end){
                    path.push(pointA);
                }
                path.push(pointB);
            }
        }

    });

});

exports.slope = slope;
exports.yIntercept = yIntercept;
exports.lineCollide = lineCollide;
exports.boeIntersect = boeIntersect;
exports.pointOnLine = pointOnLine;
exports.pointOnLineSeg = pointOnLineSeg;
exports.getLineSpecs = getLineSpecs;
exports.counterClockwise = counterClockwise;

//https://developer.mozilla.org/en/Canvas_tutorial
//http://stackoverflow.com/questions/4647348/send-message-to-specific-client-with-socket-io-and-node-js
//http://codeflow.org/entries/2010/aug/22/html5-canvas-and-the-flying-dots/
