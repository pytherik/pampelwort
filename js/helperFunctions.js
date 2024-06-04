import {comments} from "./wordsArray.js";

export function closeOnClickOrKey() {
  $(document).click(() => {
    location.reload();
  });
  $(document).on('keydown', function () {
    location.reload();
  });
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function cutGridToWordLength(wordLength) {
    for (let i = 0; i < (8 - wordLength); i++) {
      $(".letter" + (7 - i)).css("display", "none");
    }
}

export function showWinnerComment(points) {
  $('.success-container.win').slideDown();
  const rand = Math.floor(Math.random() * comments.length);
  const comment = comments[rand].lob;
  $('.keyboard-container').css('visibility', 'hidden');
  $('#win').text(comment);
  $('#plus').text(`${points} Punkte für dich!`);
}

export function showLoserComment(points) {
  $('.success-container.lose').slideDown();
  const rand = Math.floor(Math.random() * comments.length);
  const comment = comments[rand].tadel;
  $('.keyboard-container').css('visibility', 'hidden');
  $('#lose').text(comment);
  $('#minus').text(`Du kriegst ${Math.abs(points)} Punkte abgezogen!`);
}

export function countOccurency(word, letter) {
  let num = 0;
  for (const item in word) {
    if (word[item] === letter) {
      num++;
    }
  }
  return num;
}

export function sortUsers(users) {
  return Object.keys(users)
    .map((v) => [users[v].total_score, users[v].name])
    .sort(function (a, b) {
      return b[0] - a[0];
    });
}
