function DrumObject(glContext) {
    // Local storage variables and "constants"
    var gl = glContext;
    var drum;
    var drumTileCount = 8;
    var angleDelta = 360 / drumTileCount;
    var drumRadius = 2.41 / Math.tan(degToRad(angleDelta));
//    var drumRadius = 3.5 / Math.tan(degToRad(angleDelta));

    var vertArray = Array(drumTileCount);
    var texCoordsArray = [];
    var textureArray = [];
    var drumPosition = { x: 0, y: 0, z: 0 };

    // These variables are used for smooth stopping animation
    var stopping = false;
    var spinning = false;
    var result;
    var currentItem;


    var textureCoords = [
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ];
    var vertices = [
        vec3.fromValues(1.0, 1.0, 0.0),
        vec3.fromValues(-1.0, 1.0, 0.0),
        vec3.fromValues(1.0, -1.0, 0.0),
        vec3.fromValues(-1.0, -1.0, 0.0)
    ];

    this.create = function(textureArray, shaderProgram) {
        var transformationMatrix = mat4.create();
        var translation = vec3.create();
        var rotation = vec3.create();
        var newXYZ = vec3.create();

        for (var i = 0; i < drumTileCount; i++) {
            vertArray[i] = [];

            for (var j = 0; j < vertices.length; j++) {
                mat4.identity(transformationMatrix);
                vec3.set(translation, 0.0, 0.0, -drumRadius);
                mat4.translate(transformationMatrix, transformationMatrix, translation);

                vec3.set(rotation, 1, 0, 0);
                mat4.rotate(transformationMatrix, transformationMatrix, -degToRad(i * angleDelta), rotation);

                vec3.set(translation, 0.0, 0.0, drumRadius);
                mat4.translate(transformationMatrix, transformationMatrix, translation);

                vec3.transformMat4(newXYZ, vertices[j], transformationMatrix);

                vertArray[i].push(vec3.clone(newXYZ));
            }
            texCoordsArray.push(textureCoords);
        }

        drum = new webgl.object3d(gl);
        if (!drum.initGeometry(vertArray, texCoordsArray))
            console.log("Drum error. Error initializing Geometry!");
        if (!drum.assignTextures(textureArray))
            console.log("Drum error. Error assigning Textures!");
        drum.assignShaderProgram(shaderProgram);
    }

    this.draw = function (movementMatrix) {
        // Reset the center of drawing to be at the center of the object (so it would rotate around central axis),
        // and also offset the object to where we want it on screen.
        drum.setPosition([0, 0, -drumRadius]);
        var translation = vec3.fromValues(drumPosition.x, drumPosition.y, drumPosition.z);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        if (!drum.draw(translationMatrix))
            console.log("Drawing error!");

        if (stopping) {
            var rotationSpeed = drum.getRotationSpeed()[0];
            if (rotationSpeed <= 0) {
                drum.stopAnimation();
                stopping = false;
            } else {
                var newCurrentItem = Math.round(drum.getRotation()[0] / angleDelta);
                if (newCurrentItem === result) {
                    drum.setRotationSpeed([30, 0, 0]);
                    if ((drum.getRotation()[0] > result * angleDelta - 5) && (drum.getRotation()[0] < result * angleDelta + 5)) {
                        drum.setRotationSpeed([0, 0, 0]);
                        drum.setRotation([result * angleDelta, 0, 0]);
                    }
                }
            }
        }
    }

    this.setPosition = function (position) {
        drumPosition.x = position[0];
        drumPosition.y = position[1];
        drumPosition.z = position[2];
    }

    this.spin = function () {
        if (!spinning) {
            drum.setRotationSpeed([720, 0, 0]);
            drum.setRotation([Math.random()* 8 * angleDelta, 0, 0]);
            drum.startAnimation();
            spinning = true;
            result = undefined;
        }
    }

    this.stop = function () {
        if (spinning) {
            stopping = true;
            spinning = false;
            result = Math.floor(Math.random() * 8);
//            console.log("Drum result: " + textureNameList[result]);

            currentItem = ((result - 3) < 0) ? (result - 3) + 8 : (result - 3);
            drum.setRotation([currentItem * angleDelta, 0, 0]);
            drum.setRotationSpeed([drum.getRotationSpeed()[0] / 4, 0, 0]);
        }
    }

    this.getResult = function () {
        return result;
    }
}

function MachineObject(glContext) {
    // Local storage variables and "constants"
    var gl = glContext;
    var machine;
    var machineFaceCount = 4;

    var vertArray = []; // Array(machineFaceCount);
    var texCoordsArray = [];
    var textureArray = [];
    
    var textureCoords = [
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ];
    var topVertices = [
        vec3.fromValues(1.1, 1.1, 0.0),
        vec3.fromValues(-1.1, 1.1, 0.0),
        vec3.fromValues(1.1, 0.35, 0.0),
        vec3.fromValues(-1.1, 0.35, 0.0)
    ];
    var leftVertices = [
        vec3.fromValues(-0.75, 0.35, 0.0),
        vec3.fromValues(-1.1, 0.35, 0.0),
        vec3.fromValues(-0.75, -0.35, 0.0),
        vec3.fromValues(-1.1, -0.35, 0.0)
    ];
    var rightVertices = [
        vec3.fromValues(1.1, 0.35, 0.0),
        vec3.fromValues(0.75, 0.35, 0.0),
        vec3.fromValues(1.1, -0.35, 0.0),
        vec3.fromValues(0.75, -0.35, 0.0)
    ];
    var bottomVertices = [
        vec3.fromValues(1.1, -0.35, 0.0),
        vec3.fromValues(-1.1, -0.35, 0.0),
        vec3.fromValues(1.1, -1.1, 0.0),
        vec3.fromValues(-1.1, -1.1, 0.0)
    ];

    this.create = function (textureArray, shaderProgram) {
        vertArray.push(topVertices);
        vertArray.push(bottomVertices);
        vertArray.push(leftVertices);
        vertArray.push(rightVertices);

        for (var i = 0; i < machineFaceCount; i++) {
            texCoordsArray.push(textureCoords);
        }
        
        machine = new webgl.object3d(gl);
        if (!machine.initGeometry(vertArray, texCoordsArray))
            console.log("Drum error. Error initializing Geometry!");
        if (!machine.assignTextures(textureArray))
            console.log("Drum error. Error assigning Textures!");
        machine.assignShaderProgram(shaderProgram);
    }

    this.draw = function (movementMatrix) {
        var translation = vec3.fromValues(0, 0, -2);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        if (!machine.draw(translationMatrix))
            console.log("Drawing error!");
    }
}


function ButtonObject(glContext) {
    // Local storage variables and "constants"
    var gl = glContext;
    var button;
    var buttonPosition = { x: 0, y: 0, z: 0 };
    var clicked = false;        // Current state

    var vertArray = [];
    var texCoordsArray = [];
    var textureArray = [];

    var textureCoords = [
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ];

    var buttonVertices = [
        vec3.fromValues(0.13, 0.08, 0.1),
        vec3.fromValues(-0.13, 0.08, 0.1),
        vec3.fromValues(0.13, -0.08, 0.1),
        vec3.fromValues(-0.13, -0.08, 0.1)
    ];

    this.create = function (textureArray, shaderProgram) {
        vertArray.push(buttonVertices);
        texCoordsArray.push(textureCoords);

        button = new webgl.object3d(gl);
        if (!button.initGeometry(vertArray, texCoordsArray))
            console.log("Drum error. Error initializing Geometry!");
        if (!button.assignTextures(textureArray))
            console.log("Drum error. Error assigning Textures!");
        button.assignShaderProgram(shaderProgram);
    }

    this.draw = function (movementMatrix) {
        var translation = vec3.fromValues(buttonPosition.x, buttonPosition.y, buttonPosition.z);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        if (!button.draw(translationMatrix))
            console.log("Drawing error!");
    }

    this.setPosition = function (position) {
        buttonPosition.x = position[0];
        buttonPosition.y = position[1];
        buttonPosition.z = position[2];
    }

    this.click = function () {
        if (!clicked) {
            buttonPosition.z -= 0.05;
            clicked = true;
            setTimeout(depressButton, 200);
        }
    }

    function depressButton() {
        buttonPosition.z += 0.05;
        clicked = false;
    }
}

function StartButtonObject(glContext) {
    // Local storage variables and "constants"
    var gl = glContext;
    var button;
    var buttonPosition = { x: 0, y: 0, z: 0 };
    var clicked = false;        // Current state

    var vertArray = []; // Array(machineFaceCount);
    var texCoordsArray = [];
    var textureArray = [];

    var textureCoords = [
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ];

    var buttonVertices = [
        vec3.fromValues(0.27, 0.17, 0.1),
        vec3.fromValues(-0.27, 0.17, 0.1),
        vec3.fromValues(0.27, -0.17, 0.1),
        vec3.fromValues(-0.27, -0.17, 0.1)
    ];

    this.create = function (textureArray, shaderProgram) {
        vertArray.push(buttonVertices);
        texCoordsArray.push(textureCoords);

        button = new webgl.object3d(gl);
        if (!button.initGeometry(vertArray, texCoordsArray))
            console.log("Drum error. Error initializing Geometry!");
        if (!button.assignTextures(textureArray))
            console.log("Drum error. Error assigning Textures!");
        button.assignShaderProgram(shaderProgram);
    }

    this.draw = function (movementMatrix) {
        var translation = vec3.fromValues(buttonPosition.x, buttonPosition.y, buttonPosition.z);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        if (!button.draw(translationMatrix))
            console.log("Drawing error!");
    }

    this.setPosition = function (position) {
        buttonPosition.x = position[0];
        buttonPosition.y = position[1];
        buttonPosition.z = position[2];
    }

    this.click = function (drums) {
        if (!clicked) {
            buttonPosition.z -= 0.05;
            clicked = true;

            for (var drum = 0; drum < drums.length; drum++) {
                drums[drum].spin();
            }

            setTimeout(depressButton, 200);
        }
    }

    function depressButton() {
        buttonPosition.z += 0.05;
        clicked = false;
    }
}

function LabelObject(glContext) {
    var gl = glContext;
    var label;
    var labelPosition = { x: 0, y: 0, z: 0 };

    var vertArray = []; // Array(machineFaceCount);
    var texCoordsArray = [];
    var textureArray = [];

    var textureCoords = [
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ];

    var labelVertices = [
        vec3.fromValues(0.27, 0.17, 0.1),
        vec3.fromValues(-0.27, 0.17, 0.1),
        vec3.fromValues(0.27, -0.17, 0.1),
        vec3.fromValues(-0.27, -0.17, 0.1)
    ];

    this.create = function (textureArray, shaderProgram) {
        vertArray.push(labelVertices);
        texCoordsArray.push(textureCoords);

        label = new webgl.object3d(gl);
        if (!label.initGeometry(vertArray, texCoordsArray))
            console.log("Drum error. Error initializing Geometry!");
        if (!label.assignTextures(textureArray))
            console.log("Drum error. Error assigning Textures!");
        label.assignShaderProgram(shaderProgram);
    }

    this.draw = function (movementMatrix) {
        var translation = vec3.fromValues(labelPosition.x, labelPosition.y, labelPosition.z);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        if (!label.draw(translationMatrix))
            console.log("Drawing error!");
    }

    this.setDimensions = function (dimensions) {
        var vertices = [];
        vertices.push(vec3.fromValues(dimensions[0] / 2, dimensions[1] / 2, 0.1));
        vertices.push(vec3.fromValues(-(dimensions[0] / 2), dimensions[1] / 2, 0.1));
        vertices.push(vec3.fromValues(dimensions[0] / 2, -(dimensions[1] / 2), 0.1));
        vertices.push(vec3.fromValues(-(dimensions[0] / 2), -(dimensions[1] / 2), 0.1));
        labelVertices = vertices;
    }

    this.setPosition = function (position) {
        labelPosition.x = position[0];
        labelPosition.y = position[1];
        labelPosition.z = position[2];
    }
}























var drumCount = 5;
var drums = [];
var machine;
var betButtonCount = 10;
var betButtons = [];
var startButton;
var stopButtons = [];
var labels = {};

var translation = vec3.create();
var rotation = vec3.create();
var gl;
var textureURLs = {
    grapes:     "img/grapes_512.jpg",
    bananas:    "img/banana_512.jpg",
    oranges:    "img/orange_512.jpg",
    cherries:   "img/cherry_512.jpg",
    bars:       "img/bars_512.jpg",
    bells:      "img/bells_512.jpg",
    sevens:     "img/seven_512.jpg",
    blanks:     "img/blank_512.jpg",
    digitZero:  "img/digits_0.jpg",
    digitOne:   "img/digits_1.jpg",
    digitTwo:   "img/digits_2.jpg",
    digitThree: "img/digits_3.jpg",
    digitFour:  "img/digits_4.jpg",
    digitFive:  "img/digits_5.jpg",
    digitSix:   "img/digits_6.jpg",
    digitSeven: "img/digits_7.jpg",
    digitEight: "img/digits_8.jpg",
    digitNine:  "img/digits_9.jpg",
    digitNine:  "img/digits_9.jpg",
    test:       "img/test_button_512.jpg"
};
var drumTextureNameList = ["grapes", "bananas", "oranges", "cherries", "bars", "bells", "sevens", "blanks"];
var digitsTextureNameList = ["digitZero", "digitOne", "digitTwo", "digitThree", "digitFour", "digitFive", "digitSix", "digitSeven", "digitEight", "digitNine"];
var allTexturesLoaded = false;


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

        shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
        shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
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

    function mvPushMatrix() {
        var copy = mat4.clone(mvMatrix);
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

    this.webGLStart = function() {
        var canvas = document.getElementById("webgl-canvas");
        initGL(canvas);
        initShaders();

        var loadedTextures = {};
        initTextures(loadedTextures);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        setTimeout(createObjects);

        function createObjects() {
            if (allTexturesLoaded) {
                var drumTextures = [];
                $.each(drumTextureNameList, function (index, textureName) {
                    drumTextures.push(loadedTextures[textureName]);
                });

                var offset = -2.1 * parseInt(drumCount / 2);
                if (drumCount % 2 == 0) {
                    offset += 2.1 / 2;
                }

                for (var drum = 0; drum < drumCount; drum++) {
                    drums.push(new DrumObject(gl));
                    drums[drum].create(drumTextures, shaderProgram);
                    drums[drum].setPosition([offset, 0.0, 0.0]);
                    offset += 2.1;
                }

                machine = new MachineObject(gl);
                machine.create([
                    loadedTextures.sevens,
                    loadedTextures.sevens,
                    loadedTextures.sevens,
                    loadedTextures.sevens
/*
                    loadedTextures.test,
                    loadedTextures.test,
                    loadedTextures.test,
                    loadedTextures.test,
                    loadedTextures.test,
                    loadedTextures.test,
                    loadedTextures.test,
                    loadedTextures.test,
                    loadedTextures.test,
                    loadedTextures.test
*/
                ], shaderProgram);
/*
                var button1Vertices = [
                    vec3.fromValues(-0.64, -0.4, 0.1),
                    vec3.fromValues(-1.0, -0.4, 0.1),
                    vec3.fromValues(-0.64, -0.66, 0.1),
                    vec3.fromValues(-1.0, -0.66, 0.1)
                ];
    var buttonVertices = [
        vec3.fromValues(0.18, 0.13, 0.1),
        vec3.fromValues(-0.18, 0.13, 0.1),
        vec3.fromValues(0.18, -0.13, 0.1),
        vec3.fromValues(-0.18, -0.13, 0.1)
    ];

        x: -0.82, y: -0.53
*/
                var buttonXOffset = -0.82
                var buttonYOffset = -0.69

                for (var i = 0; i < betButtonCount; i++) {
                    betButtons[i] = new ButtonObject(gl);
                    betButtons[i].create([loadedTextures.test], shaderProgram);
                    if ((i % 2) == 0) {
                        betButtons[i].setPosition([buttonXOffset + 0.27 * parseInt(i / 2), buttonYOffset, 0]);
                    } else {
                        betButtons[i].setPosition([buttonXOffset + 0.27 * parseInt(i / 2), buttonYOffset - 0.18, 0]);
                    }
                }
                startButton = new StartButtonObject(gl);
                startButton.create([loadedTextures.test], shaderProgram);
                startButton.setPosition([0.70, -0.78, 0]);

                buttonXOffset = -0.56;
                buttonYOffset = -0.45;

                for (var i = 0; i < drumCount; i++) {
                    stopButtons[i] = new ButtonObject(gl);
                    stopButtons[i].create([loadedTextures.test], shaderProgram);
                    stopButtons[i].setPosition([buttonXOffset + 0.28 * i, buttonYOffset, 0]);
                }

                labels["jackpot"] = new LabelObject(gl);
                labels["jackpot"].setDimensions([0.75, 0.15, 0]);
                labels["jackpot"].create([loadedTextures.test], shaderProgram);
                labels["jackpot"].setPosition([-0.6, 0.9, 0]);


                tick();
            } else {
                var loaded = true;
                $.each(loadedTextures, function (textureName, props) {
                    if (!props.loaded) {
                        loaded = false;
                    }
                });

                allTexturesLoaded = loaded;
                setTimeout(createObjects, 100);
            }
        }
    }

    function initTextures(loadedTextures) {
        $.each(textureURLs, function (textureName, URL) {
            loadedTextures[textureName] = loadTextures(URL);
        });
    }

    function loadTextures(url) {
        var texture = gl.createTexture();
        texture.image = new Image();

        texture.image.onload = function () {
            handleLoadedTexture(texture)
            texture.loaded = true;
        }

        texture.image.src = url;
        texture.url = url;
        return texture;
    }

    function handleLoadedTexture(texture) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        if (texture.image.height === texture.image.width) {
            gl.generateMipmap(gl.TEXTURE_2D);               // Generate mipmaps for scalable square textures, ignore non-square textures
        }
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    function tick() {
        requestAnimFrame(tick);
        drawScene();
    }

    function drawScene() {
        /* SET PERSPECTIVE AND TRANSLATION*/
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(pMatrix, (60 * Math.PI) / 180, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

        mat4.identity(mvMatrix);

        vec3.set(translation, 0.0, 0.0, -14.0);
        mat4.translate(mvMatrix, mvMatrix, translation);

        /*        DRAW DRUMS         */
        for (var drum = 0; drum < drumCount; drum++) {
            drums[drum].draw(mvMatrix);
        }

//        vec3.set(translation, 0.0, 0.0, 14.0);
//        mat4.translate(mvMatrix, mvMatrix, translation);
        mat4.identity(mvMatrix);
        machine.draw(mvMatrix);

        vec3.set(translation, 0.0, 0.0, -2.0);
        mat4.translate(mvMatrix, mvMatrix, translation);
        for (var i = 0; i < betButtons.length; i++) {
            betButtons[i].draw(mvMatrix);
        }
        startButton.draw(mvMatrix);

        for (var i = 0; i < stopButtons.length; i++) {
            stopButtons[i].draw(mvMatrix);
        }

        labels["jackpot"].draw(mvMatrix);
    }


/*
    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
            y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
        };
    }
    var canvas = document.getElementById('myCanvas');
    var context = canvas.getContext('2d');

    canvas.addEventListener('mousemove', function (evt) {
        var mousePos = getMousePos(canvas, evt);
        var message = 'Mouse position: ' + mousePos.x + ',' + mousePos.y;
        writeMessage(canvas, message);
    }, false);
*/

/*
    btn1: 409x699, 515x765
    btn2: 409x773, 515x839
    btn3: 521x699, 627x765
    btn4: 521x773, 627x839
*/


$(document).ready(function () {
    webGLStart();
    //    var wgl = new webgl.main();
    //    wgl.webGLStart();
    $("#webgl-canvas").click(function (e) {
        var rect = this.getBoundingClientRect();
        var mouse = {
            x: (e.clientX - rect.left) / (rect.right - rect.left) * this.width,
            y: (e.clientY - rect.top) / (rect.bottom - rect.top) * this.height
        };

        // startX = 409 + 106, + 112
        // startY = 699 + 66, + 74
        var startXOffset = 409;
        var startYOffset = 699;

        for (var i = 0; i < betButtons.length; i++) {
            if ((i % 2) === 0) {
                if (((mouse.x > startXOffset + 112 * parseInt(i / 2)) && (mouse.x < (startXOffset + 106) + 112 * parseInt(i / 2)))
                    && ((mouse.y > startYOffset) && (mouse.y < startYOffset + 66))) {
                    betButtons[i].click();
                }
            } else {
                if (((mouse.x > startXOffset + 112 * parseInt(i / 2)) && (mouse.x < (startXOffset + 106) + 112 * parseInt(i / 2)))
                    && ((mouse.y > startYOffset + 74) && (mouse.y < startYOffset + 140))) {
                    betButtons[i].click();
                }
            }
        }


        var startXOffset = 516;
        var startYOffset = 600;

        for (var i = 0; i < stopButtons.length; i++) {
            if (((mouse.x > startXOffset + 116 * i) && (mouse.x < (startXOffset + 106) + 116 * i))
                                && ((mouse.y > startYOffset) && (mouse.y < startYOffset + 66))) {
                stopButtons[i].click();
                drums[i].stop();
            }
        }

        if (((mouse.x > 976) && (mouse.x < 1197)) && ((mouse.y > 699) && (mouse.y < 839))) {
            startButton.click(drums);
        }

        // Stop1: 516x600, 622x666
        // Stop2: 632x600, 738x666

        // Start: 976x699, 1197x839
/*
        if (((mouse.x > 409) && (mouse.x < 515)) && ((mouse.y > 699) && (mouse.y < 765))) {
            betButtons[0].click();
        }
        if (((mouse.x > 409) && (mouse.x < 515)) && ((mouse.y > 773) && (mouse.y < 839))) {
            betButtons[1].click();
        }
        if (((mouse.x > 521) && (mouse.x < 627)) && ((mouse.y > 699) && (mouse.y < 765))) {
            betButtons[2].click();
        }
        if (((mouse.x > 521) && (mouse.x < 627)) && ((mouse.y > 773) && (mouse.y < 839))) {
            betButtons[3].click();
        }
*/

//        alert("X: " + mouse.x + "\nY: " + mouse.y);
    });
});

$("#start1").click(function () {
    drums[0].spin();
});

$("#start2").click(function () {
    drums[1].spin();
});

$("#start3").click(function () {
    drums[2].spin();
});

$("#start4").click(function () {
    drums[3].spin();
});

$("#start5").click(function () {
    drums[4].spin();
});

$("#stop1").click(function () {
    drums[0].stop();
});

$("#stop2").click(function () {
    drums[1].stop();
});

$("#stop3").click(function () {
    drums[2].stop();
});

$("#stop4").click(function () {
    drums[3].stop();
});

$("#stop5").click(function () {
    drums[4].stop();
});






