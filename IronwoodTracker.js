// ==UserScript==
// @name         Ironwood Tracker
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Tracks useful skilling stats in Ironwood RPG
// @author       Des
// @match        https://ironwoodrpg.com/*
// @icon         https://github.com/Desperer/IronwoodScripts/blob/main/icon/IronwoodSword.png?raw=true
// @grant        none
// @license      MIT
// ==/UserScript==

//let startingXp = document.querySelector(".exp").innerText;

//let startingXp = parseXp('Stats\nDefense XP\n1,557,786 XP');
//let startingXp = "" + document.querySelectorAll(".card")[2].innerText
//let startingXp = parseXp(document.querySelector(".exp").innerText);

//Variables you can change
var timeInterval = 2*1000; // Default timeInterval 3*1000 = 3 seconds, this is the time between stat box refreshes

//Variables you should not change yet
var boxToggleState = true; // Default true makes the stat box display on pageload, false would keep it hidden on startup but is not yet implemented properly
var isRunning = false; // Tracker requires manual click to start as there is not yet functionality for checking if the page is fully loaded before starting

//Messages to display
const loadingText = 'Loading...';
const startingText = 'Click &#8634; to start tracking';
const redirectText = 'Tracking progress is saved in the background.<br>Go back to the tracked skill page to view details.';
const unavailableText = 'This page cannot be tracked.<br>Please try again.';

const blacklistedPages = ['Inventory', 'Equipment', 'House', 'Merchant', 'Market', 'Quests', 'Leaderboards', 'Changelog',
                          'Settings', 'Discord', 'Reddit', 'Patreon', 'Rules', 'Terms of Use', 'Privacy Policy'];

const cardList = document.getElementsByClassName('card');

//instantiate variables for tracker
var hasRun = 'false';
//var currentSkill = '';
//var startingXp, currentXp = 0;
//var startingConsumables, consumables = {};
//var startingFood, currentFood = 0;
//var startingPot, currentPot = 0;
//var startingArrows, currentArrows = 0;
//var startingCoins, currentCoins = 0;
//var startTime = new Date();

const trackedSkill = {
    name: '',
    startingXp: 0,
    currentXp: 0,
    startingFood: 0,
    currentFood: 0,
    startingPots: 0,
    currentPots: 0,
    startingArrows: 0,
    currentArrows: 0,
    startingCoins: 0,
    currentCoins: 0,
    startTime: new Date(),

    reset: function() {
        this.name = '';
        this.startingXp = 0;
        this.currentXp = 0;
        this.startingFood = 0;
        this.currentFood = 0;
        this.startingPots = 0;
        this.currentPots = 0;
        this.startingArrows = 0;
        this.currentArrows = 0;
        this.startingCoins = 0;
        this.currentCoins = 0;
        this.startTime = new Date();
    }

};


function resetTracker(){ //Reset all stats in the tracker
    trackedSkill.reset();
    let currentSkill = getCurrentSkill();
    if (checkAllowedSkill(currentSkill)) {
        trackedSkill.name = getCurrentSkill();
        box.innerHTML = loadingText;
        isRunning = true;
        hasRun = true;
    }
    else {
        box.innerHTML = unavailableText;
        setTimeout(function() { box.innerHTML = startingText;}, 2000);
    }
}

function hideTracker(){ //minimize the tracker UI
    if (boxToggleState == true) {
        box.parentNode.removeChild( box );
        boxToggleState = false;
    }
    else {
        document.body.appendChild( box );
        boxToggleState = true;
        if (isRunning == true) {
            box.innerHTML = loadingText;
        }
        else{
            box.innerHTML = startingText;
        }

    }
}

function checkAllowedSkill (skill) { //return true if the skill is a valid skill (not blacklisted menu options)
    if (blacklistedPages.includes(skill)){
        return false;
    }
    else {
        return true;
    }
}

function getCurrentSkill() { //Return the name of the skill currently in view
    return document.getElementsByClassName('title')[0].innerText;
}


function removeCommas (string) { //Remove commas from a string and return it as a number
    return Number(string.replace(/,/g,""));
}

function groupArr(data, n) { //Split an array into a 2d array, 3 items each
    var group = [];
    for (var i = 0, j = 0; i < data.length; i++) {
        if (i >= n && i % n === 0){
            j++;
        }
        group[j] = group[j] || [];
        group[j].push(data[i])
    }
    return group;
}

function splitConsumables (list) { //Loop through a 2d array of consumables generated by groupArr(), parse necessary values, then return them properly formatted
    //console.info("splitConsumables: " + trackedSkill.name + list);
    for (let i = 0; i <= list.length-1; i++) {
        //        console.log("i" + list[i]);
        //        console.log("i0" + list[i][0]);
        if (list[i][0].includes('Potion')) {
            trackedSkill.currentPots = removeCommas(list[i][1]);
            //console.info("Set currentPots to " + trackedSkill.currentPots);
            if (trackedSkill.startingPots == 0){
                trackedSkill.startingPots = trackedSkill.currentPots;
            }
        }
        else if (list[i][2].includes('HP')) {
            trackedSkill.currentFood = removeCommas(list[i][1]);
            //console.info("Set currentFood to " + trackedSkill.currentFood);
            if (trackedSkill.startingFood == 0){
                trackedSkill.startingFood = trackedSkill.currentFood;
            }
        }
        else if (list[i][0].includes('Arrow')) {
            trackedSkill.currentArrows = removeCommas(list[i][1]);
            //console.info("Set currentArrows to " + trackedSkill.currentArrows);
            if (trackedSkill.startingArrows == 0){
                trackedSkill.startingArrows = trackedSkill.currentArrows;
            }
        }
    }
}

function parseCards(){ //Find all cards, parse necessary values, then store them properly formatted
    //console.log('parseCards: ' + trackedSkill.name);
    for (let i = 0; i < cardList.length; i++){
        //console.log(i);
        //console.log(cardList[i].innerText);
        let cardText = cardList[i].innerText.split('\n');
        //console.info(cardText);

        //Get coin count from Loot card
        if (cardText[0] == 'Loot'){
            if (cardText[1] == 'Coins'){
                trackedSkill.currentCoins = removeCommas(cardText[2]);
                //console.info("Set currentCoins to " + trackedSkill.currentCoins);
                //console.info('coins: ' + currentCoins);
                if (trackedSkill.startingCoins == 0){
                    trackedSkill.startingCoins = trackedSkill.currentCoins;
                }
            }
        }
        //Get food, arrow, potion count from Consumables card
        else if (cardText[0] == 'Consumables'){
            splitConsumables(groupArr(cardText.slice(1), 3));
            //console.info('consumables:' + consumables);

        }
        //Get skill xp from Stats card
        else if (cardText[0] == 'Stats'){
            trackedSkill.currentXp = removeCommas(cardText[cardText.length-1].slice(0, -3));
            //console.info("Set currentXp to " + trackedSkill.currentXp);
            //console.info('xp: ' + currentXp);
            if (trackedSkill.startingXp == 0){
                trackedSkill.startingXp = trackedSkill.currentXp;
            }
        }
    }
    return;
}


function trackerLoop() {
    let currentSkill = getCurrentSkill();

    if (isRunning == true && boxToggleState == true && checkAllowedSkill(currentSkill)) {
        if (trackedSkill.name == currentSkill) {
            parseCards();
            displayBox();
        }
        else {
            displayBoxInactive();
        }

    }
}


function displayBox() {
    //console.log('displayBox: ' + trackedSkill.name);
    let currentSkill = getCurrentSkill();

    let elapsedTimeSecs = ((Math.trunc((Date.now() - (trackedSkill.startTime))/1000)) % 60).toString().padStart(2, '0'); //seconds since last minute interval, for the display timer
    let elapsedTimeMins = ((Date.now() - trackedSkill.startTime)/1000/60); //elapsed time in minutes for calc
    let elapsedTimeHours = ((Date.now() - trackedSkill.startTime)/1000/60/60); //elapsed time in minutes for calc
    let formattedTimeMins = Math.trunc(elapsedTimeMins); //elapsed time in minutes but formatted for display
    //    console.log(trackedSkill.currentXp);
    let earnedXp = trackedSkill.currentXp - trackedSkill.startingXp;
    let xpPerMinute = Math.floor(earnedXp/elapsedTimeMins);
    let xpPerHour = Math.floor(earnedXp/elapsedTimeHours);

    let usedArrows = trackedSkill.startingArrows - trackedSkill.currentArrows;
    let arrowsPerHour = Math.floor(usedArrows/elapsedTimeHours);

    let usedFood = trackedSkill.startingFood - trackedSkill.currentFood;
    let foodPerHour = Math.floor(usedFood/elapsedTimeHours);

    let earnedCoins = trackedSkill.currentCoins - trackedSkill.startingCoins;
    let coinsPerHour = Math.floor(earnedCoins/elapsedTimeHours);

    let usedPots = trackedSkill.startingPots - trackedSkill.currentPots;



    //        console.log(elapsedTimeMins);

    // If on correct skill page, show full details
    if (currentSkill == trackedSkill.name && isRunning == true) {
        box.innerHTML =
            //            '<img src="assets/misc/defense.png" width="10" height="10">' +
            '<b>' + trackedSkill.name + " - " + formattedTimeMins + ':' + elapsedTimeSecs + '</b><hr>' +
            'XP earned: ' + earnedXp.toLocaleString('en') + ' (' + xpPerHour.toLocaleString('en') +'/h)<br>' +
            'Coins earned: ' + earnedCoins.toLocaleString('en') + ' (' + coinsPerHour.toLocaleString('en') +'/h)<br>' +
            "Food used: " + usedFood.toLocaleString('en') + ' (' + foodPerHour.toLocaleString('en') +'/h)<br>' +
            "Arrows used: " + usedArrows.toLocaleString('en') + ' (' + arrowsPerHour.toLocaleString('en') +'/h)<br>' +
            //"Potions used: " + usedPots.toLocaleString('en') + '<br>'
            //            "<hr>XP/h: " + xpPerHour.toLocaleString('en') + '<br>' +
            //            "Coins/h: " + coinsPerHour.toLocaleString('en') + '<br>' +
            //            "Food/h: " + foodPerHour.toLocaleString('en') + '<br>' +
            //            "Arrows/h: " + arrowsPerHour.toLocaleString('en') + '<br>' +
            ' ';
    }
}

function displayBoxInactive() { // If on incorrect skill page, show background acitvity
    let elapsedTimeSecs = ((Math.trunc((Date.now() - (trackedSkill.startTime))/1000)) % 60).toString().padStart(2, '0'); //seconds since last minute interval, for the display timer
    let elapsedTimeMins = ((Date.now() - trackedSkill.startTime)/1000/60); //elapsed time in minutes for calc
    let formattedTimeMins = Math.trunc(elapsedTimeMins); //elapsed time in minutes but formatted for display

    box.innerHTML = '<b>' + trackedSkill.name + " - " + Math.trunc(elapsedTimeMins) + ':' + elapsedTimeSecs + '</b><br>' + redirectText;

}

setInterval(trackerLoop, timeInterval); //Recurring stat box updater


/*
------------------------
All UI components below
------------------------
*/

//Button style format
let buttonStyle =
    ' background: #061A2E;' +
    ' padding: 2px;' +
    ' padding-left: 6px;' +
    ' padding-right: 6px;' +
    ' font-size: 16px;' +
    ' display: inline-block;' +
    ' text-align: center;' +
    'max-height: 32px;' +
    'box-sizing: content-box;' +
    'margin: 0px;' +
    'float: left;' +
    'line-height: 1.2;' +
    'user-select: none;' +
    'max-width: 80px;' ;

//Floating box style format
let boxStyle =
    ' background: #0D2234;' +
    ' border: 2px solid #767672;' +
    ' padding: 4px;' +
    ' border-radius: 5px;' +
    ' position: fixed;' +
    ' opacity: .6;' +
    ' float: right;' +
    ' object-fit: none;' +
    ' max-width: 400px;' ;

//Box for stats
var box = document.createElement( 'div' );
document.body.appendChild( box );
box.style.cssText = boxStyle;
box.style.minWidth = '200px';
box.innerHTML = 'Click &#8634; to start tracking';
box.style.bottom = '43px';
box.style.right = '24px';
document.body.appendChild( box );

//Box for buttons
var box2 = document.createElement( 'div' );
box2.style.cssText = boxStyle;
box2.style.bottom = '4px';
box2.style.right = '24px';
document.body.appendChild( box2 );

//Button to minimize tracker
var closeButton = document.createElement( 'div' );
closeButton.innerHTML = '&#9776;';
closeButton.style.cssText = buttonStyle;
box2.insertBefore( closeButton, box2.firstChild );
closeButton.addEventListener("click", function(){ hideTracker(); });

//Button to reset tracker stats
var resetButton = document.createElement( 'div' );
resetButton.innerHTML = '&#8634;';
resetButton.style.cssText = buttonStyle;
box2.insertBefore( resetButton, closeButton );
resetButton.addEventListener("click", function(){ resetTracker(); });
