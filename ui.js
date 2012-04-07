function searchKeyPress(e,buttonID){
    // look for window.event in case event isn't passed in
    if (typeof e == 'undefined' && window.event) { e = window.event; }
    if (e.keyCode == 13) // 13 is the return key 
    {
        document.getElementById(buttonID).click();
    }
}

function roomCheck(){
      console.log('buttonpressed');
      console.log(document.getElementById('roomNameInput').value);
      socket.emit('enterGame', document.getElementById('roomNameInput').value );
}