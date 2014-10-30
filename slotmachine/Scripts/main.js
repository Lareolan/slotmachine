/// <reference path="jquery.js" />
/**
 * This file contains game initialization code, mouse input code, and various helper functions and win logic.
 * Author:              Konstantin Koton
 * Filename:            main.js
 * Last Modified By:    Konstantin Koton
 * Date Last Modified:  Oct. 15, 2014
 * Revision History:    Too numerous to mention
 */

/* Utility function to check if a value falls within a range of bounds */
function checkRange(value, lowerBounds, upperBounds) {
    if ((value >= lowerBounds) && (value <= upperBounds)) {
        return value;
    }
    else {
        return !value;
    }
}

/*
 * When this function is called it determines the result of a single reel/drum.
 * @returns The result of the drum spin
 */
function getSpinResult() {
    var outcome;
    var result;

    outcome = Math.floor((Math.random() * 100) + 1);
    switch (outcome) {
        case checkRange(outcome, 1, 25):  // 25% probability
            result = drumTextureNameList.indexOf("blanks");
            break;
        case checkRange(outcome, 26, 50): // 25% probability
            result = drumTextureNameList.indexOf("grapes");
            break;
        case checkRange(outcome, 51, 65): // 15% probability
            result = drumTextureNameList.indexOf("bananas");
            break;
        case checkRange(outcome, 66, 77): // 12% probability
            result = drumTextureNameList.indexOf("oranges");
            break;
        case checkRange(outcome, 78, 85): // 8% probability
            result = drumTextureNameList.indexOf("cherries");
            break;
        case checkRange(outcome, 86, 92): // 7% probability
            result = drumTextureNameList.indexOf("bars");
            break;
        case checkRange(outcome, 93, 97): // 5% probability
            result = drumTextureNameList.indexOf("bells");
            break;
        case checkRange(outcome, 98, 100): // 3% probability
            result = drumTextureNameList.indexOf("sevens");
            break;
    }
    return result;
}

/* 
 * Utility function to determine if the roll resulted in jackpot.
 * To win the jackpot, must have 3 sevens on the bet line with no blanks.
 * @param results An array containing the results of the roll
 * @returns True if results in jackpot, else returns false
 */
function isJackpot(results) {
    var sevens = 0;

    if ($.inArray("blanks", results) !== -1) {
        return false;
    }

    for (var i = 0; i < results.length; i++) {
        if (results[i] == "sevens") {
                sevens++;
        }
    }
    return (sevens >= 3);
}

/**
 * This function calculates the player's total win multiplier, if any
 * @param results An array containing the results of the roll
 * @returns The final multiplier
 */
function determineMultiplier(results) {
    var finalMultiplier = 0;
    var multiplier = 0;
    var count = 1;

    if ($.inArray("blanks", results) !== -1) {
        return 0;
    }

    var item = results[0];
    multiplier = getMultiplier(item);
    for (var i = 1; i < results.length; i++) {
        if (item === results[i]) {
            count++;
        } else {
            finalMultiplier += multiplier * Math.pow(count, 2);
            count = 1;
            item = results[i];
            multiplier = getMultiplier(item);
        }
    }
    finalMultiplier += multiplier * Math.pow(count, 2);

    return finalMultiplier;
}

/**
 * This function returns the multiplier value of a given result
 * @param item The result which we want to find the multiplier for
 * @returns The multiplier value of a given result
 */
function getMultiplier(item) {
    var result;
    switch (item) {
        case "grapes":
            result = 1;
            break;
        case "bananas":
            result = 2;
            break;
        case "oranges":
            result = 3;
            break;
        case "cherries":
            result = 4;
            break;
        case "bars":
            result = 5;
            break;
        case "bells":
            result = 6;
            break;
        case "sevens":
            result = 10;
            break;
    }
    return result;
}

/**
 * This anonymous callback function executes once the DOM finished loading.
 */
$(document).ready(function () {
    // Initiate the game
    webGLStart();

    var wgl = new WebGL();

    wgl.loadTextures(textureURLs /*{ test: "img/test_button_512.jpg" }*/, function () {
        alert("loaded");
    });

    // Mouse click handler for the canvas, outlining the click rectangles for all the buttons in the game
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

        // Finally change the custom cursor to the down pointer on click for 0.1 seconds,
        // then reset it back to default mouse cursor.
        var $this = $(this);
        $this.css("cursor", "url('../img/pointerDown.cur'), auto");
        setTimeout(function () {
            $this.css("cursor", "");
        }, 100);
    });
});



