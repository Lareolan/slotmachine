if (!window.webgl) {
    window.webgl = {};
}

window.webgl.object3d = function (gl) {
    // These 2 variables will store all the information for this 3d object's vertices and texture mapping coordinates
    var objectVertexPositionBuffer;
    var objectVertexTextureCoordBuffer;

    // This variable will hold an array of textures to use on the object
    var textures;

    // This variable will hold the shader program internally for the object
    var shaderProgram;

    // These 2 Objects hold the information about animation. Both translation and rotation. The speeds are given in
    // units per second (i.e. 30 degree rotation per second)
    var animationRotate = { x: 0, y: 0, z: 0, xSpeed: 0, ySpeed: 0, zSpeed: 0 };
    var animationTranslate = { x: 0, y: 0, z: 0, xSpeed: 0, ySpeed: 0, zSpeed: 0 };

    var objectPosition = { x: 0, y: 0, z: 0 };

    // Stores the timestamp at the time when the last frame was animating.
    var lastFrameTime = 0;

    // A boolean flag indicating whether or not this object is static or animating at the moment
    var animating = false;

    /**
     * This method is called to initialize the 3D geometry.
     * @param vertices is an array of vertex arrays with 3 floating point values per vertex.
     * @param textureCoords is an array of texture coordinates arrays with 2 floating point values per associated vertex.
     */
    this.initGeometry = function (vertices, textureCoords) {
        // Error checking, if the number of items between vertices array and textureCoords array is different
        // then we have invalid input. Exit function and return false to indicate an error.
        if (vertices.length != textureCoords.length) {
            return false;
        }

        // If it doesn't exist, initialize the vertex buffer array
        if (objectVertexPositionBuffer === undefined) {
            objectVertexPositionBuffer = [];
        }

        // If it doesn't exist, initialize the texture coordinates buffer array
        if (objectVertexTextureCoordBuffer === undefined) {
            objectVertexTextureCoordBuffer = [];
        }

        // Loop through each element in the arrays
        for (var i = 0; i < vertices.length; i++) {
            // convert vec3 array into a flat array
            var vertexArray = vecArrayToFlatArray(vertices[i]);

            // Create and bind a vertex buffer
            objectVertexPositionBuffer[i] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, objectVertexPositionBuffer[i]);

            // Fill the new vertex buffer with data
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), gl.STATIC_DRAW);
            objectVertexPositionBuffer[i].itemSize = 3;
            objectVertexPositionBuffer[i].numItems = vertexArray.length / objectVertexPositionBuffer[i].itemSize;

            // Create and bind a texture coordinates buffer
            objectVertexTextureCoordBuffer[i] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, objectVertexTextureCoordBuffer[i]);

            // Fill the new texture coordinates buffer with data
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords[i]), gl.STATIC_DRAW);
            objectVertexTextureCoordBuffer[i].itemSize = 2;
            objectVertexTextureCoordBuffer[i].numItems = textureCoords[i].length / objectVertexTextureCoordBuffer[i].itemSize;

            // A bit of error checking, if the numItems parameters are different, then vertices/textureCoords parameters
            // had a non-matching number of elements and therefore were invalid. If that is the case, exit the function
            // and return false.
            if (objectVertexPositionBuffer[i].numItems != objectVertexTextureCoordBuffer[i].numItems) {
                return false;
            }
        }
        // If we got to the end, then we had no logic errors so return true to indicate the function ran without errors.
        // (there may still be geometry, texturing, or webgl buffering errors that cannot be caught here).
        return true;
    }

    /**
     * This function assigns textures to the various geometry sections of this 3d object
     */
    this.assignTextures = function (textureArray) {
        // First a bit of error checking. If textureArray is not an array, then we have an invalid parameter.
        // Also if objectVertexPositionBuffer and objectVertexTextureCoordBuffer is not initializes, that
        // is assignTextures() was called before initGeometry(), then that is a problem as well since
        // geometry should be initialized first.
        // Lastly if the number of elements in textureArray is different from the number of elements in
        // objectVertexPositionBuffer, then it's also a problem indicating the textureArray parameter has invalid data.
        // In all these cases just exit the function and return false.
        // (There is no reason to ALSO check objectVertexTextureCoordBuffer.length since if these buffers were initialized
        // then initGeometry() should have already ensured the number of elements was the same).
        if (!$.isArray(textureArray) || (objectVertexPositionBuffer === undefined)
            || (objectVertexTextureCoordBuffer === undefined)
            || (textureArray.length != objectVertexPositionBuffer.length)) {
            return false;
        }

        // If no errors detected, then just clone the textureArray parameter into internal textures variable and return true.
        textures = textureArray.slice();
        return true;
    }

    /**
     * This function just makes a local clone of the shader program, to allow each object to have its own if needed
     */
    this.assignShaderProgram = function (shader) {
        shaderProgram = $.extend(true, {}, shader);
    }

    /**
     * The draw() function does as its name suggests, draws this object on the canvas using the previously defined
     * shader program, object vertex and texture coordinates buffers, and textures array.
     */
    this.draw = function (movementMatrix) {
        // First a little error checking. Ensure that all the necessary objects have been initialized, if they haven't
        // then exit function and return false.
        if ((shaderProgram === undefined) || (objectVertexPositionBuffer === undefined)
            || (objectVertexTextureCoordBuffer === undefined) || (textures === undefined)) {
            return false;
        }

        animate();

        var rotation = vec3.create();
        var translation = vec3.create();
        var objMvMatrix = mat4.create();
        mat4.identity(objMvMatrix);

//        var drumRadius = 2.41;

        for (var i = 0; i < objectVertexPositionBuffer.length; i++) {
            mat4.identity(objMvMatrix);
            if (movementMatrix !== undefined) {
                mat4.multiply(objMvMatrix, objMvMatrix, movementMatrix);
            }

//            vec3.set(translation, 0, 0, (-drumRadius));
            vec3.set(translation, objectPosition.x, objectPosition.y, objectPosition.z);
            mat4.translate(objMvMatrix, objMvMatrix, translation);

            vec3.set(translation, animationTranslate.x, animationTranslate.y, animationTranslate.z);
            mat4.translate(objMvMatrix, objMvMatrix, translation);

            vec3.set(rotation, 1, 0, 0);
            mat4.rotate(objMvMatrix, objMvMatrix, degToRad(animationRotate.x), rotation);
            vec3.set(rotation, 0, 1, 0);
            mat4.rotate(objMvMatrix, objMvMatrix, degToRad(animationRotate.y), rotation);
            vec3.set(rotation, 0, 0, 1);
            mat4.rotate(objMvMatrix, objMvMatrix, degToRad(animationRotate.z), rotation);

//            vec3.set(translation, 0.0, 0.0, drumRadius);
            vec3.set(translation, -objectPosition.x, -objectPosition.y, -objectPosition.z);
            mat4.translate(objMvMatrix, objMvMatrix, translation);

            gl.bindBuffer(gl.ARRAY_BUFFER, objectVertexPositionBuffer[i]);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, objectVertexPositionBuffer[i].itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, objectVertexTextureCoordBuffer[i]);
            gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, objectVertexTextureCoordBuffer[i].itemSize, gl.FLOAT, false, 0, 0);

//            gl.activeTexture(gl.TEXTURE0 + i);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textures[i]);
            gl.uniform1i(shaderProgram.samplerUniform, 0);

//            setMatrixUniforms();
            gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
            gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, objMvMatrix);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, objectVertexPositionBuffer[i].numItems);
        }
        return true;
    }

    /**
     * This internal function calculates the new rotation and translation values for animating this 3d object
     */
    function animate() {
        if (animating) {
            var currentFrameTime = new Date().getTime();
            if (lastFrameTime != 0) {
                var elapsed = currentFrameTime - lastFrameTime;

                // Adjust the rotation angle values
                animationRotate.x += (animationRotate.xSpeed * elapsed) / 1000.0;
                animationRotate.y += (animationRotate.ySpeed * elapsed) / 1000.0;
                animationRotate.z += (animationRotate.zSpeed * elapsed) / 1000.0;

                // Just a little house cleaning to keep all the values to manageable size.
                if (animationRotate.x > 360) {
                    animationRotate.x %= 360;
                }
                if (animationRotate.x < -360) {
                    animationRotate.x %= 360;
                }
                if (animationRotate.y > 360) {
                    animationRotate.y %= 360;
                }
                if (animationRotate.y < -360) {
                    animationRotate.y %= 360;
                }
                if (animationRotate.z > 360) {
                    animationRotate.z %= 360;
                }
                if (animationRotate.z < -360) {
                    animationRotate.z %= 360;
                }

                // Adjust the translation values
                animationTranslate.x += (animationTranslate.xSpeed * elapsed) / 1000.0;
                animationTranslate.y += (animationTranslate.ySpeed * elapsed) / 1000.0;
                animationTranslate.z += (animationTranslate.zSpeed * elapsed) / 1000.0;
            }
            lastFrameTime = currentFrameTime;
        }
    }

    /**
     * This function can be called to initiate animation movement or rotation of the object
     */
    this.startAnimation = function () {
        animating = true;
        lastFrameTime = new Date().getTime();
    }

    /**
     * Stops animation (movement or rotation) of the object
     */
    this.stopAnimation = function () {
        animating = false;
        lastFrameTime = 0;
    }

    /**
     * Sets the rotation angles of the object
     * @param rotation is an array with 3 elements providing the x, y and z axis rotation
     */
    this.setRotation = function (rotation) {
        animationRotate.x = rotation[0];
        animationRotate.y = rotation[1];
        animationRotate.z = rotation[2];
    }

    /**
     * Returns the rotation angles of the object
     * @returns An array with 3 elements providing the x, y and z axis rotation
     */
    this.getRotation = function () {
        return new Array(animationRotate.x, animationRotate.y, animationRotate.z);
    }

    /**
     * Sets the rotation speed of the object (only used if object is being animated)
     * @param rotationSpeed is an array with 3 elements providing the rotation speed in degrees per second
     * along x, y and z axis respectively.
     */
    this.setRotationSpeed = function (rotationSpeed) {
        animationRotate.xSpeed = rotationSpeed[0];
        animationRotate.ySpeed = rotationSpeed[1];
        animationRotate.zSpeed = rotationSpeed[2];
    }

    /**
     * Returns the rotation speed of the object
     * @returns An array with 3 elements providing the x, y and z axis speeds of rotation
     */
    this.getRotationSpeed = function () {
        return new Array(animationRotate.xSpeed, animationRotate.ySpeed, animationRotate.zSpeed);
    }

    /**
     * Sets the translation angles of the object
     * @param translation is an array with 3 elements providing the x, y and z axis rotation
     */
    this.setTranslation = function (translation) {
        animationTranslate.x = translation[0];
        animationTranslate.y = translation[1];
        animationTranslate.z = translation[2];
    }

    /**
     * Returns the translation vector of the object
     * @returns An array with 3 elements providing the x, y and z translation vector
     */
    this.getTranslation = function () {
        return new Array(animationTranslate.x, animationTranslate.y, animationTranslate.z);
    }

    /**
     * Sets the translation speed of the object (only used if object is being animated)
     * @param translationSpeed is an array with 3 elements providing the translation speed vector in screen units
     * along x, y and z axis respectively.
     */
    this.setTranslationSpeed = function (translationSpeed) {
        animationTranslate.xSpeed = translationSpeed[0];
        animationTranslate.ySpeed = translationSpeed[1];
        animationTranslate.zSpeed = translationSpeed[2];
    }

    this.setPosition = function (position) {
        objectPosition.x = position[0];
        objectPosition.y = position[1];
        objectPosition.z = position[2];
    }

    this.getPosition = function () {
        return new Array(objectPosition.x, objectPosition.y, objectPosition.z);
    }

    /**
     * This is an internal utility function to convert an object from an array of type vec2, vec3, or vec4 to a 
     * flat 1-dimensional array.
     * @param arr The vecArray to convert
     * @returns The flattened 1-d array
     */
    function vecArrayToFlatArray(arr) {
        var result = [];
        for (var i = 0; i < arr.length; i++) {
            for(var j = 0; j < arr[i].length; j++) {
                result.push(arr[i][j]);
            }
        }
        
        return result;
    }

    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }
};