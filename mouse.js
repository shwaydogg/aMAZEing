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

function collide(current_point,other_user_points) {
    for (var i in other_user_points) {
        if(current_point.x == other_user_points[i].x && current_point.y == other_user_points[i].y) {
            return true;
        }
    }
    return false;
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

        if (collide(current_point, current_user.points)) {
            socket.emit('collision');
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
