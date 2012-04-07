//Mouse Events and Sending Lines: BEGIN

    var isMouseDown;
    var inputMode;
    var firstPoint;
    var pathStarted;

function initMouseGlobals (){
    isMouseDown = false;
    inputMode = mazeWriter? 'line' : 'drag'; //'drag'||'line'
    firstPoint = {};
    pathStarted = false;
}


function addEvent(element,e,foo){
    if ( element.addEventListener ) {
        element.addEventListener( e, foo, false );
    // If IE event model is used
    }else if ( element.attachEvent ) {
        element.attachEvent( e, foo );
    }
}

function removeEvent(element,e,foo){
    if ( element.removeEventListener ) {
        element.removeEventListener( e, foo, false );
    // If IE event model is used
    }else if ( element.detachEvent ) {
        element.detachEvent( e, foo );
    }
}

    //make function for controls initialization
    function initMouse(){
        isMouseDown = false;
        inputMode = mazeWriter ? 'line' : 'drag'; //'drag'||'line'
        firstPoint = {};
        pathStarted = false;

        var canvasElement = document.getElementById('canvas-container');

        addEvent(canvasElement,"mousedown", mouseDown);
        addEvent(document, "mouseup", mouseUp);
        addEvent(canvasElement, "mousemove", mouseMove);


        addEvent(document.getElementById("startingBlock"), "mousedown", onStartingBlock);
        addEvent(document.getElementById("endBlock"), "mousemove", onExit);

        inGame = true;
    }

    function deInitMouse(){

        var canvasElement = document.getElementById('canvas-container');

        removeEvent(canvasElement,"mousedown", mouseDown);
        removeEvent(document, "mouseup", mouseUp);
        removeEvent(canvasElement, "mousemove", mouseMove);

        removeEvent(document.getElementById("startingBlock"), "mousedown", onStartingBlock);
        removeEvent(document.getElementById("endBlock"), "mousemove", onExit);

    }

    

    function onStartingBlock(){
        if(!mazeWriter && !pathStarted){
            pathStarted = true;
        }
    }

    function onExit(){
        // This needs to be handled by server
        // if(!mazeWriter && pathStarted){
        //  alert('You finished the maze, congrats!  Close your window to disconnect or refresh to enter a new game.  MazeOn, Path Finder!');
        // }
        if(!mazeWriter && !pathStarted){
            alert("Stop messing around and 'ENTER' on the red starting block!");
        }
    }

    function mouseDown() {
        //console.log("mouseDown");
        firstPoint = getPoint();
        isMouseDown = true;
    }
    function mouseMove(e){
        //console.log("mouseMove", e);
        if(mazeWriter || pathStarted){
            if(inputMode != 'line'){
                if(!mazeWriter || isMouseDown){
                    sendLine();
                }
                if(isMouseDown){
                    firstPoint = getPoint();//this cannot happen before sendLine is called!
                }
            }
        }
        if(!mazeWriter && inGame && !watchMode){
            clipper(getPoint());
        }
    }
    function mouseUp() {
        //console.log("mouseUpper");
        if(mazeWriter) { //nothing should ever change on mouseup for mazeSolver

            sendLine('end');
            firstPoint = {};//this cannot happen before sendLine() is called!
            isMouseDown = false;

            if(inGame){
                //this needs to occur after sendline.  Its main purpose is so that lastValidPoint on the serverside is set to null so the mazemaker can make a new line anywhere even if the ended on collision line.
                socket.emit('endLine', {name:name});

                // this may be superfluous if always in line mode for mazeWriter...UPDATE: turns out this is not superfluous it is needed when the end of a mazemaker line is not valid. (this happens less often because in order for the mazeWriter to have collision they need to keep drawing after the pathfinder has started and intersect one of their lines.)  This
            }
        }
    }

    function setMode(mode) {
        if(mazeWriter){
            inputMode = mode;
            alert('input mode has been set to'+ mode);
        }
        else{
            alert('you are not the MazeMaker, No cheating! ');
        }
    }

    // from quirksmode.org/js/findpos.html start
    function findPos(obj) {
        var curleft = 0,
            curtop = 0;
        if (obj.offsetParent) {
            do {
                curleft += obj.offsetLeft;
                curtop += obj.offsetTop;
            } while (obj = obj.offsetParent);
        }
        return {x:curleft,y:curtop};
    }
    // from quirksmode.org/js/findpos.html end

    function getPoint() {
            ev = window.event;
            document.getElementById("mouseCoord").innerHTML = "Mouse X:"+ev.pageX + " Mouse Y:"+ev.pageY;
            var canvas = document.getElementById('can');
            var canvasOffSet = findPos(canvas);

            var x = ev.pageX - canvasOffSet.x;
            var y = ev.pageY - canvasOffSet.y;
            return {x:x, y:y};
    }

    function sendLine (end){
        if(inGame){
            var secondPoint = getPoint();
            //console.log("emitedline");
            //console.log("sendline", {x1:firstPoint.x, y1:firstPoint.y, x2: secondPoint.x, y2:secondPoint.y, n:name, end:end, session:sessionNumber} );

            socket.emit('sendLine',{x1:firstPoint.x, y1:firstPoint.y, x2: secondPoint.x, y2:secondPoint.y, n:name, end:end, session:sessionNumber});
            //console.log({x1:firstPoint.x, y1:firstPoint.y, x2: secondPoint.x, y2:secondPoint.y, n:name, end:end});
            //console.log(firstPoint,secondPoint);
            //drawLine(firstPoint.x,firstPoint.y,secondPoint.x,secondPoint.y,'purple'); // this should be commented out for now it lets you see the path that the mouse takes when out of bounds.
        }
    }

//Mouse Events and Sending Lines: END