//var socket = io.connect('http://amaze.nodester.com'); 
var socket = io.connect('http://localhost');  //Uncomment this line to test locally!
//var socket = io.connect('http://amazeing.herokuapp.com/'); 
//Globals:


var mazeWriter;
var watchMode;
var inGame;
var gameTime;
var pointData; //d3 data for points
var sessionNumber = 0; //doesnot occur in initglobals

initGlobals();

function initGlobals(){
  mazeWriter = false;
  watchMode = false;
  inGame = false;
  gameTime = 0;
  pointData = [20,20, 0]; //d3 data for points

  initMouseGlobals();
}

socket.on('connect', function () {
  socket.on('roomOccupied', function(){
    alert("That room is already occupied! Don't you have any manners?  Knock first when you pick your new room");
  });

  socket.on('waitingRoom',function(room){
    console.log('In watingRoom');
    document.getElementById("room-name").innerHTML=
            "Welcome to the waiting room for: <span class='green'>" +room 
          + "</span><br /> Please be patient or nudge a buddy to join your room";
    document.getElementById("roomInput").style.display="none";
  });

  socket.on('startGameMazeWriter', function(msgData) {
    initGlobals();
    sessionNumber = msgData.sessionNumber;
    var room = msgData.room;
    console.log('INIT mazeWtriter');
    document.getElementById("inGame").style.display="inline";
    document.getElementById("roomInput").style.display="none";
    clearCanvas();
    inGame = true;
    mazeWriter = true; // set the second player to join a game to be the maze writer, not the maze traverser
  initMouse();
  document.getElementById("timerPhrase").innerHTML = 'You have ';
  document.getElementById("postTimerPhrase").innerHTML = 'seconds before the your labrynth is entered';

  mazeWriteTimer(3000);
    document.getElementById("room-name").innerHTML="Get your Maze On, Δrchitect!<br/><i>You have two minutes to draw a maze that takes me one minute to solve.</i> <br/> You're in room: <span class='green'>" +room + "</span>";
  });

  socket.on('startGamePathFinder', function(msgData) {
    initGlobals();
    sessionNumber = msgData.sessionNumber;
    var room = msgData.room;
    console.log('INIT pathfinder');
    document.getElementById("inGame").style.display="inline";
    document.getElementById("roomInput").style.display="none";
    document.getElementById("control-buttons").style.display="none";
    clearCanvas();
    mazeWriter = false;
    pathStarted = false;
    inGame = true;
    document.getElementById("timerBlock").style.display= "inline";
    mazeWriteTimer(3000);
    
    document.getElementById("timer").style.display= "none";
    document.getElementById("collisionBlock").style.display= "inline";
    document.getElementById("canvas-container").style.cursor='none';
    document.getElementById("block1").style.width='600';
    document.getElementById("block1").style.height='600';
    document.getElementById("room-name").innerHTML="Light the way...PathFinder!<br/>  You are in room: <span class='green'>" +room + "</span>";
  old_xy = [];
  });

  socket.on('otherPlayerDisconnect',function(log) {
    alert('The other player disconnected.  Refresh the page to start a new game.');
    inGame = false;
});

  socket.on('disconnect',function(){
    inGame=false;
    alert('The server disconnected.  Refresh the page to start a new game.');
  });

  //server disconnect
  socket.on('drawLine',function(coord) {
     drawLine(coord.x1,coord.y1,coord.x2,coord.y2, 'red');
  });

  socket.on('drawMazeLine',function(line) {
     drawLine(line.x1,line.y1,line.x2,line.y2, 'black');
  });

  socket.on('drawPathLine',function(line) {
     document.getElementById("collisionBlock").style.display = 'none';
     drawLine(line.x1,line.y1,line.x2,line.y2, 'green');
  });

  socket.on('collision',function(line) {
    if(!mazeWriter && !watchMode){
    document.getElementById("collisionBlock").style.display = 'inline';
    }
  });

  socket.on('points',function(points){
    document.getElementById("points").innerHTML="Your points: "+ points.you +", Opponent's points: " + points.opponent; 
    pointData[0] = points.you;
    pointData[1] = points.opponent;
    redraw(); //D3 refresh
  });

//    function remove(id){
//     return (elem=document.getElementById(id)).parentNode.removeChild(elem);
// }

  socket.on('mazeComplete',function() {
    deInitMouse();


    document.getElementById("canvas-container").style.cursor='default';


    if(!mazeWriter && !watchMode ){
      alert('You finished the maze, congrats!');    
    }else{
      alert('They finished!');
    }
   document.getElementById("block1").style.height = 0;
   document.getElementById("block2").style.width  = 0;
   document.getElementById("block3").style.height = 0;
   document.getElementById("block4").style.width  = 0;
  });

  socket.on('watchMode', function(msgData){
    sessionNumber = msgData.sessionNumber;
    console.log('INIT watcher');
    clearCanvas();
    watchMode = true;
  });

  socket.on('winner',function(){
    //TO DO: Implement
  });
});

function mazeWriteTimer(time){
  if(time<0){
    document.getElementById("timerBlock").style.display= "none";
    document.getElementById("timerPhrase").innerHTML='Elapsed Game Time: ';
    document.getElementById("postTimerPhrase").innerHTML='';

    if(!mazeWriter){
      initMouse();
      document.getElementById("timer").style.display= "inline";
    }
    var gameTime = 0;
    initTimer();
    return;
  }
  setTimeout(
    function(){
      document.getElementById("timer").innerHTML = time/1000;
      document.getElementById("timerBlock").innerHTML = time/1000;
      mazeWriteTimer(time-1000);},
    1000);
}

function initTimer(){
  gameTime++;
  pointData[2] = gameTime;
  document.getElementById("timer").innerHTML = gameTime;
  setTimeout(initTimer,1000);
}