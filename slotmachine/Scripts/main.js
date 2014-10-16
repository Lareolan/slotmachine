/// <reference path="jquery.js" />
/**
 * This file contains various helper functions and win logic.
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


