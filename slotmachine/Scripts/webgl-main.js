function DrumObject(glContext) {
    // Local storage variables and "constants"
    var drum;
    var gl = glContext;
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
    var drum;
    var gl = glContext;
    var machineFaceCount = 4;

    var vertArray = Array(machineFaceCount);
    var texCoordsArray = [];
    var textureArray = [];
    
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

    this.create = function (textureArray, shaderProgram) {
    }
}




























var drumCount = 5;
var drums = [];
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
    digitNine:  "img/digits_9.jpg"
};
var drumTextureNameList = ["grapes", "bananas", "oranges", "cherries", "bars", "bells", "sevens", "blanks"];
var digitsNameList = ["digitZero", "digitOne", "digitTwo", "digitThree", "digitFour", "digitFive", "digitSix", "digitSeven", "digitEight", "digitNine"];
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

        vec3.set(translation, 0.0, 0.0, -10.0);
        mat4.translate(mvMatrix, mvMatrix, translation);

        /*        DRAW DRUMS         */
        for (var drum = 0; drum < drumCount; drum++) {
            drums[drum].draw(mvMatrix);
        }
    }




$(document).ready(function () {
    webGLStart();
//    var wgl = new webgl.main();
//    wgl.webGLStart();
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






