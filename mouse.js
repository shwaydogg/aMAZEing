var app = require('express').createServer(),
    io = require('socket.io').listen(app);

app.listen(8080);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/mouse.html');
});



var users= {};

function User(name) {
    this.name = name;
    this.old_xy = {};
    this.points = [];
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

function lineCollide(current_point, current_user) {
    var inputLine = getLine(current_point, current_user.old_xy, current_point.x);


    var xMinInput = current_point.x  < current_user.old_xy.x ? current_point.x : current_user.old_xy.x;
    var xMaxInput = current_point.x  > current_user.old_xy.x ? current_point.x : current_user.old_xy.x;

    console.log('inputLine: ', inputLine);
    console.log(' xmin and max Inputs: ', xMinInput,xMaxInput);

    for (var user in users) {
        if(user != current_user.name) {
            for (var i = 0; i+1< users[user].points.length; i++){
                var xMax, xMin;

                xMin = users[user].points[i].x < users[user].points[i+1].x ? users[user].points[i].x : users[user].points[i+1].x;
                xMax = users[user].points[i].x > users[user].points[i+1].x ? users[user].points[i].x : users[user].points[i+1].x;


                //check to make sure there is an overlap if not move on to next line segment
                if (xMinInput > xMax  || xMaxInput < xMin){
                    break;
                }

                xMax = xMax > xMaxInput ? xMax : xMaxInput;
                xMin = xMin < xMinInput ? xMin : xMinInput;
                //we are not checking y mins and maxs that could potentially save tidbit of time.

                var iterLine = getLine(users[user].points[i], users[user].points[i+1], users[user].points[i].x);


                if( intersect(inputLine, iterLine, xMin, xMax) ) {
                    return true;
                }


            }
        }
    }
    return false;
}


console.log ('intersect({m:1, b:0}, {m:-1,b:0}, -1,1): ', intersect({m:1, b:0}, {m:-1,b:0}, -1,1));

console.log ('intersect({m:infinity, b:0}, {m:-1,b:0}, -1,1): ', intersect({m:Infinity, b:0}, {m:-1,b:0}, -1,1));

console.log ('intersect({m:1, b:0}, {m:Infinity,b:0}, -1,1): ', intersect({m:1, b:0}, {m:Infinity,b:0}, -1,1));


console.log ('intersect({m:0, b:infinity}, {m:-1,b:0}, -1,1): ', intersect({m:0, b:Infinity}, {m:-1,b:0}, -1,1));


console.log ('intersect({m:1, b:0}, {m:-1,b:0}, -1,1): ', intersect({m:1, b:0}, {m:-1,b:0}, -1,1));


function intersect(line1, line2, xMin, xMax){
    if(line1.m == line2.m){
        if(line1.b == line2.b){
            if(line1.m ==Infinity && line1.anX != line2.anX){
                return false;
            }
            return true;
        }
        return false;
    }else{
        var xInt = xIntersect(line1,line2);
        if(xInt > xMin && xInt <xMax){
            return true;
    }
    return false;
    }
}

function getLine(a,b,x){
    var m = slope(a,b);
    return {m:m, b: yIntercept(a,m), anX:x};
}

function slope(a,b){
    console.log('a.y, b.y',a.y, b.y);
    console.log('a.x, b.x',a.x, b.x );
    return (a.y - b.y) / (a.x - b.x);
}

function yIntercept(a,m){
    if(m===0){
        return a.y;
    }
    else if(m == Infinity || m == -Infinity){
        return null;
    }
    return  (a.y / (m * a.x));
}

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
          users[name] = new User(name);
          socket.emit('ready');
        } else {
          socket.emit('badName');
        }
    });

    socket.on('clear_xy', function (name) {
        users[name].old_xy = {};
    });

    socket.on('coord', function (msgData) {
        var current_user = users[msgData.n];
        var current_point = {x:msgData.x,y:msgData.y};
        if (lineCollide(current_point,current_user)) {
            io.sockets.emit('collision');
        } else {
            current_user.points.push(current_point);

            if(current_user.old_xy != {}) {
                socket.broadcast.emit('art',{x1:current_user.old_xy.x,y1:current_user.old_xy.y,x2:msgData.x, y2:msgData.y});
            }

            current_user.old_xy = current_point;
        }
    });
});




//https://developer.mozilla.org/en/Canvas_tutorial
//http://stackoverflow.com/questions/4647348/send-message-to-specific-client-with-socket-io-and-node-js
//http://codeflow.org/entries/2010/aug/22/html5-canvas-and-the-flying-dots/
