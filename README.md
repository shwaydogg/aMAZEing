An interactive, simultaneous, multiplayer maze game written in Node.js. Players are automatically sorted into 2-player games, where the first person to arrive in each game room is set to traverse a maze that is simultaneously being drawn by the second player who was sorted into that game.

To run locally, make the edits indicated by the comments in mouse.js (line 4) and mouse.html (lines 7 and 54).

To run the tests, install mocha and should and then just run "mocha --require should".

Written with (and dependent upon):  
node 0.6.12  
npm 1.1.4  
express 2.5.8  
socket.io 0.9.0

Currently live at: http://maze.nodester.com