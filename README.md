Currently live at: http://amazeing.herokuapp.com

An interactive, simultaneous, multiplayer maze game written in Node.js.

The Architect of the maze starts of by entering a room name.  The PathFinder enters the same room name.  Now the Architect can draw walls of the maze while the Pathfinder attempts to navigate from the entrance to the exit.

To run locally, comment out line 10 and uncomment line 9 in maze.html.

To run the tests, install mocha and should and then just run "mocha --require should".

Written with (and dependent upon):  
node 0.6.12  
npm 1.1.4  
express 2.5.8  
socket.io 0.9.0