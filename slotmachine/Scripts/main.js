/// <reference path="jquery.js" />
/// <reference path="webgl-main.js" />


var playerMoney = 1000;
var winnings = 0;
var jackpot = 5000;
var turn = 0;
var playerBet = 0;
var winNumber = 0;
var lossNumber = 0;
var spinResult;
var fruits = "";
var winRatio = 0;
var grapes = 0;
var bananas = 0;
var oranges = 0;
var cherries = 0;
var bars = 0;
var bells = 0;
var sevens = 0;
var blanks = 0;

/* Utility function to show Player Stats */
function showPlayerStats() {
    winRatio = winNumber / turn;
    $("#jackpot").text("Jackpot: " + jackpot);
    $("#playerMoney").text("Player Money: " + playerMoney);
    $("#playerTurn").text("Turn: " + turn);
    $("#playerWins").text("Wins: " + winNumber);
    $("#playerLosses").text("Losses: " + lossNumber);
    $("#playerWinRatio").text("Win Ratio: " + (winRatio * 100).toFixed(2) + "%");
}

/* Utility function to reset all fruit tallies */
function resetFruitTally() {
    grapes = 0;
    bananas = 0;
    oranges = 0;
    cherries = 0;
    bars = 0;
    bells = 0;
    sevens = 0;
    blanks = 0;
}

/* Utility function to reset the player stats */
function resetAll() {
    playerMoney = 1000;
    winnings = 0;
    jackpot = 5000;
    turn = 0;
    playerBet = 0;
    winNumber = 0;
    lossNumber = 0;
    winRatio = 0;
}

/* Check to see if the player won the jackpot */
function checkJackPot() {
    /* compare two random values */
    var jackPotTry = Math.floor(Math.random() * 51 + 1);
    var jackPotWin = Math.floor(Math.random() * 51 + 1);
    if (jackPotTry == jackPotWin) {
        alert("You Won the $" + jackpot + " Jackpot!!");
        playerMoney += jackpot;
        jackpot = 1000;
    }
}

/* Utility function to show a win message and increase player money */
function showWinMessage() {
    playerMoney += winnings;
    $("div#winOrLose>p").text("You Won: $" + winnings);
    resetFruitTally();
    checkJackPot();
}

/* Utility function to show a loss message and reduce player money */
function showLossMessage() {
    playerMoney -= playerBet;
    $("div#winOrLose>p").text("You Lost!");
    resetFruitTally();
}

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
        case checkRange(outcome, 1, 25):  // 41.5% probability  // 25%
            result = drumTextureNameList.indexOf("blanks");
            break;
        case checkRange(outcome, 26, 50): // 15.4% probability  // 25%
            result = drumTextureNameList.indexOf("grapes");
            break;
        case checkRange(outcome, 51, 65): // 13.8% probability  // 15%
            result = drumTextureNameList.indexOf("bananas");
            break;
        case checkRange(outcome, 66, 77): // 12.3% probability  // 12%
            result = drumTextureNameList.indexOf("oranges");
            break;
        case checkRange(outcome, 78, 85): //  7.7% probability  // 8%
            result = drumTextureNameList.indexOf("cherries");
            break;
        case checkRange(outcome, 86, 92): //  4.6% probability  // 7%
            result = drumTextureNameList.indexOf("bars");
            break;
        case checkRange(outcome, 93, 97): //  3.1% probability  // 5%
            result = drumTextureNameList.indexOf("bells");
            break;
        case checkRange(outcome, 98, 100): //  1.5% probability // 3%
            result = drumTextureNameList.indexOf("sevens");
            break;
    }
    return result;
}

/* 
 * Utility function to determine if the roll resulted in jackpot.
 * To win the jackpot, must have 3 sevens on the bet line with no blanks.
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

/* This function calculates the player's win multiplier, if any */
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


function determineWinnings2() {
    if (blanks == 0) {
        if (grapes == 3) {
            winnings = playerBet * 10;
        }
        else if (bananas == 3) {
            winnings = playerBet * 20;
        }
        else if (oranges == 3) {
            winnings = playerBet * 30;
        }
        else if (cherries == 3) {
            winnings = playerBet * 40;
        }
        else if (bars == 3) {
            winnings = playerBet * 50;
        }
        else if (bells == 3) {
            winnings = playerBet * 75;
        }
        else if (sevens == 3) {
            winnings = playerBet * 100;
        }
        else if (grapes == 2) {
            winnings = playerBet * 2;
        }
        else if (bananas == 2) {
            winnings = playerBet * 2;
        }
        else if (oranges == 2) {
            winnings = playerBet * 3;
        }
        else if (cherries == 2) {
            winnings = playerBet * 4;
        }
        else if (bars == 2) {
            winnings = playerBet * 5;
        }
        else if (bells == 2) {
            winnings = playerBet * 10;
        }
        else if (sevens == 2) {
            winnings = playerBet * 20;
        }
        else if (sevens == 1) {
            winnings = playerBet * 5;
        }
        else {
            winnings = playerBet * 1;
        }
        winNumber++;
        showWinMessage();
    }
    else {
        lossNumber++;
        showLossMessage();
    }
}

/* When the player clicks the spin button the game kicks off */
$("#spinButton").click(function () {
    playerBet = $("div#betEntry>input").val();

    if (playerMoney == 0) {
        if (confirm("You ran out of Money! \nDo you want to play again?")) {
            resetAll();
            showPlayerStats();
        }
    }
    else if (playerBet > playerMoney) {
        alert("You don't have enough Money to place that bet.");
    }
    else if (playerBet < 0) {
        alert("All bets must be a positive $ amount.");
    }
    else if (playerBet <= playerMoney) {
        spinResult = Reels();
        fruits = spinResult[0] + " - " + spinResult[1] + " - " + spinResult[2];
        $("div#result>p").text(fruits);
        determineWinnings();
        turn++;
        showPlayerStats();
    }
    else {
        alert("Please enter a valid bet amount");
    }
});
