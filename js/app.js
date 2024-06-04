const loginForm = document.getElementById('login-form');
const logNameEl = document.getElementById('loginName');

import { lang } from './wordsArray.js';
import {
  closeOnClickOrKey,
  sleep,
  checkLimit,
  showWinnerComment,
  showLoserComment,
  countOccurency } from "./helperFunctions.js";

const date = new Date().toLocaleDateString().slice(0, 21);

let manualDisplay = false;

let userLoggedIn;
let session;
let users = {};
let langArray;
let word, wordOrig;
let limit;

let userInput = "";
let round = 1;

const minLength = 4;
const maxLength = 8;

const myLangs = {
  de1: "de1",
  de2: "de2",
  en1: "en1",
  lat: "lat"
}

// check session and local storage
if (sessionStorage.getItem("userSession")) {
  session = JSON.parse(sessionStorage.getItem("userSession"));
}

if (localStorage.getItem('users')) {
  users = JSON.parse(localStorage.getItem("users"));
}

let displayNav = false;
$('#burger-menu').click(() => {
  $('.burger-section').css('display', displayNav ? 'none' : 'flex');
  displayNav = !displayNav;
})

$(document).click((e) => {
  if (e.target.id !== 'burger-menu' && e.target.id !== 'settings' && e.target.id !== 'statistics') {
    $('.burger-section').css('display', 'none');
    displayNav = false;
  }
})

// Start Session
function startSession() {
  if (!sessionStorage.getItem("userSession")) {
    login();
  } else {
    session = JSON.parse(sessionStorage.getItem("userSession"));
    userLoggedIn = session.name;
    langArray = lang[users[userLoggedIn].lang]
    let num_letters = users[userLoggedIn].num_letters
    if (num_letters !== 0) {
      langArray = langArray.filter((word) => {
        return word.length === num_letters;
      })
    }
    const rank = getRanking(userLoggedIn);
    const langSetting = users[userLoggedIn].lang;
    let letterSetting = num_letters;

    if (users[userLoggedIn].num_letters === 0) {
      letterSetting = "Zufall"
    }
    $(".player").text(userLoggedIn);
    $(".player-highscore").text(`${rank}. Platz`);
    $(".player-settings").html(`Sprache: <strong>${langSetting}</strong> | Buchstaben: <strong>${letterSetting}</strong>`);
    $(".login-modal").css("display", "none");
    game();
  }
}

$('.settings').click(() => {
  $('.settings-modal').css("display", "flex");
  for (let i = minLength; i <= maxLength; i++) {
    if (users[userLoggedIn].num_letters === i) {
      $('#num-letter').append(`<option name="letters${i}" value="${i}" selected>${i}</option>`);
    } else {
      $('#num-letter').append(`<option name="letters${i}" value="${i}">${i}</option>`);
    }
  }
  Object.keys(myLangs).forEach((lang) => {
    if (users[userLoggedIn].lang === lang) {
      $('#lang-select').append(`<option value="${lang}" selected>${myLangs[lang]}</option>`);
    } else {
      $('#lang-select').append(`<option value="${lang}">${myLangs[lang]}</option>`);
    }
  })
  $('#settings-abort').click(() => {
    $('.settings-modal').css("display", "none");
    location.reload();
    return false;
  })
});

$('#settings-form').submit((e) => {
  e.preventDefault();
  const newLang = $('#lang-select').val();
  const newNumLetters = parseInt($('#num-letter').val());
  users[userLoggedIn].lang = newLang;
  users[userLoggedIn].num_letters = newNumLetters;
  console.log(newLang, newNumLetters);
  localStorage.setItem("users", JSON.stringify(users));
  location.reload();
})

// Login
function login() {
  $(".login-modal").css("display", "flex");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const date = new Date().toLocaleDateString("de-De");

    if (!logNameEl.value) {
      $("#errorMessage").text("Bitte gib einen Namen an.");
      // $("#errorMessage2").text("Button oben drücken!");
      return false;
    }
    if (!users[logNameEl.value]) {
      users[logNameEl.value] = {
        name: logNameEl.value,
        total_score: 0,
        total_plays: 0,
        date: date,
        scores: [],
        lang: "de1",
        num_letters: 0
      };
      localStorage.setItem("users", JSON.stringify(users));
    }

    sessionStorage.setItem("userSession", JSON.stringify({name: logNameEl.value}));
    startSession();
  });
}

startSession();

// User input Keyboard
$(document).on("keydown", function (e) {
	insertLetter(e.key);
});

// User input touch, click
$(".abc").on("click", function () {
	if (this.innerHTML.slice(23, 28) === "enter") {
		insertLetter("Enter")
	} else if (this.innerHTML.slice(23, 27) === "back") {
		insertLetter("Backspace")
	} else {
		insertLetter(this.innerHTML)
	}
});

// get random word
function game() {
  if (users[userLoggedIn].total_plays === 0) {
    $('.hideable').addClass('hide')
  } else {
    $('.hideable').removeClass('hide')
  }
  let rand = Math.floor(Math.random() * langArray.length);
  wordOrig = langArray[rand];
	word = wordOrig.toLowerCase();
  limit = word.length;

  checkLimit(limit);
}

//  Last guess was worng
function lastRound(guess) {
	const guessArray = guess.toLowerCase().split("");
	const guessLength = guess.length;
	for (let i = 0; i < guessLength; i++) {
		if (guessArray[i] === word[i].toLowerCase()) {
			$(".lb" + (round) + ".letter" + i).addClass("exact");
			$("." + guessArray[i]).css("backgroundColor", "#6d8874");
		} else {
			$(".lb" + (round) + ".letter" + i).text(word[i].toUpperCase()).addClass("lose");
		}
	}
	score(-guessLength, round, word);
}

 // Validation, flip colored letters
async function showSuccess(guess) {
	await sleep(100);
	const guessArray = guess.toLowerCase().split('');
	const guessLength = guess.length;
	const green = [];
	const yellow = [];
	for (let i = 0; i < guessLength; i++) {
		const regExLetter = new RegExp(guess[i], 'ig');
		if (guessArray[i] === word[i].toLowerCase()) {
			$(`.lb${round - 1}.letter${i}`).slideUp(250).addClass("checked exact").slideDown(250);
			$(`.${guessArray[i]}`).css("backgroundColor", "#6d887488");
			green.push(guessArray[i]);
			await sleep(450);
		} else if (word.match(regExLetter)) {
			const guessLetterOccurency = countOccurency(guessArray, guessArray[i]);
			const wordLetterOccurency = word.match(regExLetter).length;
			if (guessLetterOccurency < wordLetterOccurency ||
				guessLetterOccurency === wordLetterOccurency) {
				$(`.lb${round - 1}.letter${i}`).slideUp(250).addClass("checked okay").slideDown(250);
				if (!green.includes(guessArray[i])) {
					$(`.${guessArray[i]}`).css("backgroundColor", "#d7a86e88");
					yellow.push(guessArray[i]);
				}
				await sleep(450);
			} else {
				$(`.lb${round - 1}.letter${i}`).slideUp(250).addClass("checked nope").slideDown(250);
				if (!green.includes(guessArray[i]) && !yellow.includes(guessArray[i])) {
					$(`.${guessArray[i]}`).css("backgroundColor", "#111");
				}
				guessArray[i] = "-";
				await sleep(450);
			}
		} else {
			$(`.lb${round - 1}.letter${i}`).slideUp(250).addClass("checked nope").slideDown(250);
			$(`.${guessArray[i]}`).css("backgroundColor", "#111");
			await sleep(450);
		}
	}
}

// Wordlist incluedes guessed word ?
async function isInWordlist(text) {
	text = text[0].toUpperCase() + text.slice(1).toLowerCase();
	if (text !== wordOrig) {
		if (langArray.includes(text)) {
			if (round === 6) {
				lastRound(text);
			} else {
				showSuccess(text).then();
			}
		} else {
			await sleep(100);
			for (let k = 0; k < limit; k++) {
				$(`.lb${round - 1}.letter${k}`).text('').fadeOut(200).fadeIn(200);
				await sleep(50);
			}
			round--;
		}
	} else {
		showSuccess(word).then();
		await sleep(word.length * 480);
		const newScore = word.length * (8 - round);
		$('.keyboard-container').css('visibility', 'hidden');
		score(newScore, round);
	}
}

// Grid letter insertion
function insertLetter(key) {
	if (userInput.length < limit && (key).match(/^[a-zA-ZäöüÄÖÜ]$/)) {
		const i = userInput.length % limit;
		userInput += key;
		$($(`.lb${round}.letter${i}`)).text(key.toUpperCase());
	} else if (key === "Backspace" && userInput.length > 0) {
		userInput = userInput.slice(0, -1);
		const i = (userInput.length) % limit;
		$($(`.lb${round}.letter${i}`)).text("");
	} else if (userInput.length === limit && key === "Enter") {
		isInWordlist(userInput).then();
		userInput = ""
		round++
	}
}


// Game Over
function score(points, tries) {
	if (points > 0) {
		showWinnerComment(points);
		tries--
	} else {
		showLoserComment(points);
		tries++
	}
	users[userLoggedIn].total_plays += 1;
	users[userLoggedIn].total_score += points;

	users[userLoggedIn].scores.push([points, tries, wordOrig, date]);
	localStorage.setItem('users', JSON.stringify(users));
	closeOnClickOrKey();
}

// Highscore
function getScore() {
  if (userLoggedIn !== 'Dingssbums') {
    let high = Object.keys(users).map((v) => [users[v].total_score, users[v].name])
    high = high.sort(function (a, b) {
      return b[0] - a[0];
    });

    for (let i = 0; i < high.length; i++) {
      let x = 1 + i;
      const user = high[i][1];
      if (user !== 'Dingssbums') {
        $('.rank' + (x)).append(`
				<div class='l'>${x}.</div>
				<div class='m'>${users[user].name}</div>
				<div class='re'>${users[user].total_score}
				<small>(${users[user].total_plays})</small>
				</div>`);
      } else {
        x--;
      }
    }
  } else {
    $('.score-container').css('display', 'none');
    $('#anonymous').css('display', 'block');
  }
  return null;
}

$('#scoring').onload = getScore();

const showTotal = $("#show-total");
const showWords = $("#show-words");

// Statistics
function getStatistics() {
  const allTries = [
    {tries: []},
    {tries: []},
    {tries: []},
    {tries: []},
    {tries: []},
    {tries: []},
    {tries: []}
  ];

  let maxTries = 0;
  let vers;
  let result = []
	if(userLoggedIn) {
		result = users[userLoggedIn].scores ?? result;
	}
  if (result.length > 0) {

    for (const game of result) {
      allTries[(game[1] - 1)].tries.push(game[2]);
      if (allTries[(game[1] - 1)].tries.length > maxTries) {
        maxTries = allTries[(game[1] - 1)].tries.length;
      }
      if (game[1] === 7) {
        vers = "x";
      } else {
        vers = game[1];
      }
      showTotal.after(
				`<div class='wordlist'>
					<div>${game[2]}</div>
					<div class='smaller'>${game[3]} (${vers})</div>
				</div>`
			);
    }

    const username = userLoggedIn;
    const total = users[userLoggedIn].total_plays;
    const score = users[userLoggedIn].total_score;
    const lose = allTries[6].tries.length;
    const actualTries = result[result.length - 1].tries;
    const factor = total / maxTries;

    $('.big-header').text(username);
    $('.entry_date').text(users[userLoggedIn].date);

    $('.big-header2').text(`${score} Punkte`);
    $('.plays').text(`${total} Spiele`);

    $('.try' + actualTries).css('backgroundColor', '#5FD068');

    allTries.forEach((key, index) => {
      if (index === 6) {
        const perc7 = (lose * 100 / total).toFixed(1);
        $('.try7').animate({height: `${100 - perc7}%`}, 1000);
        $('.percentage7').text(`${100 - perc7}%`);
        $('.number7').text(`${total -lose}/${total}  Gewonnen`);
      } else {

        const perc = (key.tries.length * 100 / total).toFixed(1);
        const i = (index + 1).toString();
        $('.try' + i).animate({height: `${factor * perc}%`}, 1000);
        $('.number' + i).text(`${perc}%`);
        $('.percentage' + i).text(key.tries.length);
      }
    });
    $("#rank").text(`${getRanking(username)}. Platz`);
  }
  return null;
}

$('.statistics').onload = getStatistics();


function getRanking(name) {

  let high = Object.keys(users).map((v) => [users[v].total_score, users[v].name])

  high = high.sort(function (a, b) {
    return b[0] - a[0];
  });

  const rank = high.findIndex(player => player[1] === name)
  return (rank + 1)
}

showWords.mouseover(function () {
  showWords.text("Liste");
});

showWords.mouseout(function () {
  showWords.text("Gesamt");
});

showTotal.mouseover(function () {
  showTotal.text("Total");
});

showTotal.mouseout(function () {
  showTotal.text("Wortliste");
});

$("#total-tries").show();
$("#all-words").hide();

showWords.click(function () {
  $("#total-tries").hide();
  $("#all-words").show();
});

showTotal.click(function () {
  $("#total-tries").show();
  $("#all-words").hide();
});

// Manual show/hide
$('.manual').click(() => {
	if (manualDisplay === false) {
		$('.manual-container').slideDown();
	} else {
    $('.manual-container').slideUp().click(() => {
      $('.manual-container').slideUp();
		});
	}
  manualDisplay = !manualDisplay;
});

$('.manual-container').click(() => {
		$('.manual-container').slideUp().click(() => {
      $('.manual-container').slideUp();
      manualDisplay = false;
    })
})

$(".logout").click(() => {
  console.log("logout clicked");
  sessionStorage.clear();
  location.href = "index.html";
  $(".player").text("?");
  login();
});
