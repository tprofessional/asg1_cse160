// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global vars
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;


function setupWebGL() {
  // Retrieve <canvas> element
  // made global
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  // made global
  // gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Globals related to UI elements
// starting value is white
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
// starting value is min set in html
let g_selectedSize = 5;
// default point type is POINT
let g_selectedType = POINT;
console.log("default type is point")
// default number of circle segments
let g_selectedSeg = 10;

// set up actions for the HTML UI elements
function addActionsForHtmlUI() {
  // button events (shape color)
  document.getElementById('green').onclick = function() {g_selectedColor = [0.0, 1.0, 0.0, 1.0];};
  document.getElementById('red').onclick = function() {g_selectedColor = [1.0, 0.0, 0.0, 1.0];};
  // clear button
  document.getElementById('clear').onclick = function() {g_shapesList = []; renderAllShapes();};
  // point button
  document.getElementById('point').onclick = function() {g_selectedType = POINT};
  // triangle button
  document.getElementById('triangle').onclick = function() {g_selectedType = TRIANGLE};
  // circle button
  document.getElementById('circle').onclick = function() {g_selectedType = CIRCLE};  

  
  // color slider events
  document.getElementById('redSlide').addEventListener('mouseup', function() {g_selectedColor[0] = this.value/100;});
  document.getElementById('greenSlide').addEventListener('mouseup', function() {g_selectedColor[1] = this.value/100;});
  document.getElementById('blueSlide').addEventListener('mouseup', function() {g_selectedColor[2] = this.value/100;});
  // size slider event
  document.getElementById('sizeSlide').addEventListener('mouseup', function() {g_selectedSize = this.value;});
  // size slider event
  document.getElementById('segSlide').addEventListener('mouseup', function() {g_selectedSeg = this.value;});
}

function main() {
  // set up canvas and gl vars
  setupWebGL();
  // set up GLSL shader programs and connect GLSL vars
  connectVariablesToGLSL();

  // set up actions for the HTML UI elems
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  // no longer need the global vars as params
  canvas.onmousedown = click;
  //canvas.onmousemove = click;
  canvas.onmousemove = function(ev) {if(ev.buttons == 1) {click(ev)}};

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

// Array to store all points
var g_shapesList = [];

function click(ev) {
  // Extract the event click and return it in WebGL coordinates
  [x,y] = convertCoordinatesEventToGL(ev);
  
  // Create and store the new point
  let point;
  if (g_selectedType == POINT) {
    point = new Point();
    console.log("type is now point");
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
    console.log("type is now triangle");
  } else {
    point = new Circle();
    // update the segments
    point.segments = g_selectedSeg;
    console.log("type is now circle");
  }
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  g_shapesList.push(point);

  // draw every shape that is supposed to be in the canvas
  renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
  // converting coordinate systems
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x, y]);
}

function renderAllShapes() {
  // check the start time of this function
  var startTime = performance.now();

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // var len = g_points.length;
  var len = g_shapesList.length;

  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  // check the time at the end of the function, and show on webpage
  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration), "numdot");
}

// Set the text of a HTML element
function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}
// notes
// all sliders start at max, but the default starting size of size slider is 5
// so it's a little misleading when u first click on the site without changing 
// the slider vars. would be nice to fix this

// stupid fix would be to set the init value to 45 (max slider value)