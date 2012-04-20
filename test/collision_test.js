var mouse = require('./../collision');

describe('collision', function(){

    describe('slope()', function(){
        it('should calculate the right slope', function(){
            var point1 = {x:0, y:0};
            var point2 = {x:1, y:1};

            var m = mouse.slope(point1, point2);
            m.should.equal(1);
        });

        it('should get neg infinite slope', function(){
            var point1 = {x:0, y:0};
            var point2 = {x:0, y:10};

            var m = mouse.slope(point1, point2);
            m.should.equal(-Infinity);
        });

        it('should get pos infinite slope', function(){
            var point1 = {x:0, y:120};
            var point2 = {x:0, y:0};

            var m = mouse.slope(point1, point2);
            m.should.equal(Infinity);
        });

        it('should be zero slope', function(){
            var point1 = {x:0, y:120};
            var point2 = {x:2, y:120};

            var m = mouse.slope(point1, point2);
            m.should.equal(0);
        });

        it('should be undefined NaN', function(){
            var point1 = {x:0, y:120};
            var point2 = {x:0, y:120};

            var m = mouse.slope(point1, point2);
            var isnan = isNaN(m);
            isnan.should.equal(true);
        });
    });

    describe('yIntercept()',function(){
        it('should be point.y if slope is zero', function() {
            var point1 = {x:0, y:120};
            mouse.yIntercept(point1, 0).should.equal(120);
        });
    });

    describe('getLineSpecs()',function(){
        it('should create a hash with the right slope(m) and y-intercept(b)',function(){
            var line = [{x:0, y:0},{x:1, y:1}];
            mouse.getLineSpecs(line).should.eql({m:1, b:0, anX:0});
        });
    });

    describe('pointOnLine()',function(){
        it('should return true when the point given is on the line given',function(){
            var point = {x:0.5,y:0.5};
            var line = [{x:0, y:0},{x:1, y:1}];
            var lineSpecs = mouse.getLineSpecs(line);
            mouse.pointOnLine(point,lineSpecs).should.eql(true);
        });
    });

    describe('pointOnLineSeg()',function(){
        var line2 = [{x:0, y:0},{x:1, y:1}];
        var line2specs = mouse.getLineSpecs(line2);

        it('should return true when both endpoints of line1 are on line2',function(){
            var line1 = [{x:0.5, y:0.5},{x:0.7, y:0.7}];
            mouse.pointOnLineSeg(line1,line2,line2specs).should.eql(true);
        });

        it('should return true when only the first endpoint of line1 is on line2',function(){
            var line1 = [{x:0.5, y:0.5},{x:0.7, y:0.8}];
            mouse.pointOnLineSeg(line1,line2,line2specs).should.eql(true);
        });

        it('should return true when only the second endpoint of line1 is on line2',function(){
            var line1 = [{x:0.6, y:0.8},{x:0.5, y:0.5}];
            mouse.pointOnLineSeg(line1,line2,line2specs).should.eql(true);
        });

        it('should return false when neither endpoint of line1 is on line2',function(){
            var line1 = [{x:0.5, y:0.6},{x:0.7, y:0.8}];
            mouse.pointOnLineSeg(line1,line2,line2specs).should.eql(false);
        });
    });

    describe('counterClockwise()',function(){
        var pointA = {x:0,y:0};
        var pointC = {x:5,y:5};

        it('should return true when point A,B,C are counterclockwise',function(){
            var pointB = {x:2,y:1};
            mouse.counterClockwise(pointA,pointB,pointC).should.eql(true);
        });

        it('should return false when point A,B,C are clockwise',function(){
            var pointB = {x:3,y:4};
            mouse.counterClockwise(pointA,pointB,pointC).should.eql(false);
        });
    });

    describe('boeIntersect()',function(){

        it('should return false for non-identical vertical line segments',function(){
            var line1 = [{x:1, y:2},{x:1, y:5}];
            var line2 = [{x:2, y:2},{x:2, y:5}];
            mouse.boeIntersect(line1,line2).should.eql(false);
        });

        it('should return false for non-vertical parallel line segments',function(){
            var line1 = [{x:0, y:0},{x:5, y:5}];
            var line2 = [{x:0, y:-1},{x:5, y:4}];
            mouse.boeIntersect(line1,line2).should.eql(false);
        });

        it('should return false for other non-intersecting line segments',function(){
            var line1 = [{x:-1, y:-1},{x:1, y:1}];
            var line2 = [{x:-1, y:1},{x:1, y:3}];
            mouse.boeIntersect(line1,line2).should.eql(false);
        });

        it('should return true for identical non-vertical line segments',function(){
            var line1 = [{x:0, y:0},{x:5, y:5}];
            var line2 = [{x:0, y:0},{x:5, y:5}];
            mouse.boeIntersect(line1,line2).should.eql(true);
        });

        it('should return true for identical vertical line segments',function(){
            var line1 = [{x:0, y:2},{x:0, y:5}];
            var line2 = [{x:0, y:2},{x:0, y:5}];
            mouse.boeIntersect(line1,line2).should.eql(true);

        });

        it('should return true for other intersecting line segments',function(){
            var line1 = [{x:-1, y:-1},{x:1, y:1}];
            var line2 = [{x:-1, y:1},{x:1, y:-1}];
            mouse.boeIntersect(line1,line2).should.eql(true);
        });
    });

    describe('lineCollide()', function(){
        it('should be true for x-axis and y-axis, where the x-range is -1 to 1',function(){
            var current_point = {x:0, y:1};
            var current_user = {name:'greg',old_xy:{x:0,y:-1}};
            var users = [
                            {name:'danielle', points:[{x:1,y:0},{x:-1,y:0}]}
                        ];
            mouse.lineCollide(current_point,current_user,users).should.equal(true);
        });

        it('should be true for inverse x-axis and y-axis, where the x-range is -1 to 1',function(){
            var current_point = {x:1, y:0};
            var current_user = {name:'greg',old_xy:{x:-1,y:0}};
            var users = [
                            {name:'danielle', points:[{x:0,y:1},{x:0,y:-1}]}
                        ];
            mouse.lineCollide(current_point,current_user,users).should.equal(true);
        });
    });
});