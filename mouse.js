var app = require('express').createServer(),
    io = require('socket.io').listen(app);

//app.listen(15564); //8080 for localhost
app.listen(8080); //8080 for localhost


app.get('/', function (req, res) {
  res.sendfile(__dirname + '/mouse.html');
});



var users= {};

function User(name,id) {
    this.name = name;
    this.id = id;
    this.room = "";
    this.mazeWriter = false;
    this.points = [];
    this.lastValidPoint = null;
}

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

function lineCollide(pointA, pointB, current_user, users) {
    pointA = pointA || current_user.lastValidPoint;
    var inputLine = [pointA,pointB];
    for (var user in users) {
        if(user != current_user.name) {
            for (var i = 0; i+1< users[user].points.length; i++){
                var firstPoint = users[user].points[i];
                if(!firstPoint.end){
                    var iterLine = [ firstPoint, users[user].points[i+1]];
                    if( boeIntersect(inputLine, iterLine) ) {
                        return true;
                    }
                }
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


io.sockets.on('connection', function (socket) {

    socket.on('set name', function (name) {
        if(!users[name]){
            users[name] = new User(name,socket.id);
            var current_user = users[name];
            var rooms = io.sockets.manager.rooms;
            var inGame = false;
            for (var room in rooms) {
                // check to see if there are any rooms waiting for a second player, and if so, join one
                var clients = rooms[room];
                if (room !== '' && clients.length == 1) {
                    socket.join(room.slice(1)); // have to slice because join adds an extra '/' at the beginning
                    current_user.room = room.slice(1);
                    current_user.mazeWriter = true; // set the second player to join the game to be the writer, not the traverser
                    current_user.other_player_id = io.sockets.manager.rooms[room][0];
                    socket.emit('inGame');
                    io.sockets.socket(current_user.other_player_id).emit('newPlayer', current_user.id);
                    inGame = true;
                }
            }
            if (!inGame) {
                // if there are no rooms waiting for a second player, create a new room and wait in it
                socket.join(name);
                current_user.room = name;
                socket.emit('ready');
            }
        } else {
            socket.emit('badName');
        }
    });

    socket.on('setOtherPlayer', function (msgData){
        var current_user = users[msgData.n];
        current_user.other_player_id = msgData.otherID;
        current_user.points = [];
        console.log(current_user.name, ' has user ID ', current_user.id, 'and is playing against a user with ID: ', current_user.other_player_id);
    });

    socket.on('endLine', function (name) {
        if(users[name]) {
            users[name].lastValidPoint = null;
            users[name].points[ users[name].points.length - 1 ].end = true;
        }
    });

    socket.on('sendLine', function (msgData) { //we are receiving the line the client is sending it.
        var current_user = users[msgData.n];
        var pointB = {x:msgData.x2,y:msgData.y2};

        if(current_user && current_user.room){
            var pointA = current_user.lastValidPoint || {x:msgData.x1,y:msgData.y1};
            if (lineCollide(pointA, pointB,current_user,users)) {
                io.sockets.in(current_user.room).emit('collision');
            } else {
                if(current_user.mazeWriter){
                    io.sockets.in(current_user.room).emit('drawMazeLine',{
                                                x1:pointA.x,
                                                y1:pointA.y,
                                                x2:pointB.x,
                                                y2:pointB.y
                                                                        });
                }
                else{
                    io.sockets.in(current_user.room).emit('drawPathLine',msgData);
                }

                //assignment of lastValidPoint needs to happent after sending lines to client.
                if(msgData.end){
                    pointB.end = true;
                    current_user.lastValidPoint = null;
                }else{
                    current_user.lastValidPoint = pointB;
                }

                if( current_user.points.length === 0 || current_user.points[ current_user.points.length - 1 ].end){
                    current_user.points.push(pointA);
                }
                current_user.points.push(pointB);
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
