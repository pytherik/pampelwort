const loginForm = document.getElementById('login-form');
const logNameEl = document.getElementById('loginName');

import {lang} from './wordsArray.js';
import {
  closeOnClickOrKey,
  sleep,
  cutGridToWordLength,
  showWinnerComment,
  showLoserComment,
  countOccurency,
  sortUsers
} from "./helperFunctions.js";

const date = new Date().toLocaleDateString().slice(0, 21);

let manualDisplay = false;

let userLoggedIn;
let session;
let users = {};
let langArray;
let word, wordOrig;
let wordLength;

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

function startSession() {
  if (!sessionStorage.getItem("userSession")) {
    login();
  } else {
    session = JSON.parse(sessionStorage.getItem("userSession"));
    userLoggedIn = session.name;
    if (users[userLoggedIn].total_plays === 0) {
      $('.hideable').addClass('hide')
    } else {
      $('.hideable').removeClass('hide')
    }
    langArray = lang[users[userLoggedIn].lang]
    let num_letters = users[userLoggedIn].num_letters
    if (num_letters !== 0) {
      langArray = langArray.filter((word) => {
        return word.length === num_letters;
      })
    }
    const rank = getPlayerRank(userLoggedIn);
    const langSetting = users[userLoggedIn].lang;

    $(".player").text(userLoggedIn);
    $(".player-highscore").text(`${rank}. Platz`);
    $(".player-settings").html(`
Sprache: 
<strong>${langSetting}</strong> | Buchstaben: 
<strong>${num_letters === 0 ? "Zufall": num_letters}</strong>
`);
    $(".login-modal").css("display", "none");
    getRandomWord();
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

function login() {
  $(".login-modal").css("display", "flex");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const date = new Date().toLocaleDateString("de-De");

    if (!logNameEl.value) {
      $("#errorMessage").text("Bitte gib einen Namen an.");
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

$(document).on("keydown", function (e) {
  insertLetter(e.key);
});

$(".abc").on("click", function () {
  if (this.innerHTML.slice(23, 28) === "enter") {
    insertLetter("Enter")
  } else if (this.innerHTML.slice(23, 27) === "back") {
    insertLetter("Backspace")
  } else {
    insertLetter(this.innerHTML)
  }
});

function getRandomWord() {
  let rand = Math.floor(Math.random() * langArray.length);
  wordOrig = langArray[rand];
  word = wordOrig.toLowerCase();
  wordLength = word.length;
  cutGridToWordLength(wordLength);
}

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
      for (let k = 0; k < wordLength; k++) {
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

function insertLetter(key) {
  if (userInput.length < wordLength && key.match(/^[a-zA-ZäöüÄÖÜ]$/)) {
    const i = userInput.length % wordLength;
    userInput += key;
    $($(`.lb${round}.letter${i}`)).text(key.toUpperCase());
  } else if (key === "Backspace" && userInput.length > 0) {
    userInput = userInput.slice(0, -1);
    const i = (userInput.length) % wordLength;
    $($(`.lb${round}.letter${i}`)).text("");
  } else if (userInput.length === wordLength && key === "Enter") {
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

function showHighscore() {
  let sortedUsers = sortUsers(users);

  for (let i = 0; i < sortedUsers.length; i++) {
    let position = 1 + i;
    const user = sortedUsers[i][1];
    $('.rank' + (position)).append(`
				<div class='l'>${position}.</div>
				<div class='m'>${users[user].name}</div>
				<div class='re'>${users[user].total_score}
				<small>(${users[user].total_plays})</small>
				</div>`);
  }
  return null;
}

$('#scoring').onload = showHighscore();

const showTotal = $("#show-total");
const showWords = $("#show-words");

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
  if (userLoggedIn) {
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
    ;
    const total = users[userLoggedIn].total_plays;
    const score = users[userLoggedIn].total_score;
    const lose = allTries[6].tries.length;
    const actualTries = result[result.length - 1].tries;
    const factor = total / maxTries;

    $('.big-header').text(userLoggedIn);
    $('.entry_date').text(users[userLoggedIn].date);

    $('.big-header2').text(`${score} Punkte`);
    $('.plays').text(`${total} ${total === 1 ? 'Spiel': 'Spiele'}`);

    $('.try' + actualTries).css('backgroundColor', '#5FD068');

    allTries.forEach((key, index) => {
      if (index === 6) {
        const perc7 = (lose * 100 / total).toFixed(1);
        $('.try7').animate({height: `${100 - perc7}%`}, 1000);
        $('.percentage7').text(`${100 - perc7}%`);
        $('.number7').text(`${total - lose}/${total}  Gewonnen`);
      } else {

        const perc = (key.tries.length * 100 / total).toFixed(1);
        const i = (index + 1).toString();
        $(`.try${i}`).animate({height: `${factor * perc}%`}, 1000);
        $(`.number${i}`).text(`${perc}%`);
        $(`.percentage${i}`).text(key.tries.length);
      }
    });
    $("#rank").text(`${getPlayerRank(userLoggedIn)}. Platz`);
  }
  return null;
}

$('.statistics').onload = getStatistics();

function getPlayerRank(name) {
  const sortedNames = sortUsers(users);
  const rank = sortedNames.findIndex(player => player[1] === name)
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
