var app = require('express').createServer(),
    io = require('socket.io').listen(app);

app.listen(8080);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/mouse.html');
});



var users= {};

function User(name) {
    this.name = name;

}


io.sockets.on('connection', function (socket) {

  socket.on('set name', function (name) {
    if(!users[name]){
      // users[name] = "notnul";
      users[name] = new User(name);

      console.log(users);
      console.log(io);
      socket.emit('ready');


    }
    else{
      socket.emit('badName');
    }
  });
  
  socket.on('coord', function (msgData) {
      
      console.log('Xcoord = ', msgData.x, ' and Ycoord = ', msgData.y, 'and name = ', msgData.n);
      var current_user = users[msgData.n];
      console.log(current_user);
      if(current_user.old_xy) {
        socket.broadcast.emit('art',{x1:current_user.old_xy[0],y1:current_user.old_xy[1],x2:msgData.x, y2:msgData.y});
      }
      current_user.old_xy = [msgData.x,msgData.y];
  });
});




//https://developer.mozilla.org/en/Canvas_tutorial
//http://stackoverflow.com/questions/4647348/send-message-to-specific-client-with-socket-io-and-node-js
//http://codeflow.org/entries/2010/aug/22/html5-canvas-and-the-flying-dots/
