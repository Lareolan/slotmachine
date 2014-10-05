    var objectVertexPositionBuffer;
    var objectVertexTextureCoordBuffer;
    var gl;
    var lastTime = 0;
    var xRot = 0;
    var yRot = 0;
    var zRot = 0;

    //var angleDelta = 22.5;
    //var drumRadius = 2 / Math.tan(degToRad(angleDelta));
    var angleDelta = 45;
    var drumRadius = 2.41 / Math.tan(degToRad(angleDelta));
    var drumTileCount = 360 / angleDelta;


    var textureURLs = {
        grapes: "../img/grapes_512.jpg",
        bananas: "../img/banana_512.jpg",
        oranges: "../img/orange_512.jpg",
        cherries: "../img/cherry_512.jpg",
        bars: "../img/bars_512.jpg",
        bells: "../img/bells_512.jpg",
        sevens: "../img/seven_512.jpg",
        blanks: "../img/blank_512.jpg"
    };

    var textureNameList = ["grapes", "bananas", "oranges", "cherries", "bars", "bells", "sevens", "blanks"];



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

    this.webGLStart = function() {
        var canvas = document.getElementById("webgl-canvas");
        initGL(canvas);
        initShaders();
        //    initTextures();
        initBuffers();

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);

        //    while (!neheTexture.loaded);
        //    alert(neheTexture.loaded);



        //    var translation = vec3.create();

        //    alert("X: " + translation[0] + "\nY: " + translation[1] + "\nZ: " + translation[2] + "\n" + translation.length);
        /*
            var vertices = [
                 1.0, 1.0, 0.0,
                -1.0, 1.0, 0.0,
                 1.0, -1.0, 0.0,
                -1.0, -1.0, 0.0
            ];
        */
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

        var vertArray = Array(drumTileCount);
        var texCoordsArray = [];
        var textureArray = [];

        initTextures(textureArray);


        var transformationMatrix = mat4.create();
        var newXYZ = vec3.create();
        var rotation = vec3.create();
        var translation = vec3.create();

        for (var i = 0; i < drumTileCount; i++) {
            vertArray[i] = [];
            //        texCoordsArray[i] = [];

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
            //        textureArray.push(neheTexture);
        }

        setTimeout(drawObject);

        var drums = new Array(3);

        for (var i = 0; i < drums.length; i++) {
            drums[i] = new webgl.object3d(gl);
        }

//        var Obj3d = new webgl.object3d(gl);
        var initXSpeed = 180;

        var time = new Date().getTime();
        var animStopping = false;
        var selectedItem;
        var deceleration;
        var lastFrameTime;

        function drawObject() {
            if (textureArray.loaded) {
                //            if (!Obj3d.initGeometry([vertices], [textureCoords]))
                //            if (!Obj3d.assignTextures([neheTexture]))
/*
                if (!Obj3d.initGeometry(vertArray, texCoordsArray))
                    alert("initGeometry() failed!")
                if (!Obj3d.assignTextures(textureArray))
                    alert("assignTextures() failed!")
                Obj3d.assignShaderProgram(shaderProgram);
*/                
                for (var drum = 0; drum < drums.length; drum++) {
                    if (!drums[drum].initGeometry(vertArray, texCoordsArray))
                        console.log("Drum " + drum + " error initializing Geometry!");
                    if (!drums[drum].assignTextures(textureArray))
                        console.log("Drum " + drum + " error assigning Textures!");
                    drums[drum].assignShaderProgram(shaderProgram);
                }



                gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                mat4.perspective(pMatrix, 45.0, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

                mat4.identity(mvMatrix);

//                vec3.set(translation, 0.0, 0.0, -8.0);
//                mat4.translate(mvMatrix, mvMatrix, translation);

                vec3.set(rotation, 0, 1, 0);
                mat4.rotate(mvMatrix, mvMatrix, degToRad(30), rotation);

                for (var drum = 0; drum < drums.length; drum++) {
                    Obj3d = drums[drum];
                    if (drum == 0)
                        drums[drum].setTranslation([-2.2, 0, 0]);
                    if (drum == 2)
                        drums[drum].setTranslation([2.2, 0, 0]);

                    if (!drums[drum].draw())
                        console.log("Drum " + drum + " error attempting to draw()!");
                    var initAngle = Math.round(Math.random() * 8) * angleDelta;
                    console.log("Drum #" + drum + " Starts at: " + initAngle);

                    drums[drum].setRotation([initAngle, 0, 0]);
                    drums[drum].setRotationSpeed([initXSpeed, 0, 0]);
                    drums[drum].startAnimation();

/*
                    if (!Obj3d.draw())
                        console.log("Drum " + drum + " error attempting to draw()!");
//                    alert("draw() failed!");
                    Obj3d.setRotation([30, 0, 0]);
                    Obj3d.setRotationSpeed([initXSpeed, 0, 0]);
                    Obj3d.startAnimation();
*/
                    objTick();
                }
            } else {
                var loaded = true;
                for (var i = 0; i < textureArray.length; i++) {
                    if (!textureArray[i].loaded) {
                        loaded = false;
                    }
                }
                textureArray.loaded = loaded;
                setTimeout(drawObject, 100);
            }
        }

        var selectedItem;

        function objTick() {
            requestAnimFrame(objTick);

            for (var drum = 0; drum < drums.length; drum++) {
                drums[drum].draw();

                if ((new Date().getTime() - time > 5000) && (!animStopping)) {
                    animStopping = true;
                    selectedItem = Math.round(drums[drum].getRotation()[0] / angleDelta);
                    lastFrameTime = new Date().getTime();
                    initXSpeed = initXSpeed / 2;

                    deceleration = 360 / 4;
                    console.log("Selected: " + selectedItem);
                }
                if (animStopping) {
                    var currentFrameTime = new Date().getTime();
                    var elapsed = currentFrameTime - lastFrameTime;

                    if (initXSpeed > 0) {
                        if ((elapsed > 1000) && (initXSpeed > 30)) {
                            initXSpeed = initXSpeed / 2;
                            drums[drum].setRotationSpeed([initXSpeed, 0, 0]);
                            lastFrameTime = currentFrameTime;
                        } else {
                            if (initXSpeed <= 30) {
                                var currentItem = drums[drum].getRotation()[0];
                                if ((currentItem >= selectedItem * angleDelta) && (currentItem <= selectedItem * angleDelta + 10)) {
                                    initXSpeed = 0;
                                }
                            }
                        }
                    } else {
                        drums[drum].stopAnimation();
                        drums[drum].setRotation([selectedItem * angleDelta, 0, 0]);
                    }
                }
            }
/*
            Obj3d.draw();
            if ((new Date().getTime() - time > 3000) && (!animStopping)) {
                animStopping = true;
                selectedItem = Math.round(Obj3d.getRotation()[0] / angleDelta);
                lastFrameTime = new Date().getTime();
                initXSpeed = initXSpeed / 2;

                deceleration = 360 / 4;
                console.log("Selected: " + selectedItem);
            }
            if (animStopping) {
                var currentFrameTime = new Date().getTime();
                var elapsed = currentFrameTime - lastFrameTime;

                if (initXSpeed > 0) {
                    if ((elapsed > 1000) && (initXSpeed > 30)) {
                        initXSpeed = initXSpeed / 2;
                        Obj3d.setRotationSpeed([initXSpeed, 0, 0]);
                        lastFrameTime = currentFrameTime;
                    } else {
                        if (initXSpeed <= 30) {
                            var currentItem = Obj3d.getRotation()[0];
                            if ((currentItem >= selectedItem * angleDelta) && (currentItem <= selectedItem * angleDelta + 10)) {
                                initXSpeed = 0;
                            }
                        }
                    }
                } else {
                    Obj3d.stopAnimation();
                    Obj3d.setRotation([selectedItem * angleDelta, 0, 0]);
                }
            }
*/
        }
        // a = v/t = 180/2 = 90/sec^2
        // v = d/t = 180/sec
        // at = d/t
        // d = at^2
        // a = d/t^2


        //    tick();
    }

    function initBuffers() {
        // SQUARE
        objectVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, objectVertexPositionBuffer);
        vertices = [
             1.0, 1.0, 0.0,
            -1.0, 1.0, 0.0,
             1.0, -1.0, 0.0,
            -1.0, -1.0, 0.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        objectVertexPositionBuffer.itemSize = 3;
        objectVertexPositionBuffer.numItems = 4;

        objectVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, objectVertexTextureCoordBuffer);
        var textureCoords = [
          1.0, 1.0,
          0.0, 1.0,
          1.0, 0.0,
          0.0, 0.0
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        objectVertexTextureCoordBuffer.itemSize = 2;
        objectVertexTextureCoordBuffer.numItems = 4;
        /*
            objectVertexColorBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, objectVertexColorBuffer);
            colors = []
            for (var i = 0; i < 4; i++) {
                colors = colors.concat([0.5, 0.5, 1.0, 1.0]);
            }
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
            objectVertexColorBuffer.itemSize = 4;
            objectVertexColorBuffer.numItems = 4;
        */
    }

    var neheTexture;

    function initTextures(texArray) {
        /*
            neheTexture = gl.createTexture();
            neheTexture.image = new Image();
        
            neheTexture.image.onload = function () {
                handleLoadedTexture(neheTexture)
                neheTexture.loaded = true;
        //        callback.call(this);
            }
        
            neheTexture.image.src = "../img/cherry_640.png";
        */
        for (var i = 0; i < textureNameList.length; i++) {
            texArray[i] = loadTextures(textureURLs[textureNameList[i]]);
        }
    }

    function loadTextures(url) {
        var texture = gl.createTexture();
        texture.image = new Image();

        texture.image.onload = function () {
            handleLoadedTexture(texture)
            texture.loaded = true;
            //        callback.call(this);
        }

        texture.image.src = url;
        texture.url = url;
        return texture;
    }

    function handleLoadedTexture(texture) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
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

        var translation = vec3.fromValues(0.0, 0.0, -5.0);
        var rotation = vec3.fromValues(0, 1, 0);

        // draw the square
        //    vec3.set(translation, 3.0, 0.0, 0.0);
        //    mat4.translate(mvMatrix, mvMatrix, translation);

        //    vec3.set(translation, 0.0, 0.0, -5.0);
        mat4.translate(mvMatrix, mvMatrix, translation);


        vec3.set(rotation, 0, 1, 0);
        mat4.rotate(mvMatrix, mvMatrix, degToRad(30), rotation);


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

        gl.bindBuffer(gl.ARRAY_BUFFER, objectVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, objectVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, objectVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, objectVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, neheTexture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, objectVertexPositionBuffer.numItems);



        for (var i = 1; i < drumTileCount; i++) {
            // 2nd square
            mvPushMatrix();

            vec3.set(translation, 0.0, 0.0, -drumRadius);
            mat4.translate(mvMatrix, mvMatrix, translation);

            vec3.set(rotation, 1, 0, 0);
            mat4.rotate(mvMatrix, mvMatrix, degToRad(i * angleDelta), rotation);

            vec3.set(translation, 0.0, 0.0, drumRadius);
            mat4.translate(mvMatrix, mvMatrix, translation);

            setMatrixUniforms();
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, objectVertexPositionBuffer.numItems);
            mvPopMatrix();
        }

        mvPopMatrix();
    }

    function animate() {
        var timeNow = new Date().getTime();
        if (lastTime != 0) {
            var elapsed = timeNow - lastTime;

            xRot += (30 * elapsed) / 1000.0;
            yRot += (60 * elapsed) / 1000.0;
            zRot += (30 * elapsed) / 1000.0;
        }
        lastTime = timeNow;
    }


$(document).ready(function () {
    webGLStart();
//    var wgl = new webgl.main();
//    wgl.webGLStart();
});








