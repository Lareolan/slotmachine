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
            console.log("Drum Drawing error!");

        if (stopping) {
            var rotationSpeed = drum.getRotationSpeed()[0];
            if (rotationSpeed <= 0) {
                drum.stopAnimation();
                stopping = false;
                spinning = false;
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
        if ((spinning) && (!stopping)){
            stopping = true;
            result = window.getSpinResult();

            currentItem = ((result - 3) < 0) ? (result - 3) + 8 : (result - 3);
            drum.setRotation([currentItem * angleDelta, 0, 0]);
            drum.setRotationSpeed([drum.getRotationSpeed()[0] / 4, 0, 0]);
        }
    }

    this.getResult = function () {
        if (!spinning) {
            return result;
        } else {
            return null;
        }
    }

    this.isSpinning = function () {
        return spinning;
    }

    this.reset = function (face) {
        if (face === undefined) {
            face = parseInt(Math.random() * 8);
        }
        drum.setRotation([face * angleDelta, 0, 0]);
        drum.setRotationSpeed([0, 0, 0]);
        spinning = false;
        stopping = false;
    }
}

function MachineObject(glContext) {
    // Local storage variables and "constants"
    var gl = glContext;
    var machine;
    var machineFaceCount = 4;

    var vertArray = [];
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
            console.log("Machine error. Error initializing Geometry!");
        if (!machine.assignTextures(textureArray))
            console.log("Machine error. Error assigning Textures!");
        machine.assignShaderProgram(shaderProgram);
    }

    this.draw = function (movementMatrix) {
        var translation = vec3.fromValues(0, 0, -2);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        if (!machine.draw(translationMatrix))
            console.log("Machine Drawing error!");
    }
}


function ButtonObject(glContext) {
    // Local storage variables and "constants"
    var gl = glContext;
    var button;
    var buttonPosition = { x: 0, y: 0, z: 0 };
    var active = true;          // Current state
    var clicked = false;        // Current state
    var buttonValue = 0;

    var vertArray = [];
    var texCoordsArray = [];
    var textureArray = [];
    var buttonTextures = [];

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
        buttonTextures = textureArray.slice();
        var currentTexturesArray = [];

        vertArray.push(buttonVertices);
        texCoordsArray.push(textureCoords);
        currentTexturesArray.push(textureArray[0]);

        button = new webgl.object3d(gl);
        if (!button.initGeometry(vertArray, texCoordsArray))
            console.log("Button error. Error initializing Geometry!");
        if (!button.assignTextures(currentTexturesArray))
            console.log("Button error. Error assigning Textures!");
        button.assignShaderProgram(shaderProgram);
    }

    this.draw = function (movementMatrix) {
        var translation = vec3.fromValues(buttonPosition.x, buttonPosition.y, buttonPosition.z);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        if (!button.draw(translationMatrix))
            console.log("Button Drawing error!");
    }

    this.setPosition = function (position) {
        buttonPosition.x = position[0];
        buttonPosition.y = position[1];
        buttonPosition.z = position[2];
    }

    this.click = function () {
        if ((!clicked) && (active)) {
            buttonPosition.z -= 0.05;
            clicked = true;

            // increase or reduce player money
            if ((window.numberValues.playerBet + buttonValue) >= 0) {
                if ((window.numberValues.playerBet + buttonValue) <= window.numberValues.playerMoney) {
                    window.numberValues.playerBet += buttonValue;
                }
            } else {
                window.numberValues.playerBet = 0;
            }

            setTimeout(depressButton, 100);
        }
    }

    function depressButton() {
        buttonPosition.z += 0.05;
        clicked = false;
    }

    this.setValue = function (value) {
        buttonValue = value;
    }

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
    }

    this.isActive = function () {
        return active;
    }
}

function StartButtonObject(glContext) {
    // Local storage variables and "constants"
    var gl = glContext;
    var button;
    var buttonPosition = { x: 0, y: 0, z: 0 };
    var active = false;        // Current state

    var vertArray = [];
    var texCoordsArray = [];
    var textureArray = [];
    var buttonTextures = [];

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
        buttonTextures = textureArray.slice();
        var currentTexturesArray = [];

        vertArray.push(buttonVertices);
        texCoordsArray.push(textureCoords);
        currentTexturesArray.push(textureArray[0]);

        button = new webgl.object3d(gl);
        if (!button.initGeometry(vertArray, texCoordsArray))
            console.log("Start Button error. Error initializing Geometry!");
        if (!button.assignTextures(currentTexturesArray))
            console.log("Start Button error. Error assigning Textures!");
        button.assignShaderProgram(shaderProgram);
    }

    this.draw = function (movementMatrix) {
        var translation = vec3.fromValues(buttonPosition.x, buttonPosition.y, buttonPosition.z);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        if (!button.draw(translationMatrix))
            console.log("Start Button Drawing error!");
    }

    this.setPosition = function (position) {
        buttonPosition.x = position[0];
        buttonPosition.y = position[1];
        buttonPosition.z = position[2];
    }

    this.click = function (drums) {
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

                setTimeout(depressButton, 200);
            }
        } else if (currentGameState === gameState.Inactive) {
            window.currentGameState = window.gameState.Active;
        }
    }

    function depressButton() {
        buttonPosition.z += 0.05;
    }

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
    }

    this.isActive = function () {
        return active;
    }
}

function PowerButtonObject(glContext) {
    // Local storage variables and "constants"
    var gl = glContext;
    var button;
    var buttonPosition = { x: 0, y: 0, z: 0 };

    var vertArray = [];
    var texCoordsArray = [];
    var textureArray = [];
    var buttonTextures = [];

    var textureCoords = [
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ];

    var buttonVertices = [
        vec3.fromValues(0.15, 0.15, 0.1),
        vec3.fromValues(-0.15, 0.15, 0.1),
        vec3.fromValues(0.15, -0.15, 0.1),
        vec3.fromValues(-0.15, -0.15, 0.1)
    ];

    this.create = function (textureArray, shaderProgram) {
        buttonTextures = textureArray.slice();
        var currentTexturesArray = [];

        vertArray.push(buttonVertices);
        texCoordsArray.push(textureCoords);
        currentTexturesArray.push(textureArray[0]);

        button = new webgl.object3d(gl);
        if (!button.initGeometry(vertArray, texCoordsArray))
            console.log("Power Button error. Error initializing Geometry!");
        if (!button.assignTextures(currentTexturesArray))
            console.log("Power Button error. Error assigning Textures!");
        button.assignShaderProgram(shaderProgram);
    }

    this.draw = function (movementMatrix) {
        var translation = vec3.fromValues(buttonPosition.x, buttonPosition.y, buttonPosition.z);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        if (!button.draw(translationMatrix))
            console.log("Power Button Drawing error!");
    }

    this.setPosition = function (position) {
        buttonPosition.x = position[0];
        buttonPosition.y = position[1];
        buttonPosition.z = position[2];
    }

    this.click = function () {
        window.currentGameState = window.gameState.Inactive;
        window.numberValues.losses = 0;
        window.numberValues.wins = 0;
        window.numberValues.totalTurns = 0;
        window.numberValues.moneyWon = 0;
        window.numberValues.playerBet = 0;
        window.numberValues.playerMoney = 1000;

        buttonPosition.z -= 0.05;
        setTimeout(depressButton, 200);
    }

    function depressButton() {
        buttonPosition.z += 0.05;
    }
}

function ResetButtonObject(glContext) {
    // Local storage variables and "constants"
    var gl = glContext;
    var button;
    var buttonPosition = { x: 0, y: 0, z: 0 };

    var vertArray = [];
    var texCoordsArray = [];
    var textureArray = [];
    var buttonTextures = [];

    var textureCoords = [
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ];

    var buttonVertices = [
        vec3.fromValues(0.12, 0.12, 0.1),
        vec3.fromValues(-0.12, 0.12, 0.1),
        vec3.fromValues(0.12, -0.12, 0.1),
        vec3.fromValues(-0.12, -0.12, 0.1)
    ];

    this.create = function (textureArray, shaderProgram) {
        buttonTextures = textureArray.slice();
        var currentTexturesArray = [];

        vertArray.push(buttonVertices);
        texCoordsArray.push(textureCoords);
        currentTexturesArray.push(textureArray[0]);

        button = new webgl.object3d(gl);
        if (!button.initGeometry(vertArray, texCoordsArray))
            console.log("Reset Button error. Error initializing Geometry!");
        if (!button.assignTextures(currentTexturesArray))
            console.log("Reset Button error. Error assigning Textures!");
        button.assignShaderProgram(shaderProgram);
    }

    this.draw = function (movementMatrix) {
        var translation = vec3.fromValues(buttonPosition.x, buttonPosition.y, buttonPosition.z);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        if (!button.draw(translationMatrix))
            console.log("Reset Button Drawing error!");
    }

    this.setPosition = function (position) {
        buttonPosition.x = position[0];
        buttonPosition.y = position[1];
        buttonPosition.z = position[2];
    }

    this.click = function () {
        window.currentGameState = window.gameState.Active;
        window.numberValues.losses = 0;
        window.numberValues.wins = 0;
        window.numberValues.totalTurns = 0;
        window.numberValues.moneyWon = 0;
        window.numberValues.playerBet = 0;
        window.numberValues.playerMoney = 1000;

        buttonPosition.z -= 0.05;
        setTimeout(depressButton, 200);
    }

    function depressButton() {
        buttonPosition.z += 0.05;
    }
}

function LabelObject(glContext) {
    var gl = glContext;
    var label;
    var labelValue = "";
    var labelPosition = { x: 0, y: 0, z: 0 };
    var labelCharWidth = 0.05;
    var labelCharHeight = 0.10;

    var vertArray = [];
    var texCoordsArray = [];
    var textureArray = [];
    var letterTextures = {};

    var textureCoords = [
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ];

    var letterVertices = [
        vec3.fromValues((labelCharWidth / 2), (labelCharHeight / 2), 0.1),
        vec3.fromValues(-(labelCharWidth / 2), (labelCharHeight / 2), 0.1),
        vec3.fromValues((labelCharWidth / 2), -(labelCharHeight / 2), 0.1),
        vec3.fromValues(-(labelCharWidth / 2), -(labelCharHeight / 2), 0.1)
    ];

    this.create = function (textureObject, shaderProgram, labelText) {
        labelValue = labelText;
//        letterTextures = textureArray.slice();
        var currentTexturesArray = [];
        var transformationMatrix = mat4.create();
        var translation = vec3.create();
        var newXYZ = vec3.create();

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

//            var textureID = labelText.charCodeAt(i) - 'a'.charCodeAt(0);
//            currentTexturesArray.push(textureArray[textureID]);
            currentTexturesArray.push(textureObject[labelText.charAt(i)]);
        }

        label = new webgl.object3d(gl);
        if (!label.initGeometry(vertArray, texCoordsArray))
            console.log("Number error. Error initializing Geometry!");
        if (!label.assignTextures(currentTexturesArray))
            console.log("Number error. Error assigning Textures!");
        label.assignShaderProgram(shaderProgram);
    }

    this.draw = function (movementMatrix) {
        var translation = vec3.fromValues(labelPosition.x, labelPosition.y, labelPosition.z);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        if (!label.draw(translationMatrix))
            console.log("Number Drawing error!");
    }

    this.setPosition = function (position) {
        labelPosition.x = position[0];
        labelPosition.y = position[1];
        labelPosition.z = position[2];
    }

    this.setValue = function (value) {
        labelValue = value;

        var textureArray = [];
        for (var i = 0; i < labelValue.length; i++) {
            textureArray.push(digitTextures[parseInt(labelValue.charAt(i))]);
        }
        if (!label.assignTextures(textureArray))
            console.log("Label error. Error re-assigning new Textures!");

        return true;
    }
}

function NumberObject(glContext, size) {
    var gl = glContext;
    var number;
    var numberValue = 0;
    var digitCount = size;
    var numberPosition = { x: 0, y: 0, z: 0 };
    var numberDigitWidth = 0.05; //0.09;
    var numberDigitHeight = 0.1; //0.15;

    var vertArray = [];
    var texCoordsArray = [];
    var textureArray = [];
    var digitTextures = [];

    var textureCoords = [
      1.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      0.0, 0.0
    ];

    var digitVertices = [
        vec3.fromValues((numberDigitWidth / 2), (numberDigitHeight / 2), 0.1),
        vec3.fromValues(-(numberDigitWidth / 2), (numberDigitHeight / 2), 0.1),
        vec3.fromValues((numberDigitWidth / 2), -(numberDigitHeight / 2), 0.1),
        vec3.fromValues(-(numberDigitWidth / 2), -(numberDigitHeight / 2), 0.1)
    ];

    this.create = function (textureArray, shaderProgram) {
        digitTextures = textureArray.slice();
        var currentTexturesArray = [];
        var transformationMatrix = mat4.create();
        var translation = vec3.create();
        var newXYZ = vec3.create();

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

        number = new webgl.object3d(gl);
        if (!number.initGeometry(vertArray, texCoordsArray))
            console.log("Number error. Error initializing Geometry!");
        if (!number.assignTextures(currentTexturesArray))
            console.log("Number error. Error assigning Textures!");
        number.assignShaderProgram(shaderProgram);
    }

    this.draw = function (movementMatrix) {
        var translation = vec3.fromValues(numberPosition.x, numberPosition.y, numberPosition.z);
        var translationMatrix = mat4.create();
        mat4.translate(translationMatrix, movementMatrix, translation);

        if (!number.draw(translationMatrix))
            console.log("Number Drawing error!");
    }

    this.setPosition = function (position) {
        numberPosition.x = position[0];
        numberPosition.y = position[1];
        numberPosition.z = position[2];
    }

    this.setValue = function (value) {
        numberValue = value;

        var stringValue = value.toString();
        if (stringValue.length > digitCount) {
            return false;
        }
        stringValue = Array(digitCount - stringValue.length + 1).join("0") + stringValue;

        var textureArray = [];
        for (var i = 0; i < stringValue.length; i++) {
            textureArray.push(digitTextures[parseInt(stringValue.charAt(i))]);
        }
        if (!number.assignTextures(textureArray))
            console.log("Number error. Error re-assigning new Textures!");

        return true;
    }
}




















var gameState = {"Inactive": 0, "Active": 1, "Spinning": 2, "Lost": 3 };
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

var numberValues = { jackpot: 5000, playerBet: 0, playerMoney: 1000, moneyWon: 0, wins: 0, losses: 0, totalTurns: 0 };
//var playerBet = 0;


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
    stopButtonGreen: "img/stop_button_green_512.png",
    stopButtonRed:  "img/stop_button_red_512.png",
    colon:      "img/alphabet/alphabet_colon_256.png",
    space:      "img/alphabet/alphabet_space_256.png",
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
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);


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
                    drums[drum].reset();
                    offset += 2.1;
                }

                machine = new MachineObject(gl);
                machine.create([
                    loadedTextures.machine,
                    loadedTextures.machine,
                    loadedTextures.machine,
                    loadedTextures.machine
                ], shaderProgram);

                var buttonXOffset = -0.82
                var buttonYOffset = -0.69
                for (var i = 0; i < betButtonCount; i++) {
                    betButtons[i] = new ButtonObject(gl);
                    betButtons[i].create([loadedTextures[betButtonTextureNameList[i]]], shaderProgram);
                    if ((i % 2) == 0) {
                        betButtons[i].setPosition([buttonXOffset + 0.27 * parseInt(i / 2), buttonYOffset, 0.0]);
                    } else {
                        betButtons[i].setPosition([buttonXOffset + 0.27 * parseInt(i / 2), buttonYOffset - 0.18, 0.0]);
                    }
                    betButtons[i].setValue(betButtonValues[i]);
                }
                startButton = new StartButtonObject(gl);
                startButton.create([loadedTextures.startGreen, loadedTextures.startRed], shaderProgram);
                startButton.setPosition([0.70, -0.78, 0.0]);

                buttonXOffset = -0.56;
                buttonYOffset = -0.45;

                for (var i = 0; i < drumCount; i++) {
                    stopButtons[i] = new ButtonObject(gl);
                    stopButtons[i].create([loadedTextures.stopButtonGreen, loadedTextures.stopButtonRed], shaderProgram);
                    stopButtons[i].setPosition([buttonXOffset + 0.28 * i, buttonYOffset, 0.0]);
                    stopButtons[i].activate(false);
                }

                powerButton = new PowerButtonObject(gl);
                powerButton.create([loadedTextures.powerButton], shaderProgram);
                powerButton.setPosition([0.88, 0.0, 0.0]);

                resetButton = new ResetButtonObject(gl);
                resetButton.create([loadedTextures.resetButton], shaderProgram);
                resetButton.setPosition([-0.88, 0.0, 0.0]);

                // Create the charset list object
                var textureList = {};
                var character;
                for (var i = 0; i < alphabetTextureNameList.lowercase.length; i++) {
                    character = String.fromCharCode('a'.charCodeAt(0) + i);
                    textureList[character] = loadedTextures[alphabetTextureNameList.lowercase[i]];

                    character = String.fromCharCode('A'.charCodeAt(0) + i);
                    textureList[character] = loadedTextures[alphabetTextureNameList.uppercase[i]];
                }
                textureList[":"] = loadedTextures.colon;
                textureList[" "] = loadedTextures.space;

                labels["welcome"] = new LabelObject(gl);
                labels["welcome"].create(textureList, shaderProgram, "Welcome to the Awesome Slot Machine");
                labels["welcome"].setPosition([-0.9, 0.7, 0]);

                labels["madeBy"] = new LabelObject(gl);
                labels["madeBy"].create(textureList, shaderProgram, "Created by Konstantin Koton");
                labels["madeBy"].setPosition([-0.7, -0.7, 0]);

                labels["jackpot"] = new LabelObject(gl);
                labels["jackpot"].create(textureList, shaderProgram, "Jackpot:");
                labels["jackpot"].setPosition([-0.95, 0.95, 0]);

                labels["playerMoney"] = new LabelObject(gl);
                labels["playerMoney"].create(textureList, shaderProgram, "Player Money:");
                labels["playerMoney"].setPosition([-0.95, 0.8, 0]);

                labels["playerBet"] = new LabelObject(gl);
                labels["playerBet"].create(textureList, shaderProgram, "Bet:");
                labels["playerBet"].setPosition([-0.95, 0.65, 0]);

                labels["moneyWon"] = new LabelObject(gl);
                labels["moneyWon"].create(textureList, shaderProgram, "Won:");
                labels["moneyWon"].setPosition([-0.95, 0.5, 0]);

                labels["totalTurns"] = new LabelObject(gl);
                labels["totalTurns"].create(textureList, shaderProgram, "Turns:");
                labels["totalTurns"].setPosition([0.3, 0.8, 0]);

                labels["wins"] = new LabelObject(gl);
                labels["wins"].create(textureList, shaderProgram, "Wins:");
                labels["wins"].setPosition([0.3, 0.65, 0]);

                labels["losses"] = new LabelObject(gl);
                labels["losses"].create(textureList, shaderProgram, "Losses:");
                labels["losses"].setPosition([0.3, 0.5, 0]);

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
                numbers["jackpot"] = new NumberObject(gl, 10);
                numbers["jackpot"].create(digitTextureList, shaderProgram);
                numbers["jackpot"].setPosition([-0.5, 0.95, 0]);

                numbers["playerMoney"] = new NumberObject(gl, 6);
                numbers["playerMoney"].create(digitTextureList, shaderProgram);
                numbers["playerMoney"].setPosition([-0.25, 0.8, 0]);

                numbers["playerBet"] = new NumberObject(gl, 6);
                numbers["playerBet"].create(digitTextureList, shaderProgram);
                numbers["playerBet"].setPosition([-0.5, 0.65, 0]);

                numbers["moneyWon"] = new NumberObject(gl, 10);
                numbers["moneyWon"].create(digitTextureList, shaderProgram);
                numbers["moneyWon"].setPosition([-0.5, 0.5, 0]);

                numbers["totalTurns"] = new NumberObject(gl, 5);
                numbers["totalTurns"].create(digitTextureList, shaderProgram);
                numbers["totalTurns"].setPosition([0.7, 0.8, 0]);

                numbers["wins"] = new NumberObject(gl, 5);
                numbers["wins"].create(digitTextureList, shaderProgram);
                numbers["wins"].setPosition([0.7, 0.65, 0]);

                numbers["losses"] = new NumberObject(gl, 5);
                numbers["losses"].create(digitTextureList, shaderProgram);
                numbers["losses"].setPosition([0.7, 0.5, 0]);


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

        if (currentGameState == gameState.Active) {
            if (numberValues.playerBet === 0) {
                startButton.activate(false);
            } else {
                startButton.activate();
            }
        }
        if (currentGameState == gameState.Spinning) {
            testWin();
        }
    }

    function drawScene() {
        /* SET PERSPECTIVE AND TRANSLATION*/
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(pMatrix, (60 * Math.PI) / 180, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

        mat4.identity(mvMatrix);

        vec3.set(translation, 0.0, 0.0, -14.0);
        mat4.translate(mvMatrix, mvMatrix, translation);


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
            for (var i = 0; i < stopButtons.length; i++) {
                stopButtons[i].draw(mvMatrix);
            }

            // Draw the labels
            $.each(labels, function (index) {
                if ((index != "welcome") && (index != "madeBy")) {
                    this.draw(mvMatrix);
                }
            });

            // Draw the numbers
            $.each(numbers, function (index) {
                this.setValue(numberValues[index]);
                this.draw(mvMatrix);
            });
        }
    }

    function testWin() {
        var stopped = true;
        var result = [];

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
        if (stopped) {
            currentGameState = gameState.Active;
//            console.log(result.join(" - "));
            console.log("Multiplier: " + determineMultiplier(result));
            var multiplier = determineMultiplier(result);
            if (multiplier !== 0) {
                window.numberValues.moneyWon = window.numberValues.playerBet * multiplier;
                window.numberValues.playerMoney += window.numberValues.moneyWon;
                window.numberValues.wins++;

                if (isJackpot(result)) {
                    window.numberValues.playerMoney += window.numberValues.jackpot;
                    window.numberValues.moneyWon += window.numberValues.jackpot;
                    window.numberValues.jackpot = 0;
                }
            } else {
                window.numberValues.losses++;
            }
            window.numberValues.playerBet = 0;
        }
    }



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

        // Betting Button rectangles, only check if game is in "Active" state
        if (currentGameState === gameState.Active) {
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
        }


        // Stop Button rectangles, only test if game is in the "Spinning" state
        if (currentGameState === gameState.Spinning) {
            var startXOffset = 516;
            var startYOffset = 600;
            for (var i = 0; i < stopButtons.length; i++) {
                if (((mouse.x > startXOffset + 116 * i) && (mouse.x < (startXOffset + 106) + 116 * i))
                                    && ((mouse.y > startYOffset) && (mouse.y < startYOffset + 66))) {
                    if (stopButtons[i].isActive()) {
                        stopButtons[i].click();
                        drums[i].stop();
                    }
                }
            }
        }

        // Start Button rectangle, only test if game is in the "Active" state
        if (currentGameState === gameState.Active) {
            if (((mouse.x > 976) && (mouse.x < 1197)) && ((mouse.y > 699) && (mouse.y < 839))) {
                if (startButton.isActive()) {
                    startButton.click(drums);
                    for (var i = 0; i < stopButtons.length; i++) {
                        stopButtons[i].activate();
                    }
                }
            }
        } else if (currentGameState === gameState.Inactive) {
            // Start Button rectangle, only test if game is in the "Inactive" state
            if (((mouse.x > 700) && (mouse.x < 902)) && ((mouse.y > 387) && (mouse.y < 501))) {
                // Start the game
                startButton.click();
            }
        }

        // Reset Button rectangle
        if (((mouse.x > 390) && (mouse.x < 485)) && ((mouse.y > 396) && (mouse.y < 495))) {
            resetButton.click();

            // After resetting all the values, stop all the drums and reset the stop buttons as well
            for (var drum = 0; drum < drums.length; drum++) {
                drums[drum].reset();
                stopButtons[drum].activate(false);
            }
        }

        // Power Button rectangle
        if (((mouse.x > 1110) && (mouse.x < 1210)) && ((mouse.y > 392) && (mouse.y < 503))) {
            // Reset all values
            powerButton.click();

            // Stop all drums, and reset the stop buttons
            for (var drum = 0; drum < drums.length; drum++) {
                drums[drum].reset();
                stopButtons[drum].activate(false);
            }
        }

//        alert("X: " + mouse.x + "\nY: " + mouse.y);
    });
});

$("canvas").click(function () {
    var $this = $(this);
    $this.css("cursor", "url('../img/pointerDown.cur'), auto");
    setTimeout(function () {
        $this.css("cursor", "");
    }, 200);
});






