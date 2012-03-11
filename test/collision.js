var mouse = require('./../mouse');

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

    describe('intersect()', function(){
        it('should return true for the x and y axis, ranges -1 to 1', function(){
            var line1  = {m:0, b:0, anX:0};
            var line2 = {m:Infinity,b:null, anX:0};
            mouse.intersect(line1,line2,-1,1).should.equal(true);
        });
        it('should return true for identical non vert lines', function(){
            var line1  = {m:2, b:4.5, anX:6};
            var line2 = {m:2,b:4.5, anX:6};
            mouse.intersect(line1,line2,-1,1).should.equal(true);
        });

        it('should return true for identical vert lines', function(){
            var line1  = {m:Infinity, b:4.5, anX:6};
            var line2 = {m:Infinity,b:4.5, anX:6};
            mouse.intersect(line1,line2,-1,1).should.equal(true);
        });

        it('should return false for non-identical vert lines', function(){
            var line1  = {m:-Infinity, b:4.5, anX:6};
            var line2 = {m:-Infinity,b:4.5, anX:5};
            mouse.intersect(line1,line2,-1,1).should.equal(false);
        });

        it('should return false for parallel lines', function(){
            var line1  = {m:2, b:3.5, anX:6};
            var line2 = {m:2,b:4.5, anX:6};
            mouse.intersect(line1,line2,-1,1).should.equal(false);
        });
        it('should return true for two normal lines', function(){
            var line1  = {m:2, b:3.5, anX:6};
            var line2 = {m:-2,b:4.5, anX:6};
            mouse.intersect(line1,line2,-100,100).should.equal(true);
        });
    });

    describe('lineCollide', function(){
        it('should be true for x and y axis from -1 to 1',function(){
            var current_point= {x:0, y:1};
            var current_user = {name:'greg',old_xy:{x:0,y:-1}};
            var users = [{name:"danielle", points:
                                                    [{x:1,y:0},{x:-1,y:0}]
                        }];
            mouse.lineCollide(current_point,current_user,users).should.equal(true);
        });
        it('should be true for inverse x and y axis from -1 to 1',function(){
            var current_point= {x:1, y:0};
            var current_user = {name:'greg',old_xy:{x:-1,y:0}};
            var users = [{name:"danielle", points:
                                                    [{x:0,y:1},{x:0,y:-1}]
                        }];
            mouse.lineCollide(current_point,current_user,users).should.equal(true);
        });
    });
});