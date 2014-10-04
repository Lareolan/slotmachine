var triangleVertexPositionBuffer;
var triangleVertexColorBuffer;
var squareVertexPositionBuffer;
var squareVertexColorBuffer;
var gl;
var rTri = 0;
var rSquare = 0;
var lastTime = 0;
var xRot = 0;
var yRot = 0;
var zRot = 0;

var drumRadius = 2 / Math.tan(degToRad(22.5));


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
var mvMatrixStack = [];
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

    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

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

function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
//    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function webGLStart() {
    var canvas = document.getElementById("webgl-canvas");
    initGL(canvas);
    initShaders();
    initBuffers();
    initTextures();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

//    drawScene();
    tick();
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

    triangleVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
    var colors = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    triangleVertexColorBuffer.itemSize = 4;
    triangleVertexColorBuffer.numItems = 3;

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

    squareVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexTextureCoordBuffer);
    var textureCoords = [
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    squareVertexTextureCoordBuffer.itemSize = 2;
    squareVertexTextureCoordBuffer.numItems = 4;
/*
    squareVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
    colors = []
    for (var i = 0; i < 4; i++) {
        colors = colors.concat([0.5, 0.5, 1.0, 1.0]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    squareVertexColorBuffer.itemSize = 4;
    squareVertexColorBuffer.numItems = 4;
*/
}

var neheTexture;
function initTextures() {
    neheTexture = gl.createTexture();
    neheTexture.image = new Image();
    neheTexture.image.onload = function () {
        handleLoadedTexture(neheTexture)
    }

    neheTexture.image.src = "../img/cherry_640.png";
}

function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function tick() {
    requestAnimFrame(tick);
    drawScene();
    animate();
}

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(pMatrix, 45.0, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

    mat4.identity(mvMatrix);

    var translation = vec3.create();
    var rotation = vec3.create();

    //draw the triangle

/*
//    vec3.set(translation, -1.5, 1.0, -7.0);
//    mat4.translate(mvMatrix, mvMatrix, translation);

    mvPushMatrix();
    vec3.set(rotation, 0, 1, 0);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(rTri), rotation);

    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);
    mvPopMatrix();
*/

    // draw the square
//    vec3.set(translation, 3.0, 0.0, 0.0);
//    mat4.translate(mvMatrix, mvMatrix, translation);
    vec3.set(translation, 0.0, 0.0, -5.0);
    mat4.translate(mvMatrix, mvMatrix, translation);

    vec3.set(translation, 0.0, 0.0, -drumRadius);
    mat4.translate(mvMatrix, mvMatrix, translation);

    mvPushMatrix();
    vec3.set(rotation, 1, 0, 0);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(xRot), rotation);

    vec3.set(translation, 0.0, 0.0, drumRadius);
    mat4.translate(mvMatrix, mvMatrix, translation);

//    vec3.set(rotation, 0, 1, 0);
//    mat4.rotate(mvMatrix, mvMatrix, degToRad(yRot), rotation);
//    vec3.set(rotation, 0, 0, 1);
//    mat4.rotate(mvMatrix, mvMatrix, degToRad(zRot), rotation);
    
//    mat4.rotate(mvMatrix, mvMatrix, degToRad(rSquare), rotation);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

//    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
//    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, squareVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, neheTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);




    // 2nd square
    mvPushMatrix();

    vec3.set(translation, 0.0, 0.0, -drumRadius);
    mat4.translate(mvMatrix, mvMatrix, translation);

    vec3.set(rotation, 1, 0, 0);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(22.5), rotation);

    vec3.set(translation, 0.0, 0.0, drumRadius);
    mat4.translate(mvMatrix, mvMatrix, translation);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
    mvPopMatrix();


    // 3rd square

    mvPushMatrix();
    vec3.set(translation, 0.0, 0.0, -drumRadius);
    mat4.translate(mvMatrix, mvMatrix, translation);

    vec3.set(rotation, 1, 0, 0);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(45), rotation);

    vec3.set(translation, 0.0, 0.0, drumRadius);
    mat4.translate(mvMatrix, mvMatrix, translation);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
    mvPopMatrix();



    mvPopMatrix();
}

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;

//        rTri += (90 * elapsed) / 1000.0;
//        rSquare += (75 * elapsed) / 1000.0;
        xRot += (90 * elapsed) / 1000.0;
        yRot += (60 * elapsed) / 1000.0;
        zRot += (30 * elapsed) / 1000.0;
    }
    lastTime = timeNow;
}

$(document).ready(function () {
    webGLStart();
});








