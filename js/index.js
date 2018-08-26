var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();function _possibleConstructorReturn(self, call) {if (!self) {throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call && (typeof call === "object" || typeof call === "function") ? call : self;}function _inherits(subClass, superClass) {if (typeof superClass !== "function" && superClass !== null) {throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);}subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}var _PIXI = PIXI,autoDetectRenderer = _PIXI.autoDetectRenderer,Graphics = _PIXI.Graphics,Container = _PIXI.Container,Texture = _PIXI.Texture,Point = _PIXI.Point,mesh = _PIXI.mesh;

// https://codepen.io/kynd/pen/pPGdqX

/**/ /* ---- CORE ---- */
/**/var mainColor = '#0D0106';
/**/var secondaryColor = '0xFCFAF9';
/**/var bgColor = '0x2C2B3C';
/**/var windowWidth = window.innerWidth;
/**/var windowHeight = window.innerHeight;
/**/var Renderer = function () {
  /**/function Renderer(width, height) {_classCallCheck(this, Renderer);
    /**/this.renderableCount = 0;
    /**/this.renderables = [];
    /**/this.renderer = autoDetectRenderer(width, height, {
      /**/antialias: true, resolution: 1, transparent: true
      /**/ });
    /**/this.dom = this.renderer.view;
    /**/this.scene = new Container();
    /**/this.animate = this.animate.bind(this);
    /**/this.resizeHandler = this.resizeHandler.bind(this);
    /**/}
  /**/_createClass(Renderer, [{ key: 'add', value: function add(renderable) {
      /**/this.scene.addChild(renderable);
      /**/if (renderable.update) {
        /**/this.renderableCount++;
        /**/this.renderables.push(renderable);
        /**/}
      /**/}
    /**/ }, { key: 'remove', value: function remove(renderable) {
      /**/var idx = this.renderables.indexOf(renderable);
      /**/if (idx < 0) {
        /**/this.scene.removeChild(renderable);
        /**/this.renderables.slice(idx, 1);
        /**/this.renderableCount--;
        /**/}
      /**/}
    /**/ }, { key: 'animate', value: function animate() {
      /**/var i = this.renderableCount;
      /**/while (--i >= 0) {
        /**/this.renderables[i].update();
        /**/}
      /**/this.renderer.render(this.scene);
      /**/}
    /**/ }, { key: 'resizeHandler', value: function resizeHandler(w, h) {
      /**/this.renderer.resize(w, h);
      /**/var i = this.renderableCount;
      /**/while (--i >= 0) {
        /**/if (this.renderables[i].resize) this.renderables[i].resize();
        /**/}
      /**/}
    /**/ }]);return Renderer;}();
/**/var renderer = new Renderer(windowWidth, windowHeight);
/**/document.body.appendChild(renderer.dom);
/**/
/**/
/* ---- CREATING ZONE ---- */

// ############
// PROPS
// ############
var NONE = 0;
var DRAW = 1;
var MOVE = 2;
var props = {
  GRAVITY_X: 0,
  GRAVITY_Y: 0,
  SPRING: 0.8,
  TENTION: 0.5,
  VEL: 0.95,
  SEGMENT_LENGTH: 25,
  ROPE_WIDTH: 10,
  mouseEvent: NONE,
  ropeOverred: false };


var gui = new dat.GUI();
gui.close();
gui.add(props, 'GRAVITY_X', 0, 20);
gui.add(props, 'GRAVITY_Y', 0, 20);
gui.add(props, 'SPRING', 0, 1.5);
gui.add(props, 'TENTION', 0.2, 1);
gui.add(props, 'VEL', 0, 1);
gui.add(props, 'SEGMENT_LENGTH', 1, 100);


// ############
// UTILS
// ############
Math.sqr = function (x) {return x * x;};
var existingValueBy = function existingValueBy(arr, comparator) {return (
    arr.filter(function (value) {return comparator(value);})[0]);};

var radians = function radians(degrees) {return degrees * Math.PI / 180;};
var getDistBetweenTwoVec2 = function getDistBetweenTwoVec2(x1, y1, x2, y2) {
  var x = x1 - x2;
  var y = y1 - y2;
  var dist = Math.sqrt(Math.sqr(y) + Math.sqr(x));
  return { x: x, y: y, dist: dist };
};
var easing = function easing(target, value) {var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},_ref$vel = _ref.vel,vel = _ref$vel === undefined ? 0.03 : _ref$vel,_ref$update = _ref.update,update = _ref$update === undefined ? function (f) {return f;} : _ref$update,_ref$callback = _ref.callback,callback = _ref$callback === undefined ? function (f) {return f;} : _ref$callback;
  var f = (target - value) * vel;
  update(value + f, f);
  if (Math.abs(f) < 0.001) {
    update(target, f);
    callback();
  }
};
var canvasBuilder = function canvasBuilder() {
  var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window.innerWidth;var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window.innerHeight;
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  var context = canvas.getContext('2d');
  return {
    canvas: canvas,
    context: context,
    getImageData: function getImageData() {return context.getImageData(0, 0, width, height).data;} };

};
var applyImageToCanvas = function applyImageToCanvas(image, w, h) {return new Promise(function (resolve, reject) {
    var width = w || image.width;
    var height = h || image.height;
    var canvasB = canvasBuilder(width, height);var
    canvas = canvasB.canvas,context = canvasB.context;
    context.drawImage(image, 0, 0, width, height);
    resolve(canvas);
  });};

// ############
// ROPE
// ############
var ropePattern = document.getElementById('ropePattern');
// TODO use the good patterns :
// - http://jeremieboulay.fr/assets/ropeBegin.png
// - http://jeremieboulay.fr/assets/ropeEnd.png
var ropeBegin = document.getElementById('ropePattern');
var ropeEnd = document.getElementById('ropePattern');var

Rope = function (_Container) {_inherits(Rope, _Container);
  function Rope(p1, p2) {var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},_ref2$color = _ref2.color,color = _ref2$color === undefined ? 0xf4cd6a : _ref2$color,_ref2$textured = _ref2.textured,textured = _ref2$textured === undefined ? true : _ref2$textured;_classCallCheck(this, Rope);var _this = _possibleConstructorReturn(this, (Rope.__proto__ || Object.getPrototypeOf(Rope)).call(this));

    if (!p1.x || !p1.y || !p2.x || !p2.y) {
      console.warging('the two first parameters must be vector2');
      return _possibleConstructorReturn(_this);
    }

    _this.texture = null;
    _this.nbrOfNodes = 0;
    _this.points = [];
    _this.oldPoints = [];
    _this.attachedPoints = [];
    _this.count = 0;
    _this.interacitonDist = props.SEGMENT_LENGTH / 2;

    // Normalize and place point to the line
    // http://math.stackexchange.com/questions/175896/finding-a-point-along-a-line-a-certain-distance-away-from-another-point
    var _getDistBetweenTwoVec = getDistBetweenTwoVec2(p1.x, p1.y, p2.x, p2.y),dist = _getDistBetweenTwoVec.dist;
    var u = {
      x: (p1.x - p2.x) / dist,
      y: (p1.y - p2.y) / dist };

    var distToP1 = 0;
    while (distToP1 < dist) {
      _this.addPoint(
      p1.x - distToP1 * u.x,
      p1.y - distToP1 * u.y);

      distToP1 = _this.nbrOfNodes * props.SEGMENT_LENGTH;
    }
    _this.addPoint(p2.x, p2.y);

    // DEBUG
    if (textured) {
      _this.buildRopeTexture(function () {
        _this.rope = new mesh.Rope(_this.texture, _this.points);
        _this.rope.tint = color;
        _this.addChild(_this.rope);
      });
    } else {
      _this.g = new Graphics();
      _this.addChild(_this.g);
    }

    _this.update = _this.update.bind(_this);
    _this.onCursorOver = _this.onCursorOver.bind(_this);
    _this.onCursorOut = _this.onCursorOut.bind(_this);
    _this.updateCursorPosition = _this.updateCursorPosition.bind(_this);return _this;
  }

  // INIT
  _createClass(Rope, [{ key: 'addPoint', value: function addPoint(x, y) {
      this.nbrOfNodes++;
      this.points.push(new Point(x, y));
      this.oldPoints.push(new Point(x, y));
    } }, { key: 'buildRopeTexture', value: function buildRopeTexture(

    callback) {var _this2 = this;
      var canvasRopePattern = null;
      var canvasRopeBegin = null;
      applyImageToCanvas(ropePattern, props.ROPE_WIDTH, props.ROPE_WIDTH).then(function (cRopePattern) {
        canvasRopePattern = cRopePattern;
        return applyImageToCanvas(ropeBegin, props.ROPE_WIDTH, props.ROPE_WIDTH);
      }).then(function (cRopeBegin) {
        canvasRopeBegin = cRopeBegin;
        return applyImageToCanvas(ropeEnd, props.ROPE_WIDTH, props.ROPE_WIDTH);
      }).then(function (cRopeEnd) {
        // build rope
        var ropeWidth = _this2.nbrOfNodes * props.SEGMENT_LENGTH;var _canvasBuilder =
        canvasBuilder(ropeWidth, props.ROPE_WIDTH),canvas = _canvasBuilder.canvas,context = _canvasBuilder.context;
        var nbrOfRopePattern = ropeWidth / canvasRopePattern.height - 1;
        context.drawImage(canvasRopeBegin, 0, 0);
        for (var i = 1; i < nbrOfRopePattern; i++) {
          context.drawImage(canvasRopePattern, i * props.ROPE_WIDTH, 0);
        }
        context.drawImage(cRopeEnd, ropeWidth - props.ROPE_WIDTH, 0);

        _this2.texture = Texture.fromCanvas(canvas);
        callback();
      }).
      catch(console.log);
    }

    // CORE
  }, { key: 'attachPoint', value: function attachPoint(idx) {
      var x = arguments.length > 1 && arguments[1] !== undefined ?
        arguments[1] : 0;
      var y = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      point = { idx: idx, x: x, y: y };
      this.attachedPoints.push(point);
      return point;
    } }, { key: 'detachPoint', value: function detachPoint(

    idx) {
      var existingValue = existingValueBy(this.attachedPoints, function (value) {return value.idx === idx;});
      if (existingValue) {
        this.attachedPoints.splice(this.attachedPoints.indexOf(existingValue), 1);
      } else {
        console.log('ERROR : The point ' + idx + ' is not attached');
      }
    } }, { key: 'pointIsAttached', value: function pointIsAttached(

    idx) {
      return this.attachedPoints.indexOf(idx) !== -1;
    }

    // LISTENERS
  }, { key: 'addListener', value: function addListener() {
      this.rope.interactive = true;
      this.rope.on('pointerover', this.onCursorOver);
      this.rope.on('pointerout', this.onCursorOut);
    } }, { key: 'removeListener', value: function removeListener()

    {
      if (this.rope) {
        this.rope.interactive = false;
        this.rope.off('pointerover', this.onCursorOver);
        this.rope.off('pointerout', this.onCursorOut);
        this.onCursorOut();
      }
    }

    // MOUSE EFFECTS
  }, { key: 'onCursorOver', value: function onCursorOver() {
      this.rope.on('mousemove', this.updateCursorPosition);
      this.over = true;
      props.ropeOverred = this;
    } }, { key: 'onCursorOut', value: function onCursorOut()

    {
      this.rope.off('mousemove', this.updateCursorPosition);
      props.ropeOverred = false;
      this.pointOverred = false;
    } }, { key: 'updateCursorPosition', value: function updateCursorPosition(

    e) {
      this.pointOverred = false;

      var i = this.points.length - 1;
      var positioned = false;

      while (!positioned && i >= 0) {var _getDistBetweenTwoVec2 =
        getDistBetweenTwoVec2(
        e.data.global.x,
        e.data.global.y,
        this.points[i].x,
        this.points[i].y),_dist = _getDistBetweenTwoVec2.dist;


        if (_dist < this.interacitonDist) {
          positioned = true;
          this.points[i].y -= 2;
          this.points[i].x += 1;
          this.pointOverred = i;
        }
        i--;
      }
    }

    // RENDERING
    // https://codepen.io/chribbe/pen/aHhdE?editors=0010
  }, { key: 'update', value: function update() {
      // gravity
      for (var i = 1; i < this.nbrOfNodes; i++) {
        this.points[i].x += props.GRAVITY_X;
        this.points[i].y += props.GRAVITY_Y;
      }

      for (var _i = 1; _i < this.nbrOfNodes; _i++) {
        // friction
        var oldP = {
          x: this.points[_i].x,
          y: this.points[_i].y };

        this.points[_i].x += (this.points[_i].x - this.oldPoints[_i].x) * props.VEL;
        this.points[_i].y += (this.points[_i].y - this.oldPoints[_i].y) * props.VEL;
        this.oldPoints[_i] = oldP;

        // tention
        var x = this.points[_i].x - this.points[_i - 1].x;
        var y = this.points[_i].y - this.points[_i - 1].y;
        var _dist2 = Math.sqrt(Math.sqr(y) + Math.sqr(x));
        var f = (_dist2 - props.SEGMENT_LENGTH) * props.TENTION;
        var fx = x / _dist2 * f;
        var fy = y / _dist2 * f;
        this.points[_i].x -= fx;
        this.points[_i].y -= fy;
        this.points[_i - 1].x += fx * props.SPRING;
        this.points[_i - 1].y += fy * props.SPRING;
      }

      // UPDATE ATTACHED POINTS
      for (var j = 0; j < this.attachedPoints.length; j++) {
        var attachedPoint = this.attachedPoints[j];
        this.points[attachedPoint.idx].x = attachedPoint.x;
        this.points[attachedPoint.idx].y = attachedPoint.y;
      }

      if (this.g) this.renderPoints();
    } }, { key: 'renderPoints', value: function renderPoints()

    {
      this.g.clear();
      this.g.moveTo(this.points[0].x, this.points[0].y);
      for (var i = 1; i < this.points.length; i++) {
        this.g.beginFill(0xffffff, 0);
        this.g.lineStyle(1, 0x48E5C2, 1);
        this.g.lineTo(this.points[i].x, this.points[i].y);
        this.g.endFill();
      }
    } }]);return Rope;}(Container);


// ############
// MARKER
// ############
var Marker = function (_Graphics) {_inherits(Marker, _Graphics);
  function Marker(x, y) {var size = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 10;_classCallCheck(this, Marker);var _this3 = _possibleConstructorReturn(this, (Marker.__proto__ || Object.getPrototypeOf(Marker)).call(this));


    _this3.position = { x: x, y: y };
    _this3.rotation = Math.random() * 10;
    _this3.size = size;

    _this3.beginFill(0x2C2B3C, 0);
    _this3.lineStyle(2, 0xFCFAF9);
    _this3.circle = _this3.arc(0, 0, _this3.size, 0, radians(325));
    _this3.endFill();

    _this3.hide();return _this3;
  }_createClass(Marker, [{ key: 'move', value: function move(

    x, y) {
      this.position = { x: x, y: y };
    } }, { key: 'show', value: function show(

    x, y, callback) {
      this.position = { x: x, y: y };
      this.animateScale(1, callback);
    } }, { key: 'hide', value: function hide(

    callback) {
      this.animateScale(0, callback);
    } }, { key: 'animateScale', value: function animateScale(

    value, callback) {
      this.isAnimated = true;
      this.targetedScale = value;
      this.animationCallback = callback;
    } }, { key: 'update', value: function update()

    {var _this4 = this;
      this.rotation += 0.1;

      // AnimateScale
      if (this.isAnimated) {
        easing(this.targetedScale, this.scale.x, {
          vel: 0.2,
          update: function update(v) {
            _this4.scale.x = _this4.scale.y = v;
          },
          callback: function callback() {
            _this4.isAnimated = false;
            if (_this4.animationCallback) _this4.animationCallback();
          } });

      }
    } }]);return Marker;}(Graphics);


// ############
// ROPE FABRIC
// ############
var RopeFabric = function () {
  function RopeFabric() {_classCallCheck(this, RopeFabric);
    this.ropes = [];
    this.ropeAttachedToMouse = false;
    this.pointAttachedToMouse = false;
    this.mouseStartMarker = new Marker();
    renderer.add(this.mouseStartMarker);
    this.mouseEndMarker = new Marker();
    renderer.add(this.mouseEndMarker);
    this.line = new Graphics();
    renderer.add(this.line);

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.drawConstructorLine = this.drawConstructorLine.bind(this);

    renderer.dom.addEventListener('mousemove', this.onMouseMove);
    renderer.dom.addEventListener('mousedown', this.onMouseDown);
    renderer.dom.addEventListener('mouseup', this.onMouseUp);
  }

  // EVENTS
  _createClass(RopeFabric, [{ key: 'onMouseMove', value: function onMouseMove(e) {
      switch (props.mouseEvent) {
        case DRAW:
          this.drawConstructorLine(
          this.mouseStartMarker.position.x,
          this.mouseStartMarker.position.y,
          e.x, e.y);

          break;
        case MOVE:
          this.pointAttachedToMouse.x = e.x;
          this.pointAttachedToMouse.y = e.y;
          break;
        case NONE:
          break;
        default:
          console.log('ERROR:onMouseMove');
          break;}

    } }, { key: 'onMouseUp', value: function onMouseUp(

    e) {
      console.log(this.mouseStartMarker);
      switch (props.mouseEvent) {
        case DRAW:
          props.mouseEvent = NONE;
          this.mouseStartMarker.hide();
          this.mouseEndMarker.hide();
          this.line.clear();

          this.createRope(
          { x: e.x, y: e.y },
          this.mouseStartMarker.position);

          break;
        case MOVE:
          break;
        case NONE:
          break;
        default:
          console.log('ERROR:onMouseUp');
          break;}

    } }, { key: 'onMouseDown', value: function onMouseDown(

    e) {
      switch (props.mouseEvent) {
        case DRAW:
          break;
        case MOVE:
          this.detachPointToMouse();
          break;
        case NONE:
          props.mouseEvent = DRAW;
          this.mouseStartMarker.show(e.x, e.y);
          this.mouseEndMarker.show(e.x, e.y);
          break;
        default:
          console.log('ERROR:onMouseDown');
          break;}

    }

    // GRAPHIC
  }, { key: 'createRope', value: function createRope(p1, p2) {var ropeProps = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};var _getDistBetweenTwoVec3 =
      getDistBetweenTwoVec2(p1.x, p1.y, p2.x, p2.y),dist = _getDistBetweenTwoVec3.dist;
      if (dist > 30) {
        var rope = new Rope(p1, p2, ropeProps);
        this.ropes.push(rope);
        renderer.add(rope);

        this.attachRopeToMouse(rope, 0, p1.x, p1.y);
      }
    } }, { key: 'drawConstructorLine', value: function drawConstructorLine(

    x1, y1, x2, y2) {
      this.line.clear();
      this.line.beginFill(secondaryColor, 0);
      this.line.lineStyle(2, secondaryColor);
      this.line.moveTo(x1, y1);
      this.line.lineTo(x2, y2);
      this.line.endFill();
      this.mouseEndMarker.move(x2, y2);
    } }, { key: 'addMarker', value: function addMarker(

    x, y) {
      var marker = new Marker(x, y);
      renderer.add(marker);
    }

    // CORE
  }, { key: 'attachRopeToMouse', value: function attachRopeToMouse(rope) {var pointIdx = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;var x = arguments[2];var y = arguments[3];
      if (pointIdx === -1) {
        console.log('ERROR : the point does not exist');
        return;
      }

      if (rope.pointIsAttached(pointIdx)) {
        rope.detachPoint(pointIdx);
      } else {
        props.mouseEvent = MOVE;
        rope.removeListener();
        console.log('IDX:', pointIdx)
        rope.attachPoint(pointIdx, x, y);
        rope.attachPoint(rope.points.length -1, windowWidth * 0.25, windowHeight * 0.5)
        this.ropeAttachedToMouse = rope;
      }
    } }, { key: 'detachPointToMouse', value: function detachPointToMouse()

    {
      props.mouseEvent = NONE;
      this.ropeAttachedToMouse.addListener();
      this.ropeAttachedToMouse = false;
      this.pointAttachedToMouse = false;
    } }]);return RopeFabric;}();


// START
var ropeFabric = new RopeFabric();
ropeFabric.createRope(
{ x: windowWidth * 0.6, y: windowHeight * 0.5 },
{ x: windowWidth * 0.35, y: windowHeight * 0.5 });

let demoRope = ropeFabric.ropes[0]
setInterval(() => {
  demoRope.attachedPoints[0].y = demoRope.attachedPoints[0].y - 100;
    demoRope.attachedPoints[0].x = demoRope.attachedPoints[0].x - 30;
  setTimeout(() => {
    demoRope.attachedPoints[0].y = demoRope.attachedPoints[0].y + 100;
    demoRope.attachedPoints[0].x = demoRope.attachedPoints[0].x + 30;
  }, 200)
}, 5000)

  let countdown = document.getElementById('countdown')
  let secondsLeft = 4
let next =   () => {
  countdown.textContent = secondsLeft
  secondsLeft--
  if(secondsLeft < 0) {
    clearInterval(countDownTimer)
    countdown.style.display = 'none'
  }
}
let countDownTimer  = setInterval(
  next, 1000)
/* ---- CREATING ZONE END ---- */


/* ---- NODE TWO CANVAS SYSTEM ---- */

let nodeCanvas1 = n1 = document.getElementById('node1').getContext('2d');
let nodeCanvas2 = n2 = document.getElementById('node2').getContext('2d');

[n1, n2].map((node, i) => {
  j = i + 1 
  let elem = document.getElementById(`node${j}`)
  elem.style.position = 'absolute'
  elem.style.top = '38%'
  elem.style.left = i === 1 ?'17%' : '52%'

  node.moveTo(200 * 0.5 * j, 200 * 0.5)
  node.beginPath();
  // node.arc(200* 0.5, 200* 0.5, 18, 0, Math.PI*2);

  node.lineWidth=5;
  node.strokeStyle = '#6e4523'
  node.stroke()
  node.closePath();
})

/**/
/**/
/**/ /* ---- ON RESIZE ---- */
/**/function onResize() {
  /**/windowWidth = window.innerWidth;
  /**/windowHeight = window.innerHeight;
  /**/renderer.resizeHandler(windowWidth, windowHeight);
  /**/}
/**/window.addEventListener('resize', onResize);
/**/window.addEventListener('orientationchange', onResize);
/**/ /* ---- LOOP ---- */
/**/function _loop() {
  /**/renderer.animate();
  /**/requestAnimationFrame(_loop);
  /**/}
/**/_loop();