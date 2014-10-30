/**
 * This file contains the primary graphics and game logic components
 * Author:              Konstantin Koton
 * Filename:            webgl-main.js
 * Last Modified By:    Konstantin Koton
 * Date Last Modified:  Oct. 15, 2014
 * Revision History:    Too numerous to mention
 */

window.WebGL = function () {
    var _textures = {};
    var _sounds = {};

    this.getTextures = function () {
        return _textures;
    };

    this.setTextures = function (textures) {
        _textures = textures;
    };

    /**
     * This function is a handler that is called after an image finishes loading, in order to convert the image into a WebGL texture.
     * @param texture The texture object containing the image
     */
    this.handleLoadedTexture = function (texture) {
        // Turn the texture parameter into a WebGL texture object
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Flip the image pixels on Y-axis to convert from pixel space to texture space
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        // Load the image into the texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);

        // Specify magnification extrapolation to be linear
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Specify shrinking extrapolation to use linear mipmap extrapolation
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

        // Generate mipmaps for scalable square textures, ignore non-square textures
        gl.generateMipmap(gl.TEXTURE_2D);

        // Reset the current WebGL texture
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
};


/**
 * This Object creates and handles the drums (or reels) for the game.
 */
function DrumObject(glContext) {
    // Local storage variables and "constants"
    var gl = glContext;
    var drum;
    var drumTileCount = 8;
    var angleDelta = 360 / drumTileCount;
    var drumRadius = 2.41 / Math.tan(degToRad(angleDelta));
//    var drumRadius = 3.5 / Math.tan(degToRad(angleDelta));
    var drumPosition = { x: 0, y: 0, z: 0 };

    // Object containers
    var vertArray = Array(drumTileCount);
    var texCoordsArray = [];
    var textureArray = [];

    // These variables are used for smooth stopping animation
    var stopping = false;
    var spinning = false;
    var result;
    var currentItem;

    // Basic texture coordinates
    var textureCoords = [
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ];

    // Simple vertex values describing a square
    var vertices = [
        vec3.fromValues(1.0, 1.0, 0.0),
        vec3.fromValues(-1.0, 1.0, 0.0),
        vec3.fromValues(1.0, -1.0, 0.0),
        vec3.fromValues(-1.0, -1.0, 0.0)
    ];

    /**
     * This method creates the object's geometry and texture assignment.
     * @param textureArray An array of textures, 1 texture per face of the drum/reel
     * @param shaderProgram The reference to the Shader Program Object to be used for rendering this object.
     */
    this.create = function (textureArray, shaderProgram) {
        var transformationMatrix = mat4.create();
        var translation = vec3.create();
        var rotation = vec3.create();
        var newXYZ = vec3.create();

        // For each face on the drum/reel, create a rectangle and rotate it around center of object to create a drum/reel.
        for (var i = 0; i < drumTileCount; i++) {
            vertArray[i] = [];

            // In order to rotate the object around center, we have to translate the frame of reference from last face to center, rotate, then translate back to edge.
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

        // Call the methods to create the 3d object
        drum = new WebGL.object3d(gl);
        if (!drum.initGeometry(vertArray, texCoordsArray))
            console.log("Drum error. Error initializing Geometry!");
        if (!drum.assignTextures(textureArray))
            console.log("Drum error. Error assigning Textures!");
        drum.assignShaderProgram(shaderProgram);
    };

    /**
     * This method is used to render the object onto the canvas
     * @param movementMatrix The 4x4 matrix describing the offset from origin for this object
     */
    this.draw = function (movementMatrix) {
        // Reset the center of drawing to be at the center of the object (so it would rotate around central axis),
        // and also offset the object to where we want it on screen based on the movementMatrix parameter.
        drum.setPosition([0, 0, -drumRadius]);
        var translation = vec3.fromValues(drumPosition.x, drumPosition.y, drumPosition.z);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        // Draw the object
        if (!drum.draw(translationMatrix))
            console.log("Drum Drawing error!");

        // If the object is in the process of animating a "stop" command
        if (stopping) {
            // Get the rotation speed around the X-axis. If the speed is 0 or lower, then force animation to stop and reset the stopping and spinning flags
            var rotationSpeed = drum.getRotationSpeed()[0];
            if (rotationSpeed <= 0) {
                drum.stopAnimation();
                stopping = false;
                spinning = false;
            } else {
                // Otherwise get the current displayed image, if it's the right image, then set rotation speed around X-axis to 30 until it is facing the user head-on
                // to create the illusion of the last image "falling" into place.
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
    };

    /**
     * This method sets the relative position of the object
     * @param position An array indicating the relative x, y and z-axis position of this object
     */
    this.setPosition = function (position) {
        drumPosition.x = position[0];
        drumPosition.y = position[1];
        drumPosition.z = position[2];
    };

    /**
     * This function initiates the spin of the drum
     */
    this.spin = function () {
        // If it's not already spinning (or stopping), set the rotation speed around x-axis to 720 degrees/second,
        // assign it a random initial facing and initiate the animation sequence. Also reset the current result.
        if (!spinning) {
            drum.setRotationSpeed([720, 0, 0]);
            drum.setRotation([Math.random() * 8 * angleDelta, 0, 0]);
            drum.startAnimation();
            spinning = true;
            result = undefined;
        }
    };

    /**
     * This function initiates the stopping of the drum
     */
    this.stop = function () {
        // If the drum is spinning and not already in the proccess of stopping, then set stopping flag. Get the expected result from the utility function
        // defined in main.js. Then to create the illusion the user has any say on when the drum really stops, set the current drum face 3 tiles away from
        // the selected tile and slow the spin down.
        if ((spinning) && (!stopping)) {
            stopping = true;
            result = window.getSpinResult();

            currentItem = ((result - 3) < 0) ? (result - 3) + 8 : (result - 3);
            drum.setRotation([currentItem * angleDelta, 0, 0]);
            drum.setRotationSpeed([drum.getRotationSpeed()[0] / 4, 0, 0]);
        }
    };

    /**
     * This method returns the front-facing tile of this drum if the drum is stopped
     * @returns The front-facing tile of this drum if the drum is stopped, otherwise returns null
     */
    this.getResult = function () {
        if (!spinning) {
            return result;
        } else {
            return null;
        }
    };

    /**
     * Returns the flag idicating whether or not this drum is currently spinning
     * @returns The flag idicating whether or not this drum is currently spinning
     */
    this.isSpinning = function () {
        return spinning;
    };

    /**
     * This function resets the drum's rotation speed and flags, and sets the facing to the one provided by the parameter or a random one if parameter is not provided
     * @param face The facing to set this drum's facing to
     */
    this.reset = function (face) {
        if (face === undefined) {
            face = parseInt(Math.random() * 8);
        }
        drum.setRotation([face * angleDelta, 0, 0]);
        drum.setRotationSpeed([0, 0, 0]);
        spinning = false;
        stopping = false;
    };
}

/**
 * This Object creates and handles the "machine" background frame for the game.
 */
function MachineObject(glContext) {
    // Local storage variables and "constants"
    var gl = glContext;
    var machine;
    var machineFaceCount = 4;

    // Arrays that hold Object details
    var vertArray = [];
    var texCoordsArray = [];
    var textureArray = [];
    
    // Basic texture coordinates
    var textureCoords = [
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ];

    // Simple vertex values describing rectangles of varrying shapes and at varying positions
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

    /**
     * This method creates the object's geometry and texture assignment.
     * @param textureArray An array of textures, 1 texture per rectangle.
     * @param shaderProgram The reference to the Shader Program Object to be used for rendering this object.
     */
    this.create = function (textureArray, shaderProgram) {
        // Create an array of vertices
        vertArray.push(topVertices);
        vertArray.push(bottomVertices);
        vertArray.push(leftVertices);
        vertArray.push(rightVertices);

        // Assign the same texture coordinates for each rectangle
        for (var i = 0; i < machineFaceCount; i++) {
            texCoordsArray.push(textureCoords);
        }

        // And then create the actual 3d object
        machine = new WebGL.object3d(gl);
        if (!machine.initGeometry(vertArray, texCoordsArray))
            console.log("Machine error. Error initializing Geometry!");
        if (!machine.assignTextures(textureArray))
            console.log("Machine error. Error assigning Textures!");
        machine.assignShaderProgram(shaderProgram);
    };

    /**
     * This method is used to render the object onto the canvas
     * @param movementMatrix The 4x4 matrix describing the offset from origin for this object
     */
    this.draw = function (movementMatrix) {
        // Translate the object 2 units deeper into the screen, and add that translation to the one provided as parameter
        var translation = vec3.fromValues(0, 0, -2);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        // Draw the object
        if (!machine.draw(translationMatrix))
            console.log("Machine Drawing error!");
    };
}

/**
 * This Object creates and handles the generic button for the game.
 */
function ButtonObject(glContext) {
    // Local storage variables and "constants"
    var gl = glContext;
    var button;
    var buttonPosition = { x: 0, y: 0, z: 0 };
    var active = true;          // Current state
    var clicked = false;        // Current state
    var buttonValue = 0;

    // Arrays that hold Object details
    var vertArray = [];
    var texCoordsArray = [];
    var textureArray = [];
    var buttonTextures = [];

    // Basic texture coordinates
    var textureCoords = [
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ];

    // Simple vertex values describing a rectangle
    var buttonVertices = [
        vec3.fromValues(0.13, 0.08, 0.1),
        vec3.fromValues(-0.13, 0.08, 0.1),
        vec3.fromValues(0.13, -0.08, 0.1),
        vec3.fromValues(-0.13, -0.08, 0.1)
    ];

    /**
     * This method creates the object's geometry and texture assignment.
     * @param textureArray An array of textures, an active texture and an inactive texture for the button.
     * @param shaderProgram The reference to the Shader Program Object to be used for rendering this object.
     */
    this.create = function (textureArray, shaderProgram) {
        // Create a copy of the textures
        buttonTextures = textureArray.slice();
        var currentTexturesArray = [];

        // Create the geometry, texture coordinates and texture arrays and assign the first (active) texture to it by default
        vertArray.push(buttonVertices);
        texCoordsArray.push(textureCoords);
        currentTexturesArray.push(textureArray[0]);

        // Finally create the actual 3d object
        button = new WebGL.object3d(gl);
        if (!button.initGeometry(vertArray, texCoordsArray))
            console.log("Button error. Error initializing Geometry!");
        if (!button.assignTextures(currentTexturesArray))
            console.log("Button error. Error assigning Textures!");
        button.assignShaderProgram(shaderProgram);
    };

    /**
     * This method is used to render the object onto the canvas
     * @param movementMatrix The 4x4 matrix describing the offset from origin for this object
     */
    this.draw = function (movementMatrix) {
        // Translate the object's frame of reference by the one passed as parameter and the x, y and z offset of the object's relative position
        var translation = vec3.fromValues(buttonPosition.x, buttonPosition.y, buttonPosition.z);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        // Draw the object
        if (!button.draw(translationMatrix))
            console.log("Button Drawing error!");
    };

    /**
     * This method sets the relative position of the object
     * @param position An array indicating the relative x, y and z-axis position of this object
     */
    this.setPosition = function (position) {
        buttonPosition.x = position[0];
        buttonPosition.y = position[1];
        buttonPosition.z = position[2];
    };

    /**
     * This function is a click handler for the button object
     */
    this.click = function () {
        // If the button is active (clickable) and not already clicked (to prevent super rapid clicking)
        if ((!clicked) && (active)) {
            // Offset the button into the screen a little bit, and set the clicked flag
            buttonPosition.z -= 0.05;
            clicked = true;

            // Increase or reduce player bet (used if this is a betting button)
            if ((window.numberValues.playerBet + buttonValue) >= 0) {
                // Make sure the bet does not exceed the total amount of money the player has
                if ((window.numberValues.playerBet + buttonValue) <= window.numberValues.playerMoney) {
                    window.numberValues.playerBet += buttonValue;
                }
            } else {
                // Ensure the player cannot make a sub-zero bet
                window.numberValues.playerBet = 0;
            }

            // Reset the button's z-axis position after 0.1 seconds, so it can be clicked again
            setTimeout(depressButton, 100);
        }
    };

    /**
     * This function simply restores the button's z-axis position and resets clicked flag to false
     */
    function depressButton() {
        if (clicked) {
            buttonPosition.z += 0.05;
            clicked = false;
        }
    }

    /**
     * This function sets how much this button should add (or subtract) to the bet (only useful for betting buttons)
     * @param value The value to add to the player bet. Negative values will be subtracted from the bet.
     */
    this.setValue = function (value) {
        buttonValue = value;
    };

    /**
     * This function activates (or de-activates) the button, and changes the textures appropriately
     * @param state A boolean value. True (or blank) to activate the button, false to de-activate the button
     */
    this.activate = function (state) {
        if ((state === undefined) || (state)) {
            if (!button.assignTextures([buttonTextures[0]])) {
                console.log("Button error. Error re-assigning new Textures!");
            } else {
                active = true;
            }
        } else {
            if (!button.assignTextures([buttonTextures[1]])) {
                console.log("Button error. Error re-assigning new Textures!");
            } else {
                active = false;
            }
        }
    };

    /**
     * This function returns whether or not the button is active
     * @returns The active status of the button
     */
    this.isActive = function () {
        return active;
    };
}

/**
 * This Object creates and handles the "Start" button for the game.
 */
function StartButtonObject(glContext) {
    // Local storage variables and "constants"
    var gl = glContext;
    var button;
    var buttonPosition = { x: 0, y: 0, z: 0 };
    var active = false;        // Current state

    // Arrays that hold Object details
    var vertArray = [];
    var texCoordsArray = [];
    var textureArray = [];
    var buttonTextures = [];

    // Basic texture coordinates
    var textureCoords = [
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ];

    // Simple vertex values describing a rectangle
    var buttonVertices = [
        vec3.fromValues(0.27, 0.17, 0.1),
        vec3.fromValues(-0.27, 0.17, 0.1),
        vec3.fromValues(0.27, -0.17, 0.1),
        vec3.fromValues(-0.27, -0.17, 0.1)
    ];

    /**
     * This method creates the object's geometry and texture assignment.
     * @param textureArray An array of textures, an active texture and an inactive texture for the Start button.
     * @param shaderProgram The reference to the Shader Program Object to be used for rendering this object.
     */
    this.create = function (textureArray, shaderProgram) {
        // Create a copy of all the texures for local use
        buttonTextures = textureArray.slice();
        var currentTexturesArray = [];

        // Create the geometry, texture coordinates and texture arrays and assign the first (active) texture to it by default
        vertArray.push(buttonVertices);
        texCoordsArray.push(textureCoords);
        currentTexturesArray.push(textureArray[0]);

        // Finally create the actual 3d object
        button = new WebGL.object3d(gl);
        if (!button.initGeometry(vertArray, texCoordsArray))
            console.log("Start Button error. Error initializing Geometry!");
        if (!button.assignTextures(currentTexturesArray))
            console.log("Start Button error. Error assigning Textures!");
        button.assignShaderProgram(shaderProgram);
    };

    /**
     * This method is used to render the object onto the canvas
     * @param movementMatrix The 4x4 matrix describing the offset from origin for this object
     */
    this.draw = function (movementMatrix) {
        // Translate the object's frame of reference by the one passed as parameter and the x, y and z offset of the object's relative position
        var translation = vec3.fromValues(buttonPosition.x, buttonPosition.y, buttonPosition.z);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        // Draw the object
        if (!button.draw(translationMatrix))
            console.log("Start Button Drawing error!");
    };

    /**
     * This method sets the relative position of the object
     * @param position An array indicating the relative x, y and z-axis position of this object
     */
    this.setPosition = function (position) {
        buttonPosition.x = position[0];
        buttonPosition.y = position[1];
        buttonPosition.z = position[2];
    };

    /**
     * This function is a click handler for the Start button object
     * @param drums The array of all the drum objects so this function could make them spin
     */
    this.click = function (drums) {
        // If game state is active, and the button is active, then change game state to spinning, increase jackpot by 10% of the bet,
        // remove the bet amount from player's money, increase the turn count and reset the amount of money won last turn (if any).
        // Also push the button inward along z-axis, change the active status to false (along with texture change), and spin all the drums.
        if (currentGameState === gameState.Active) {
            if (active) {
                window.currentGameState = window.gameState.Spinning;
                window.numberValues.jackpot += parseInt(window.numberValues.playerBet * 0.1);
                window.numberValues.playerMoney -= window.numberValues.playerBet;
                window.numberValues.totalTurns++;
                window.numberValues.moneyWon = 0;

                buttonPosition.z -= 0.05;
                active = false;

                for (var drum = 0; drum < drums.length; drum++) {
                    drums[drum].spin();
                }

                if (!button.assignTextures([buttonTextures[1]]))
                    console.log("Start Button error. Error re-assigning new Textures!");

                setTimeout(depressButton, 100);
            }
            // If the game state is inactive, that means we're in the welcome screen, so we switch game mode to active to start the game.
        } else if (currentGameState === gameState.Inactive) {
            window.currentGameState = window.gameState.Active;
        }
    };

    /**
     * This function simply restores the button's z-axis position and resets clicked flag to false
     */
    function depressButton() {
        buttonPosition.z += 0.05;
    }

    /**
     * This function activates (or de-activates) the button, and changes the textures appropriately
     * @param state A boolean value. True (or blank) to activate the button, false to de-activate the button
     */
    this.activate = function (state) {
        if ((state === undefined) || (state)) {
            if (!button.assignTextures([buttonTextures[0]])) {
                console.log("Start Button error. Error re-assigning new Textures!");
            } else {
                active = true;
            }
        } else {
            if (!button.assignTextures([buttonTextures[1]])) {
                console.log("Start Button error. Error re-assigning new Textures!");
            } else {
                active = false;
            }
        }
    };

    /**
     * This function returns whether or not the button is active
     * @returns The active status of the button
     */
    this.isActive = function () {
        return active;
    };
}

/**
 * This Object creates and handles the "Power" button for the game.
 */
function PowerButtonObject(glContext) {
    // Local storage variables and "constants"
    var gl = glContext;
    var button;
    var buttonPosition = { x: 0, y: 0, z: 0 };

    // Arrays that hold Object details
    var vertArray = [];
    var texCoordsArray = [];
    var textureArray = [];
    var buttonTextures = [];

    // Basic texture coordinates
    var textureCoords = [
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ];

    // Simple vertex values describing a square
    var buttonVertices = [
        vec3.fromValues(0.15, 0.15, 0.1),
        vec3.fromValues(-0.15, 0.15, 0.1),
        vec3.fromValues(0.15, -0.15, 0.1),
        vec3.fromValues(-0.15, -0.15, 0.1)
    ];

    /**
     * This method creates the object's geometry and texture assignment.
     * @param textureArray An array of textures, an active texture and an inactive texture for the Power button.
     * @param shaderProgram The reference to the Shader Program Object to be used for rendering this object.
     */
    this.create = function (textureArray, shaderProgram) {
        // Create a copy of all the texures for local use
        buttonTextures = textureArray.slice();
        var currentTexturesArray = [];

        // Create the geometry, texture coordinates and texture arrays and assign the first (active) texture to it by default
        vertArray.push(buttonVertices);
        texCoordsArray.push(textureCoords);
        currentTexturesArray.push(textureArray[0]);

        // Finally create the actual 3d object
        button = new WebGL.object3d(gl);
        if (!button.initGeometry(vertArray, texCoordsArray))
            console.log("Power Button error. Error initializing Geometry!");
        if (!button.assignTextures(currentTexturesArray))
            console.log("Power Button error. Error assigning Textures!");
        button.assignShaderProgram(shaderProgram);
    };

    /**
     * This method is used to render the object onto the canvas
     * @param movementMatrix The 4x4 matrix describing the offset from origin for this object
     */
    this.draw = function (movementMatrix) {
        // Translate the object's frame of reference by the one passed as parameter and the x, y and z offset of the object's relative position
        var translation = vec3.fromValues(buttonPosition.x, buttonPosition.y, buttonPosition.z);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        // Draw the object
        if (!button.draw(translationMatrix))
            console.log("Power Button Drawing error!");
    };

    /**
     * This method sets the relative position of the object
     * @param position An array indicating the relative x, y and z-axis position of this object
     */
    this.setPosition = function (position) {
        buttonPosition.x = position[0];
        buttonPosition.y = position[1];
        buttonPosition.z = position[2];
    };

    /**
     * This function is a click handler for the Power button object
     */
    this.click = function () {
        // Reset all game values, set game state to inactive and push button inward a little along z-axis.
        window.currentGameState = window.gameState.Inactive;
        window.numberValues.losses = 0;
        window.numberValues.wins = 0;
        window.numberValues.totalTurns = 0;
        window.numberValues.moneyWon = 0;
        window.numberValues.playerBet = 0;
        window.numberValues.playerMoney = 1000;

        buttonPosition.z -= 0.05;
        setTimeout(depressButton, 100);
    };

    /**
     * This function simply restores the button's z-axis position and resets clicked flag to false
     */
    function depressButton() {
        buttonPosition.z += 0.05;
    }
}

/**
 * This Object creates and handles the "Reset" button for the game.
 */
function ResetButtonObject(glContext) {
    // Local storage variables and "constants"
    var gl = glContext;
    var button;
    var buttonPosition = { x: 0, y: 0, z: 0 };

    // Arrays that hold Object details
    var vertArray = [];
    var texCoordsArray = [];
    var textureArray = [];
    var buttonTextures = [];

    // Basic texture coordinates
    var textureCoords = [
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ];

    // Simple vertex values describing a square
    var buttonVertices = [
        vec3.fromValues(0.12, 0.12, 0.1),
        vec3.fromValues(-0.12, 0.12, 0.1),
        vec3.fromValues(0.12, -0.12, 0.1),
        vec3.fromValues(-0.12, -0.12, 0.1)
    ];

    /**
     * This method creates the object's geometry and texture assignment.
     * @param textureArray An array of textures, an active texture and an inactive texture for the Reset button.
     * @param shaderProgram The reference to the Shader Program Object to be used for rendering this object.
     */
    this.create = function (textureArray, shaderProgram) {
        // Create a copy of all the texures for local use
        buttonTextures = textureArray.slice();
        var currentTexturesArray = [];

        // Create the geometry, texture coordinates and texture arrays and assign the first (active) texture to it by default
        vertArray.push(buttonVertices);
        texCoordsArray.push(textureCoords);
        currentTexturesArray.push(textureArray[0]);

        // Finally create the actual 3d object
        button = new WebGL.object3d(gl);
        if (!button.initGeometry(vertArray, texCoordsArray))
            console.log("Reset Button error. Error initializing Geometry!");
        if (!button.assignTextures(currentTexturesArray))
            console.log("Reset Button error. Error assigning Textures!");
        button.assignShaderProgram(shaderProgram);
    };

    /**
     * This method is used to render the object onto the canvas
     * @param movementMatrix The 4x4 matrix describing the offset from origin for this object
     */
    this.draw = function (movementMatrix) {
        // Translate the object's frame of reference by the one passed as parameter and the x, y and z offset of the object's relative position
        var translation = vec3.fromValues(buttonPosition.x, buttonPosition.y, buttonPosition.z);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        // Draw the object
        if (!button.draw(translationMatrix))
            console.log("Reset Button Drawing error!");
    };

    /**
     * This method sets the relative position of the object
     * @param position An array indicating the relative x, y and z-axis position of this object
     */
    this.setPosition = function (position) {
        buttonPosition.x = position[0];
        buttonPosition.y = position[1];
        buttonPosition.z = position[2];
    };

    /**
     * This function is a click handler for the Start button object
     * @param drums The array of all the drum objects so this function could make them spin
     */
    this.click = function () {
        // Reset all game values and push button inward a little along z-axis.
        window.currentGameState = window.gameState.Active;
        window.numberValues.losses = 0;
        window.numberValues.wins = 0;
        window.numberValues.totalTurns = 0;
        window.numberValues.moneyWon = 0;
        window.numberValues.playerBet = 0;
        window.numberValues.playerMoney = 1000;

        buttonPosition.z -= 0.05;
        setTimeout(depressButton, 100);
    };

    /**
     * This function simply restores the button's z-axis position and resets clicked flag to false
     */
    function depressButton() {
        buttonPosition.z += 0.05;
    }
}

/**
 * This Object creates and handles the text labels used in the game.
 */
function LabelObject(glContext) {
    var gl = glContext;
    var label;
    var labelValue = "";
    var labelPosition = { x: 0, y: 0, z: 0 };
    var labelCharWidth = 0.05;
    var labelCharHeight = 0.10;

    // Arrays that hold Object details
    var vertArray = [];
    var texCoordsArray = [];
    var textureArray = [];
    var letterTextures = {};

    // Basic texture coordinates
    var textureCoords = [
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ];

    // Simple vertex values describing a rectangle based on "constant" values
    var letterVertices = [
        vec3.fromValues((labelCharWidth / 2), (labelCharHeight / 2), 0.1),
        vec3.fromValues(-(labelCharWidth / 2), (labelCharHeight / 2), 0.1),
        vec3.fromValues((labelCharWidth / 2), -(labelCharHeight / 2), 0.1),
        vec3.fromValues(-(labelCharWidth / 2), -(labelCharHeight / 2), 0.1)
    ];

    /**
     * This method creates the object's geometry and texture assignment.
     * @param textureObject An Object of textures with alphabet characters as keys, used to build the text strings.
     * @param shaderProgram The reference to the Shader Program Object to be used for rendering this object.
     * @param labelText The text to display on this label object.
     */
    this.create = function (textureObject, shaderProgram, labelText) {
        // Initialize local variables
        labelValue = labelText;
        var currentTexturesArray = [];
        var transformationMatrix = mat4.create();
        var translation = vec3.create();
        var newXYZ = vec3.create();

        // Then for each letter, add a rectangle (offset each by the width of a letter rectangle for each consecutive letter),
        // and assign it the texture for the given character
        for (var i = 0; i < labelText.length; i++) {
            vertArray[i] = [];

            for (var j = 0; j < letterVertices.length; j++) {
                mat4.identity(transformationMatrix);
                vec3.set(translation, (labelCharWidth * i), 0.0, 0.0);
                mat4.translate(transformationMatrix, transformationMatrix, translation);

                vec3.transformMat4(newXYZ, letterVertices[j], transformationMatrix);

                vertArray[i].push(vec3.clone(newXYZ));
            }
            texCoordsArray.push(textureCoords);
            currentTexturesArray.push(textureObject[labelText.charAt(i)]);
        }

        // Finally create the actual 3d object
        label = new WebGL.object3d(gl);
        if (!label.initGeometry(vertArray, texCoordsArray))
            console.log("Label error. Error initializing Geometry!");
        if (!label.assignTextures(currentTexturesArray))
            console.log("Label error. Error assigning Textures!");
        label.assignShaderProgram(shaderProgram);
    };

    /**
     * This method is used to render the object onto the canvas
     * @param movementMatrix The 4x4 matrix describing the offset from origin for this object
     */
    this.draw = function (movementMatrix) {
        // Translate the object's frame of reference by the one passed as parameter and the x, y and z offset of the object's relative position
        var translation = vec3.fromValues(labelPosition.x, labelPosition.y, labelPosition.z);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        // Draw the object
        if (!label.draw(translationMatrix))
            console.log("Label Drawing error!");
    };

    /**
     * This method sets the relative position of the object
     * @param position An array indicating the relative x, y and z-axis position of this object
     */
    this.setPosition = function (position) {
        labelPosition.x = position[0];
        labelPosition.y = position[1];
        labelPosition.z = position[2];
    };

    /**
     * This method sets/changes the text of this label object
     * @param value The new text to draw on the label.
     */
    this.setValue = function (value) {
        labelValue = value;

        var textureArray = [];
        for (var i = 0; i < labelValue.length; i++) {
            textureArray.push(digitTextures[parseInt(labelValue.charAt(i))]);
        }
        if (!label.assignTextures(textureArray))
            console.log("Label error. Error re-assigning new Textures!");

        return true;
    };
}

/**
 * This Object creates and handles the numeric value labels used in the game.
 * @param glContext The WebGL context of the canvas.
 * @param size The maximum number of digits to use for this number object.
 */
function NumberObject(glContext, size) {
    // Initialize local variables and constants
    var gl = glContext;
    var number;
    var numberValue = 0;
    var digitCount = size;
    var numberPosition = { x: 0, y: 0, z: 0 };
    var numberDigitWidth = 0.05;
    var numberDigitHeight = 0.1;

    // Variables that hold the object information
    var vertArray = [];
    var texCoordsArray = [];
    var textureArray = [];
    var digitTextures = [];

    // Basic texture coordinates
    var textureCoords = [
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ];

    // Simple vertex values describing a rectangle based on "constant" values
    var digitVertices = [
        vec3.fromValues((numberDigitWidth / 2), (numberDigitHeight / 2), 0.1),
        vec3.fromValues(-(numberDigitWidth / 2), (numberDigitHeight / 2), 0.1),
        vec3.fromValues((numberDigitWidth / 2), -(numberDigitHeight / 2), 0.1),
        vec3.fromValues(-(numberDigitWidth / 2), -(numberDigitHeight / 2), 0.1)
    ];

    /**
     * This method creates the object's geometry and texture assignment.
     * @param textureArray An Array of textures for the digits. Each index in the array should map directly to the digit (0 - 9).
     * @param shaderProgram The reference to the Shader Program Object to be used for rendering this object.
     */
    this.create = function (textureArray, shaderProgram) {
        // Initialize local variables
        digitTextures = textureArray.slice();
        var currentTexturesArray = [];
        var transformationMatrix = mat4.create();
        var translation = vec3.create();
        var newXYZ = vec3.create();

        // Then for each digit, add a rectangle (offset each by the width of a letter rectangle for each consecutive digit),
        // and assign it the default texture for "0".
        for (var i = 0; i < digitCount; i++) {
            vertArray[i] = [];

            for (var j = 0; j < digitVertices.length; j++) {
                mat4.identity(transformationMatrix);
                vec3.set(translation, (numberDigitWidth * i), 0.0, 0.0);
                mat4.translate(transformationMatrix, transformationMatrix, translation);

                vec3.transformMat4(newXYZ, digitVertices[j], transformationMatrix);

                vertArray[i].push(vec3.clone(newXYZ));
            }
            texCoordsArray.push(textureCoords);
            currentTexturesArray.push(textureArray[0]);
        }

        // Finally create the actual 3d object
        number = new WebGL.object3d(gl);
        if (!number.initGeometry(vertArray, texCoordsArray))
            console.log("Number error. Error initializing Geometry!");
        if (!number.assignTextures(currentTexturesArray))
            console.log("Number error. Error assigning Textures!");
        number.assignShaderProgram(shaderProgram);
    };

    /**
     * This method is used to render the object onto the canvas
     * @param movementMatrix The 4x4 matrix describing the offset from origin for this object
     */
    this.draw = function (movementMatrix) {
        // Translate the object's frame of reference by the one passed as parameter and the x, y and z offset of the object's relative position
        var translation = vec3.fromValues(numberPosition.x, numberPosition.y, numberPosition.z);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        // Draw the object
        if (!number.draw(translationMatrix))
            console.log("Number Drawing error!");
    };

    /**
     * This method sets the relative position of the object
     * @param position An array indicating the relative x, y and z-axis position of this object
     */
    this.setPosition = function (position) {
        numberPosition.x = position[0];
        numberPosition.y = position[1];
        numberPosition.z = position[2];
    };

    /**
     * This method sets/changes the value of this number object
     * @param value The new value of this number object.
     */
    this.setValue = function (value) {
        numberValue = value;

        // Create a string representation of this number. If the length of the string representation is larger than the number of digits allocated for this number
        // then exit this function and return false indicating an error.
        var stringValue = value.toString();
        if (stringValue.length > digitCount) {
            return false;
        }

        // Pad out the number with additional "0" characters in front of it to brind the total number of digits up to digitCount
        stringValue = Array(digitCount - stringValue.length + 1).join("0") + stringValue;

        // Create an array of textures, assigning a texture to each digit spot that corresponds to the image of the digit
        var textureArray = [];
        for (var i = 0; i < stringValue.length; i++) {
            textureArray.push(digitTextures[parseInt(stringValue.charAt(i))]);
        }

        // Finally assign the textures to the 3d object for rendering and return true to indicate all went well.
        if (!number.assignTextures(textureArray))
            console.log("Number error. Error re-assigning new Textures!");

        return true;
    };
}

/**
 * This Object creates and handles the "Reset" button for the game.
 */
function JackpotObject(glContext) {
    // Local storage variables and "constants"
    var gl = glContext;
    var image;
    var active = false;
    var imagePosition = { x: 0, y: 0, z: 0 };

    // Arrays that hold Object details
    var vertArray = [];
    var texCoordsArray = [];
    var textureArray = [];
    var imageTextures = [];

    // Basic texture coordinates
    var textureCoords = [
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ];

    // Simple vertex values describing a square
    var buttonVertices = [
        vec3.fromValues(0.35, 0.35, 0.1),
        vec3.fromValues(-0.35, 0.35, 0.1),
        vec3.fromValues(0.35, -0.35, 0.1),
        vec3.fromValues(-0.35, -0.35, 0.1)
    ];

    /**
     * This method creates the object's geometry and texture assignment.
     * @param textureArray An array of textures, an active texture and an inactive texture for the Reset button.
     * @param shaderProgram The reference to the Shader Program Object to be used for rendering this object.
     */
    this.create = function (textureArray, shaderProgram) {
        // Create a copy of all the textures for local use
        imageTextures = textureArray.slice();

        // Create the geometry, texture coordinates and texture arrays and assign the first (active) texture to it by default
        vertArray.push(buttonVertices);
        texCoordsArray.push(textureCoords);

        // Finally create the actual 3d object
        image = new WebGL.object3d(gl);
        if (!image.initGeometry(vertArray, texCoordsArray))
            console.log("Jackpot Image error. Error initializing Geometry!");
        if (!image.assignTextures(textureArray))
            console.log("Jackpot Image error. Error assigning Textures!");
        image.assignShaderProgram(shaderProgram);
    };

    /**
     * This method is used to render the object onto the canvas
     * @param movementMatrix The 4x4 matrix describing the offset from origin for this object
     */
    this.draw = function (movementMatrix) {
        // Translate the object's frame of reference by the one passed as parameter and the x, y and z offset of the object's relative position
        var translation = vec3.fromValues(imagePosition.x, imagePosition.y, imagePosition.z);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        // Draw the object
        if (!image.draw(translationMatrix))
            console.log("Jackpot Image Drawing error!");
    };

    /**
     * This method sets the relative position of the object
     * @param position An array indicating the relative x, y and z-axis position of this object
     */
    this.setPosition = function (position) {
        imagePosition.x = position[0];
        imagePosition.y = position[1];
        imagePosition.z = position[2];
    };

    /**
     * This function simply restores the button's z-axis position and resets clicked flag to false
     */
    this.activate = function () {
        active = true;

        setTimeout(function () {
            active = false;
        }, 5000);
    };

    /**
     * This function returns the active status of this object
     * @returns The active status of the jackpot object
     */
    this.isActive = function () {
        return active;
    };
}


















/* GLOBAL VARIABLES AND CONSTANTS */
var gl;
var shaderProgram;
var translation = vec3.create();
var rotation = vec3.create();
var mvMatrix = mat4.create();
//var mvMatrixStack = [];
var pMatrix = mat4.create();

var gameState = { "Inactive": 0, "Active": 1, "Spinning": 2, "Lost": 3 };
var currentGameState = gameState.Inactive;

var drumCount = 5;
var drums = [];
var machine;
var betButtonCount = 10;
var betButtons = [];
var startButton;
var stopButtons = [];
var resetButton;
var powerButton;
var labels = {};
var numbers = {};
var jackpotSplash;

var numberValues = { jackpot: 5000, playerBet: 0, playerMoney: 1000, moneyWon: 0, wins: 0, losses: 0, totalTurns: 0 };

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
    machine:    "img/machine_512.jpg",
    startGreen: "img/start_button_green_512.png",
    startRed:   "img/start_button_red_512.png",
    powerButton:    "img/power_button_256.png",
    resetButton:    "img/reset_button_256.png",
    buttonGreen1:   "img/button_plus_1_512.png",
    buttonGreen5:   "img/button_plus_5_512.png",
    buttonGreen10:  "img/button_plus_10_512.png",
    buttonGreen50:  "img/button_plus_50_512.png",
    buttonGreen100: "img/button_plus_100_512.png",
    buttonRed1:     "img/button_minus_1_512.png",
    buttonRed5:     "img/button_minus_5_512.png",
    buttonRed10:    "img/button_minus_10_512.png",
    buttonRed50:    "img/button_minus_50_512.png",
    buttonRed100:   "img/button_minus_100_512.png",
    stopButtonGreen:"img/stop_button_green_512.png",
    stopButtonRed:  "img/stop_button_red_512.png",
    colon:      "img/alphabet/alphabet_colon_256.png",
    space:      "img/alphabet/alphabet_space_256.png",
    jackpot:    "img/jackpot_256.png",
    test:       "img/test_button_512.jpg"
};
var drumTextureNameList = ["grapes", "bananas", "oranges", "cherries", "bars", "bells", "sevens", "blanks"];
var digitsTextureNameList = ["digitZero", "digitOne", "digitTwo", "digitThree", "digitFour", "digitFive", "digitSix", "digitSeven", "digitEight", "digitNine"];
var allTexturesLoaded = false;
var betButtonValues = [1, -1, 5, -5, 10, -10, 50, -50, 100, -100];
var betButtonTextureNameList = ["buttonGreen1", "buttonRed1", "buttonGreen5", "buttonRed5", "buttonGreen10", "buttonRed10", "buttonGreen50", "buttonRed50", "buttonGreen100", "buttonRed100"];

var alphabet = "abcdefghijklmnopqrstuvwxyz";
var alphabetTextureNameList = { lowercase: [], uppercase: [] };

// Load lowercase character set
for (var letter = 0; letter < alphabet.length; letter++) {
    var character = alphabet.charAt(letter);
    var textureName = character;
    textureURLs[textureName] = "img/alphabet/lowercase/alphabet_" + character + "_256.png";
    alphabetTextureNameList.lowercase.push(textureName);
}

// Load uppercase character set
for (var letter = 0; letter < alphabet.length; letter++) {
    var character = alphabet.charAt(letter).toUpperCase();
    var textureName = character;
    textureURLs[textureName] = "img/alphabet/uppercase/alphabet_" + character + "_256.png";
    alphabetTextureNameList.uppercase.push(textureName);
}


/**
 * This function initializes WebGL, creates the WebGL context and assigns it to the global variable gl.
 * @param canvas The canvas element.
 */
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

/**
 * This method initializes the vertex and fragment shaders, as well as bind shader variables to javascript variables
 */
function initShaders() {
    // Initialize shader
    shaderProgram = gl.createProgram();

    // Load shader code from their respective files, and get the compiled shader object for each shader type
    var fragmentShader = getShader(gl, "fragment");
    var vertexShader = getShader(gl, "vertex");

    // "link" the shader glsl code into the shader program object and attach the shader object to the webgl context handle
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If shader "linking" proccess had errors, alert user (most likely due to bad glsl code)
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialize shaders");
    }

    // Tell WebGL to use the shader we created
    gl.useProgram(shaderProgram);

    // Bind the variables
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
}

/**
 * This method uses synchronous ajax request to load the shader source code, then compiles it and returns the compiled shader.
 * @param gl The WebGL context
 * @param shaderType A string indicating whether we're loading the "vertex" or the "fragment" shader
 * @returns The compiled shader
 */
function getShader(gl, shaderType) {
    // Load shader source code
    $.ajax({
        url: "Resource/" + shaderType + ".shader",
        async: false,
        success: function (data) {
            shaderProgram[shaderType] = data;
        }
    });

    // create the appropriate shader, otherwise exit function and return null
    var shader;
    if (shaderType === "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderType === "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    // Compile the shader source code
    gl.shaderSource(shader, shaderProgram[shaderType]);
    gl.compileShader(shader);

    // If the shader did not compile (probably due to bad source code), exit the function and return null
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    // Return the compiled shader
    return shader;
}

/*
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
*/

/**
 * A simple utility function to convert from degrees to radians
 */
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * This is the core function that initiates all the work. Initializes all data and objects, loads textures and shaders, and finally starts the drawing loop
 */
this.webGLStart = function () {
    // Get canvas from the DOM
    var canvas = document.getElementById("webgl-canvas");

    // Initialize WebGL
    initGL(canvas);

    // Load and initialize Vertex and Fragment shaders
    initShaders();

    // Load all the textures
    var loadedTextures = {};
    initTextures(loadedTextures);

    // Set up some defaults for WebGL rendering. Enable depth testing, backface culling and alpha blending.
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    // Initiate the createObjects loop
    setTimeout(createObjects);

    /**
     * This function calls itself repeatedly and tests if all the textures have finished loading. Once they have finished
     * loading, this function creates all of the game objects and initializes the tick loop.
     */
    function createObjects() {
        // Test if all the textures have been loaded
        if (allTexturesLoaded) {
            // Initialize the drum texture buffer
            var drumTextures = [];
            $.each(drumTextureNameList, function (index, textureName) {
                drumTextures.push(loadedTextures[textureName]);
            });

            // Initialize all the drums
            var offset = -2.1 * parseInt(drumCount / 2);
            if (drumCount % 2 === 0) {
                offset += 2.1 / 2;
            }
            for (var drum = 0; drum < drumCount; drum++) {
                drums.push(new DrumObject(gl));
                drums[drum].create(drumTextures, shaderProgram);
                drums[drum].setPosition([offset, 0.0, 0.0]);
                drums[drum].reset();
                offset += 2.1;
            }

            // Initialize the machine backdrop
            machine = new MachineObject(gl);
            machine.create([
                loadedTextures.machine,
                loadedTextures.machine,
                loadedTextures.machine,
                loadedTextures.machine
            ], shaderProgram);

            // Initialize the bet buttons
            var buttonXOffset = -0.82;
            var buttonYOffset = -0.69;
            for (var i = 0; i < betButtonCount; i++) {
                betButtons[i] = new ButtonObject(gl);
                betButtons[i].create([loadedTextures[betButtonTextureNameList[i]]], shaderProgram);
                if ((i % 2) === 0) {
                    betButtons[i].setPosition([buttonXOffset + 0.27 * parseInt(i / 2), buttonYOffset, 0.0]);
                } else {
                    betButtons[i].setPosition([buttonXOffset + 0.27 * parseInt(i / 2), buttonYOffset - 0.18, 0.0]);
                }
                betButtons[i].setValue(betButtonValues[i]);
            }

            // Initialize the Start button
            startButton = new StartButtonObject(gl);
            startButton.create([loadedTextures.startGreen, loadedTextures.startRed], shaderProgram);
            startButton.setPosition([0.70, -0.78, 0.0]);

            // Initialize the stop buttons
            buttonXOffset = -0.56;
            buttonYOffset = -0.45;
            for (i = 0; i < drumCount; i++) {
                stopButtons[i] = new ButtonObject(gl);
                stopButtons[i].create([loadedTextures.stopButtonGreen, loadedTextures.stopButtonRed], shaderProgram);
                stopButtons[i].setPosition([buttonXOffset + 0.28 * i, buttonYOffset, 0.0]);
                stopButtons[i].activate(false);
            }

            // Initialize the Power button
            powerButton = new PowerButtonObject(gl);
            powerButton.create([loadedTextures.powerButton], shaderProgram);
            powerButton.setPosition([0.88, 0.0, 0.0]);

            // Initialize the Reset button
            resetButton = new ResetButtonObject(gl);
            resetButton.create([loadedTextures.resetButton], shaderProgram);
            resetButton.setPosition([-0.88, 0.0, 0.0]);

            // Initialize the Jackpot splash image
            jackpotSplash = new JackpotObject(gl);
            jackpotSplash.create([loadedTextures.jackpot], shaderProgram);
            jackpotSplash.setPosition([0.0, 0.0, 1.0]);

            // Create the charset list object
            var textureList = {};
            var character;
            for (i = 0; i < alphabetTextureNameList.lowercase.length; i++) {
                character = String.fromCharCode('a'.charCodeAt(0) + i);
                textureList[character] = loadedTextures[alphabetTextureNameList.lowercase[i]];

                character = String.fromCharCode('A'.charCodeAt(0) + i);
                textureList[character] = loadedTextures[alphabetTextureNameList.uppercase[i]];
            }
            textureList[":"] = loadedTextures.colon;
            textureList[" "] = loadedTextures.space;

            // Initialize the Welcome message label
            labels["welcome"] = new LabelObject(gl);
            labels["welcome"].create(textureList, shaderProgram, "Welcome to the Awesome Slot Machine");
            labels["welcome"].setPosition([-0.9, 0.7, 0.0]);

            // Initialize the Credits message label
            labels["madeBy"] = new LabelObject(gl);
            labels["madeBy"].create(textureList, shaderProgram, "Created by Konstantin Koton");
            labels["madeBy"].setPosition([-0.7, -0.7, 0.0]);

            // Initialize the Jackpot message label
            labels["jackpot"] = new LabelObject(gl);
            labels["jackpot"].create(textureList, shaderProgram, "Jackpot:");
            labels["jackpot"].setPosition([-0.95, 0.95, 0.0]);

            // Initialize the Player Money message label
            labels["playerMoney"] = new LabelObject(gl);
            labels["playerMoney"].create(textureList, shaderProgram, "Player Money:");
            labels["playerMoney"].setPosition([-0.95, 0.8, 0.0]);

            // Initialize the Bet message label
            labels["playerBet"] = new LabelObject(gl);
            labels["playerBet"].create(textureList, shaderProgram, "Bet:");
            labels["playerBet"].setPosition([-0.95, 0.65, 0.0]);

            // Initialize the Money Won message label
            labels["moneyWon"] = new LabelObject(gl);
            labels["moneyWon"].create(textureList, shaderProgram, "Won:");
            labels["moneyWon"].setPosition([-0.95, 0.5, 0.0]);

            // Initialize the Total Turns message label
            labels["totalTurns"] = new LabelObject(gl);
            labels["totalTurns"].create(textureList, shaderProgram, "Turns:");
            labels["totalTurns"].setPosition([0.3, 0.8, 0.0]);

            // Initialize the Win count message label
            labels["wins"] = new LabelObject(gl);
            labels["wins"].create(textureList, shaderProgram, "Wins:");
            labels["wins"].setPosition([0.3, 0.65, 0.0]);

            // Initialize the Loss count message label
            labels["losses"] = new LabelObject(gl);
            labels["losses"].create(textureList, shaderProgram, "Losses:");
            labels["losses"].setPosition([0.3, 0.5, 0.0]);

            // Initialize the digit texture buffer
            var digitTextureList = [
                loadedTextures.digitZero,
                loadedTextures.digitOne,
                loadedTextures.digitTwo,
                loadedTextures.digitThree,
                loadedTextures.digitFour,
                loadedTextures.digitFive,
                loadedTextures.digitSix,
                loadedTextures.digitSeven,
                loadedTextures.digitEight,
                loadedTextures.digitNine
            ];

            // Initialize the Jackpot number object
            numbers["jackpot"] = new NumberObject(gl, 10);
            numbers["jackpot"].create(digitTextureList, shaderProgram);
            numbers["jackpot"].setPosition([-0.5, 0.95, 0.0]);

            // Initialize the Player Money number object
            numbers["playerMoney"] = new NumberObject(gl, 6);
            numbers["playerMoney"].create(digitTextureList, shaderProgram);
            numbers["playerMoney"].setPosition([-0.25, 0.8, 0.0]);

            // Initialize the Bet number object
            numbers["playerBet"] = new NumberObject(gl, 6);
            numbers["playerBet"].create(digitTextureList, shaderProgram);
            numbers["playerBet"].setPosition([-0.5, 0.65, 0.0]);

            // Initialize the Money Won number object
            numbers["moneyWon"] = new NumberObject(gl, 10);
            numbers["moneyWon"].create(digitTextureList, shaderProgram);
            numbers["moneyWon"].setPosition([-0.5, 0.5, 0.0]);

            // Initialize the Turns number object
            numbers["totalTurns"] = new NumberObject(gl, 5);
            numbers["totalTurns"].create(digitTextureList, shaderProgram);
            numbers["totalTurns"].setPosition([0.7, 0.8, 0.0]);

            // Initialize the Wins number object
            numbers["wins"] = new NumberObject(gl, 5);
            numbers["wins"].create(digitTextureList, shaderProgram);
            numbers["wins"].setPosition([0.7, 0.65, 0.0]);

            // Initialize the Losses number object
            numbers["losses"] = new NumberObject(gl, 5);
            numbers["losses"].create(digitTextureList, shaderProgram);
            numbers["losses"].setPosition([0.7, 0.5, 0.0]);

            // Begin the tick loop, which is the game logic and drawing loop.
            tick();
        } else {
            // If the textures still haven't loaded, loop through all the textures and see if they all finished loading since last check,
            // and set the allTexturesLoaded flag as appropriate.
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
};

/**
 * This function initializes all the textures and populates the object passed to it as parameter
 * @param loadedTextures The object to be populated with texture data
 */
function initTextures(loadedTextures) {
    $.each(textureURLs, function (textureName, URL) {
        loadedTextures[textureName] = loadTextures(URL);
    });
}

/**
 * This function creates the texture object and loads an image into it based on the url parameter
 * @param url The url of the image to use as texture
 */
function loadTextures(url) {
    var texture = gl.createTexture();
    texture.image = new Image();

    texture.image.onload = function () {
        handleLoadedTexture(texture);
        texture.loaded = true;
    };

    texture.image.src = url;
    texture.url = url;
    return texture;
}

/**
 * This function is a handler that is called after an image finishes loading, in order to convert the image into a WebGL texture.
 * @param texture The texture object containing the image
 */
function handleLoadedTexture(texture) {
    // Turn the texture parameter into a WebGL texture object
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Flip the image pixels on Y-axis to convert from pixel space to texture space
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // Load the image into the texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);

    // Specify magnification extrapolation to be linear
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Specify shrinking extrapolation to use linear mipmap extrapolation
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    // Generate mipmaps for scalable square textures, ignore non-square textures
    gl.generateMipmap(gl.TEXTURE_2D);

    // Reset the current WebGL texture
    gl.bindTexture(gl.TEXTURE_2D, null);
}

/**
 * This function is the primary game loop that handles scene refreshes, and testing for win conditions
 */
function tick() {
    // Requests a callback of this function after 1/60th of a second (providing ~60 frames per second)
    requestAnimFrame(tick);

    // Draw the scene
    drawScene();

    // Disable the Start button if game state is active and bet is 0 (Don't allow the player to gamble with nothing)
    if (currentGameState === gameState.Active) {
        if (numberValues.playerBet === 0) {
            startButton.activate(false);
        } else {
            startButton.activate();
        }
    }

    // If the game state is spinning, then test the victory conditions every frame
    if (currentGameState === gameState.Spinning) {
        testWin();
    }
}

/**
 * This function is responsible for rendering all the objects onto the canvas
 */
function drawScene() {
    // Defined viewport, and clear the screen and depth buffer
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set perspective and base translation
    mat4.perspective(pMatrix, (60 * Math.PI) / 180, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
    mat4.identity(mvMatrix);
    vec3.set(translation, 0.0, 0.0, -14.0);
    mat4.translate(mvMatrix, mvMatrix, translation);

    // If game state is inactive (we're in the opening screen), then draw just the frame, the welcome message, the credit message and the start button.
    if (currentGameState === gameState.Inactive) {
        mat4.identity(mvMatrix);
        machine.draw(mvMatrix);

        vec3.set(translation, 0.0, 0.0, -2.0);
        mat4.translate(mvMatrix, mvMatrix, translation);

        startButton.setPosition([0.0, 0.0, 0.0]);
        startButton.activate();
        startButton.draw(mvMatrix);

        labels["welcome"].draw(mvMatrix);
        labels["madeBy"].draw(mvMatrix);
    } else {
        // Otherwise draw everything else
        /*        DRAW DRUMS         */
        for (var drum = 0; drum < drumCount; drum++) {
            drums[drum].draw(mvMatrix);
        }

        // Draw machine frame
        mat4.identity(mvMatrix);
        machine.draw(mvMatrix);

        // Draw betting buttons
        vec3.set(translation, 0.0, 0.0, -2.0);
        mat4.translate(mvMatrix, mvMatrix, translation);
        for (var i = 0; i < betButtons.length; i++) {
            betButtons[i].draw(mvMatrix);
        }

        // Draw Start, Power and Reset buttons
        startButton.setPosition([0.70, -0.78, 0.0]);
        startButton.draw(mvMatrix);
        powerButton.draw(mvMatrix);
        resetButton.draw(mvMatrix);

        // Draw the stop buttons for each drum
        for (i = 0; i < stopButtons.length; i++) {
            stopButtons[i].draw(mvMatrix);
        }

        // Draw the labels (except the welcome and credit labels, since those are only supposed to be drawn on the opening screen)
        $.each(labels, function (index) {
            if ((index !== "welcome") && (index !== "madeBy")) {
                this.draw(mvMatrix);
            }
        });

        // Draw the numbers
        $.each(numbers, function (index) {
            this.setValue(numberValues[index]);
            this.draw(mvMatrix);
        });

        // If Jackpot is active, draw jackpot splash image
        if (jackpotSplash.isActive()) {
            jackpotSplash.draw(mvMatrix);
        }
    }
}

/**
 * This function tests the win conditions, and takes appropriate action depending on the situation
 */
function testWin() {
    var stopped = true;
    var result = [];

    // Check whether each drum is still spinning, if it isn't, de-activate the associated stop button. Also retrieve the spin result from each drum.
    for (var drum = 0; drum < drums.length; drum++) {
        if (drums[drum].isSpinning()) {
            stopped = false;
        } else {
            if (stopButtons[drum].isActive()) {
                stopButtons[drum].activate(false);
            }
        }
        result.push(drumTextureNameList[drums[drum].getResult()]);
    }

    // If all drums stopped, determine if the player won anything or not
    if (stopped) {
        // Change game state back to active
        currentGameState = gameState.Active;
//        console.log("Multiplier: " + determineMultiplier(result));

        // Get the multiplier based on results
        var multiplier = determineMultiplier(result);

        // If multiplier is not 0, then we won something
        if (multiplier !== 0) {
            // Set the money won to the bet multiplied by the multiplier, add the winnings to the player's money
            // and increase wins count.
            window.numberValues.moneyWon = window.numberValues.playerBet * multiplier;
            window.numberValues.playerMoney += window.numberValues.moneyWon;
            window.numberValues.wins++;

            // Check if we also hit the jackpot
            if (isJackpot(result)) {
                // If we did, add the jackpot value to the player's money, as well as the money won,
                // and set jackpot to 0.
                window.numberValues.playerMoney += window.numberValues.jackpot;
                window.numberValues.moneyWon += window.numberValues.jackpot;
                window.numberValues.jackpot = 0;
                jackpotSplash.activate();
            }
        } else {
            // If multiplier was 0, then we lost so increase the losses count.
            window.numberValues.losses++;
        }
        window.numberValues.playerBet = 0;
    }
}







