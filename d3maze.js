var w ,
    h ,
    scale ,
    rectHeight;
//poinData in initialized in mazeIO.js
var chart;


function d3Init(){  // Previously was d3Do

    pointData = [20,20, 0]; //d3 data for points

    w = 500,
    h = 400,
    scale = 1;//w / d3.max(pointData),
    rectHeight = h/ (pointData.length *2 );

    chart = d3.select("body").append("svg")
         .attr("width", 2*w)
        .attr("height", h)
         .attr("class", "chart");


    chart.selectAll("rect")
         .data(pointData)
       .enter().append("rect")
         .attr("y", function(d,i) {
                    return 2*i * rectHeight + rectHeight/2; })
         .attr("x", rectX)
         .attr("width", rectWidth)
         .attr("height", rectHeight);


    chart.selectAll("text")
         .data(pointData)
       .enter().append("text")
         .attr("x", w)
         .attr("y", function(d, i) { return 2 * i * rectHeight + rectHeight; })
         .attr("dx", -3 )//function(x){ return x>0 ? -3 + w/2 : 20 + w/2; }) // padding-right
         .attr("dy", ".35em") // vertical-align: middle
         .attr("text-anchor", "end") // text-align: right
         .text(String);

     chart.append("line")
        .attr("x1", w)
         .attr("x2", w)
         .attr("y1", 0)
         .attr("y2", h )
         .style("stroke", "#000");
}


var rectWidth = function (d,i){
    if(d<0)
        return d *-1 *scale ;
    else
        return d*scale;
};

var rectX = function(d,i){
    if(d<0){
        return w - rectWidth(d,i);
    }
    else{
        return w;
    }
};

var textX = function(d,i){
    var ret;
    if(d >= 0){
        ret = w + d -3;
    }else{
        ret = w + d + 25;
    }
    if(ret<20 && ret > -25){
        if(d >= 0){
            ret = 170;
        }
        else{
            ret = h;
        }
    }
    return ret;
};

 function redraw() { // Update…
      // if you get a bug on this line just do a check to make sure chart is defined and do nothing if it is not
     chart.selectAll("rect")
         .data(pointData)
       .transition()
         .duration(500)
        .attr("x", rectX)
        .attr("width", rectWidth);

     chart.selectAll("text")
     .data(pointData)
     .transition()
         .duration(500)
      .text(String);
   
   }