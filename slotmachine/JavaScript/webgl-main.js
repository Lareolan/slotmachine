/// <reference path="jquery.js" />

var triangleVertexPositionBuffer;
var squareVertexPositionBuffer;
var gl;

function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialize WebGL, sorry :-( ");
    }
}

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

var shaderProgram;
function initShaders() {
    shaderProgram = gl.createProgram();

    var fragmentShader = getShader(gl, "fragment");
    var vertexShader = getShader(gl, "vertex");

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialize shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}


function getShader(gl, shaderType) {
    $.ajax({ 
        url: "Resource/" + shaderType + ".shader",
        async: false,
        success: function (data) {
            shaderProgram[shaderType] = data;
        }
    })

    var shader;
    if (shaderType == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderType == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, shaderProgram[shaderType]);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function webGLStart() {
    var canvas = document.getElementById("webgl-canvas");
    initGL(canvas);
    initShaders();
    initBuffers();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    drawScene();
}

function initBuffers() {
    // TRIANGLE
    triangleVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);

    var vertices = [
         0.0, 1.0, 0.0,
        -1.0, -1.0, 0.0,
         1.0, -1.0, 0.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    triangleVertexPositionBuffer.itemSize = 3;
    triangleVertexPositionBuffer.numItems = 3;

    // SQUARE
    squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    vertices = [
         1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0,
         1.0, -1.0, 0.0,
        -1.0, -1.0, 0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 3;
    squareVertexPositionBuffer.numItems = 4;
}

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(pMatrix, 45.0, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

    mat4.identity(mvMatrix);

    var translation = vec3.create();

    //draw the triangle
    vec3.set(translation, -1.5, 1.0, -7.0);
    mat4.translate(mvMatrix, mvMatrix, translation);
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);

    // draw the square
    vec3.set(translation, 3.0, 0.0, 0.0);
    mat4.translate(mvMatrix, mvMatrix, translation);
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}

$(document).ready(function () {
    webGLStart();
});








