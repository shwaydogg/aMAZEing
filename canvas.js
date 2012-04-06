var canWidth = 600;
var canHeight = canWidth;
var slitWidth = 30;
var slitHeight = slitWidth;

var canvas = document.getElementById('can');
var clipPoint;

function clipper(point){
	var obj=document.getElementById("block1");
	obj.style.height=point.y - slitHeight;

	obj=document.getElementById("block2");
	obj.style.width=(canWidth - point.x) - slitWidth;

	obj=document.getElementById("block3");
	obj.style.height=(canHeight - point.y) - slitHeight;

	obj=document.getElementById("block4");
	obj.style.width= point.x - slitWidth;
}

// hide canvase http://robertnyman.com/2011/07/26/using-the-html5-canvas-clip-method-to-hide-certain-content/

function drawLine(x1,y1,x2,y2,color){
	if(canvas.getContext){
		var ctx = canvas.getContext('2d');
		ctx.strokeStyle=color;
		ctx.beginPath();
		ctx.moveTo(x1,y1);
		ctx.lineTo(x2,y2);
		ctx.stroke();
	}
}

function drawPoint(x,y,color){
	if(canvas.getContext){
		var ctx = canvas.getContext('2d');
		ctx.strokeStyle=color;
		ctx.beginPath();
		dot(ctx,x,y,3,color);
		ctx.stroke();
	}
}

function dot(ctx,x,y,rad,color){
	ctx.arc(x,y,rad,0,2*Math.PI,false);
	ctx.fillStyle=color;
	ctx.fill();
}

function clearCanvas(){
	canvas = document.getElementById('can');

	if(canvas.getContext){
		var ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}
}