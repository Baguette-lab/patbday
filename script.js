const scenes = ['bureau', 'balloons', 'gifts', 'quiet', 'letter'];
const tabs = [...document.querySelectorAll('.chapter-tab')];
const panels = Object.fromEntries(scenes.map(name => [name, document.getElementById(`panel-${name}`)]));
const announcer = document.getElementById('announcer');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const state = { bureau: false, balloons: new Set(), gifts: new Set(), letterOpen: false, stamps: 0 };
const balloonLines = [
  'pop pop pop pop pop.',
  'The balloons would like to file a complaint.',
  'Okay, okay. You deserve a very good birthday.',
  'I hope the right people always make you feel seen.',
  'And I hope you know how much brighter things are with you here.'
];

function tell(message) { announcer.textContent = ''; window.setTimeout(() => { announcer.textContent = message; }, 20); }
function topOfPage() { window.scrollTo({ top: 0, behavior: 'auto' }); }
const chapterLockMessage = document.getElementById('chapterLockMessage');
let chapterLockTimeout;
function explainChapterLock() {
  const message = 'Nice try. Clear all eight Bureau tasks to unlock the other tabs.';
  chapterLockMessage.textContent = message;
  chapterLockMessage.hidden = false;
  window.clearTimeout(chapterLockTimeout);
  chapterLockTimeout = window.setTimeout(() => { chapterLockMessage.hidden = true; }, 4000);
  tell(message);
}
function selectTab(name, focusPanel = false) {
  if (!scenes.includes(name)) return;
  if (name !== 'bureau' && !state.bureau) { explainChapterLock(); return; }
  scenes.forEach(scene => {
    const active = scene === name;
    panels[scene].hidden = !active;
    const tab = document.getElementById(`tab-${scene}`);
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  document.body.dataset.scene = name;
  topOfPage();
  if (focusPanel) panels[name].focus({ preventScroll: true });
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab.dataset.tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    if (!state.bureau) {
      tabs[0].focus();
      selectTab('bureau');
      return;
    }
    tabs[next].focus();
    selectTab(tabs[next].dataset.tab);
  });
});
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => selectTab(button.dataset.go, true)));
document.getElementById('brandLink').addEventListener('click', event => { event.preventDefault(); selectTab('bureau'); });
document.getElementById('topButton').addEventListener('click', topOfPage);
document.getElementById('resetButton').addEventListener('click', () => window.location.reload());

const siteMusic = document.getElementById('siteMusic');
const siteMusicToggle = document.getElementById('siteMusicToggle');
const musicDock = document.getElementById('musicDock');
const musicSettings = document.getElementById('musicSettings');
const musicFileInput = document.getElementById('customMusicFile');
let customMusicURL = null;
let musicNeedsGesture = false;
let musicPausedByUser = false;
let resumeSiteMusicAfterBirthday = false;
siteMusic.volume = .3;
function updateSiteMusicControl() {
  const playing = !siteMusic.paused;
  siteMusicToggle.setAttribute('aria-pressed', String(playing));
  siteMusicToggle.setAttribute('aria-label', playing ? 'Pause site music' : 'Play site music');
  document.getElementById('siteMusicText').textContent = playing ? 'Pause music' : musicNeedsGesture ? 'Tap for music' : 'Play music';
}
function playSiteMusic() {
  const attempt = siteMusic.play();
  if (attempt?.then) attempt.then(() => {
    musicNeedsGesture = false;
    updateSiteMusicControl();
  }).catch(() => {
    if (siteMusic.paused && !musicPausedByUser) musicNeedsGesture = true;
    updateSiteMusicControl();
  });
  return attempt;
}
function openMusicSettings(open) {
  musicSettings.hidden = !open;
  document.getElementById('openMusicSettings').setAttribute('aria-expanded', String(open));
}
siteMusic.addEventListener('play', updateSiteMusicControl);
siteMusic.addEventListener('pause', updateSiteMusicControl);
siteMusic.addEventListener('error', () => {
  document.getElementById('musicPreviewStatus').textContent = 'This audio file could not be played. Try an MP3 file.';
  updateSiteMusicControl();
});
siteMusicToggle.addEventListener('click', () => {
  if (siteMusic.paused) {
    musicPausedByUser = false;
    musicNeedsGesture = false;
    playSiteMusic();
  } else {
    musicPausedByUser = true;
    musicNeedsGesture = false;
    siteMusic.pause();
  }
  updateSiteMusicControl();
});
document.getElementById('openMusicSettings').addEventListener('click', () => openMusicSettings(musicSettings.hidden));
document.getElementById('closeMusicSettings').addEventListener('click', () => openMusicSettings(false));
document.addEventListener('click', event => { if (!musicSettings.hidden && !musicDock.contains(event.target)) openMusicSettings(false); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !musicSettings.hidden) openMusicSettings(false); });
musicFileInput.addEventListener('change', () => {
  const file = musicFileInput.files?.[0];
  if (!file) return;
  if (file.type && !file.type.startsWith('audio/')) {
    document.getElementById('musicPreviewStatus').textContent = 'Choose an audio file, such as MP3.';
    return;
  }
  siteMusic.pause();
  if (customMusicURL) URL.revokeObjectURL(customMusicURL);
  customMusicURL = URL.createObjectURL(file);
  siteMusic.src = customMusicURL;
  siteMusic.load();
  musicPausedByUser = false;
  document.getElementById('musicPreviewStatus').textContent = `Previewing ${file.name} on this device.`;
  playSiteMusic();
});
document.getElementById('useSiteMusic').addEventListener('click', () => {
  siteMusic.pause();
  if (customMusicURL) URL.revokeObjectURL(customMusicURL);
  customMusicURL = null;
  musicFileInput.value = '';
  siteMusic.src = 'background-music.mp3';
  siteMusic.load();
  musicPausedByUser = false;
  document.getElementById('musicPreviewStatus').textContent = 'Site soundtrack selected.';
  playSiteMusic();
});
document.getElementById('siteMusicVolume').addEventListener('input', event => {
  const volume = Number(event.currentTarget.value);
  siteMusic.volume = volume / 100;
  document.getElementById('volumeValue').textContent = `${volume}%`;
});
function startMusicOnFirstInteraction(event) {
  if (!musicNeedsGesture || musicPausedByUser || musicDock.contains(event.target) || celebrationDialog.open) return;
  musicNeedsGesture = false;
  playSiteMusic();
}
document.addEventListener('pointerdown', startMusicOnFirstInteraction, { capture: true });
document.addEventListener('keydown', event => {
  if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) startMusicOnFirstInteraction(event);
}, { capture: true });

function updateProgress() {
  scenes.slice(1).forEach(name => {
    const tab = document.getElementById(`tab-${name}`);
    tab.classList.toggle('locked', !state.bureau);
    tab.setAttribute('aria-disabled', String(!state.bureau));
  });
  if (state.bureau) {
    window.clearTimeout(chapterLockTimeout);
    chapterLockMessage.hidden = true;
  }
  const cleared = [state.bureau, state.balloons.size === 5, state.gifts.size === 3];
  const count = cleared.filter(Boolean).length;
  document.getElementById('progressText').textContent = `${count} of 3 chapters cleared`;
  document.getElementById('progressFill').style.width = `${count / 3 * 100}%`;
  ['bureau', 'balloons', 'gifts'].forEach((name, index) => {
    document.getElementById(`tab-${name}`).classList.toggle('complete', cleared[index]);
    const checklist = document.getElementById(`check${name[0].toUpperCase()}${name.slice(1)}`);
    checklist.classList.toggle('done', cleared[index]);
    checklist.querySelector('b').textContent = cleared[index] ? 'DONE ✓' : 'GO';
  });
  const unlocked = count === 3;
  document.getElementById('tab-letter').classList.toggle('ready', unlocked);
  document.getElementById('tabLock').textContent = unlocked ? '♥' : '✳';
  document.getElementById('letterLocked').hidden = unlocked;
  document.getElementById('letterEnvelope').hidden = !unlocked || state.letterOpen;
  document.getElementById('letterPaper').hidden = !unlocked || !state.letterOpen;
  if (unlocked && !state.letterOpen) tell('Your birthday letter is ready in the Letter tab.');
}

const requiredRona = new Set(['mabaho', 'kabaong', 'santo']);
const requiredCaptcha = new Set(['cake', 'balloons', 'candle', 'gift', 'saint']);
let humanChoiceAttempts = 0;
let stairsAttempts = 0;
let ronaAttempts = 0;
let captchaAttempts = 0;
let passwordAttempts = 0;

function showBureauStep(step) {
  document.querySelectorAll('.bureau-step').forEach(el => { el.hidden = Number(el.dataset.step) !== step; });
  document.getElementById('bureauProgress').textContent = step === 8 ? 'CLEARANCE GRANTED' : `TASK ${step + 1} OF 8`;
  document.getElementById('bureauMeterFill').style.width = `${Math.min(step, 8) / 8 * 100}%`;
  if (!panels.bureau.hidden) {
    const heading = document.querySelector(`.bureau-step[data-step="${step}"] h2`);
    heading.tabIndex = -1;
    heading.focus();
  }
}
const humanPhases = ['humanQuestion', 'humanSure', 'humanReallySure'];
function showHumanPhase(phase) {
  humanPhases.forEach(id => { document.getElementById(id).hidden = id !== phase; });
  const heading = document.querySelector(`#${phase} h2`);
  heading.tabIndex = -1;
  heading.focus();
}
document.querySelectorAll('[data-human-answer]').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.humanAnswer === 'right') {
    showHumanPhase('humanSure');
    tell('Cramming at the last minute sounds human. The Bureau demands a confirmation.');
  } else {
    humanChoiceAttempts += 1;
    const response = humanChoiceAttempts >= 2
      ? 'The Bureau is looking for the last-minute cramming answer.'
      : 'Suspicious. A human with ten minutes left would probably be panicking.';
    document.getElementById('humanChoiceFeedback').textContent = response;
    tell(response);
  }
}));
document.querySelectorAll('[data-human-confirm]').forEach(button => button.addEventListener('click', () => {
  const answer = button.dataset.humanConfirm;
  if (answer === 'sure-yes') {
    showHumanPhase('humanReallySure');
    tell('Confirmation received. Naturally we need one more confirmation.');
  } else if (answer === 'really-yes') {
    showBureauStep(1);
    tell('Fine. You have confirmed the confirmation. Please complete the photo CAPTCHA.');
  } else {
    const response = answer === 'sure-no'
      ? 'The Bureau rejects your sudden claim of being prepared. Try again.'
      : 'Organization at the last minute? That is not what your first answer said.';
    document.getElementById(answer === 'sure-no' ? 'humanSureFeedback' : 'humanReallySureFeedback').textContent = response;
    tell(response);
  }
}));

const puzzleSize = 12;
const puzzleColumns = 3;
const puzzleGrid = document.getElementById('puzzleGrid');
const puzzleButtons = [];
let puzzleOrder = [];
let selectedPosition = null;
let puzzleSolved = false;
let puzzleMoves = 0;

function renderPuzzle() {
  puzzleButtons.forEach((button, position) => {
    const piece = puzzleOrder[position];
    const column = piece % puzzleColumns;
    const row = Math.floor(piece / puzzleColumns);
    button.style.backgroundPosition = `${column * 50}% ${row * (100 / 3)}%`;
    button.setAttribute('aria-label', `Photo piece ${piece + 1}, currently in position ${position + 1}`);
    button.setAttribute('aria-pressed', String(selectedPosition === position));
    button.classList.toggle('selected', selectedPosition === position);
  });
}
function shufflePuzzle() {
  puzzleOrder = Array.from({ length: puzzleSize }, (_, index) => index);
  for (let i = puzzleOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [puzzleOrder[i], puzzleOrder[j]] = [puzzleOrder[j], puzzleOrder[i]];
  }
  if (puzzleOrder.every((piece, index) => piece === index)) [puzzleOrder[0], puzzleOrder[1]] = [puzzleOrder[1], puzzleOrder[0]];
  selectedPosition = null;
  puzzleSolved = false;
  puzzleMoves = 0;
  document.getElementById('puzzleContinue').disabled = true;
  document.getElementById('puzzleShuffle').disabled = false;
  document.getElementById('puzzleStatus').textContent = 'Tap two squares to swap them. The tiny photo is your reference.';
  renderPuzzle();
}
function tapPuzzle(position) {
  if (puzzleSolved) return;
  if (selectedPosition === null) {
    selectedPosition = position;
  } else if (selectedPosition === position) {
    selectedPosition = null;
  } else {
    [puzzleOrder[selectedPosition], puzzleOrder[position]] = [puzzleOrder[position], puzzleOrder[selectedPosition]];
    selectedPosition = null;
    puzzleMoves += 1;
    if (puzzleOrder.every((piece, index) => piece === index)) {
      puzzleSolved = true;
      document.getElementById('puzzleContinue').disabled = false;
      document.getElementById('puzzleShuffle').disabled = true;
      document.getElementById('puzzleStatus').textContent = `Photo restored in ${puzzleMoves} swaps. Human status: convincing.`;
      tell('Photo restored. The CAPTCHA is complete. Continue to the stairs.');
      burstAt(puzzleGrid, 45);
    } else {
      document.getElementById('puzzleStatus').textContent = `${puzzleMoves} swap${puzzleMoves === 1 ? '' : 's'} made. Keep going.`;
    }
  }
  renderPuzzle();
}
function initializePuzzle() {
  for (let position = 0; position < puzzleSize; position++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'puzzle-piece';
    button.addEventListener('click', () => tapPuzzle(position));
    puzzleGrid.append(button);
    puzzleButtons.push(button);
  }
  shufflePuzzle();
}
document.getElementById('robotCheck').addEventListener('click', event => {
  if (event.currentTarget.getAttribute('aria-checked') === 'true') return;
  event.currentTarget.setAttribute('aria-checked', 'true');
  document.getElementById('puzzleWrap').hidden = false;
  initializePuzzle();
  tell('Checkbox accepted. Please assemble the birthday photo to finish the CAPTCHA.');
});
document.getElementById('puzzleShuffle').addEventListener('click', shufflePuzzle);
document.getElementById('puzzleContinue').addEventListener('click', () => {
  if (!puzzleSolved) return;
  showBureauStep(2);
  tell('You restored the picture. The Bureau has one more visual test: stairs.');
});

document.querySelectorAll('.stairs-tile').forEach(tile => tile.addEventListener('click', () => {
  document.querySelectorAll('.stairs-tile').forEach(other => other.setAttribute('aria-pressed', String(other === tile)));
}));
document.getElementById('stairsCheck').addEventListener('click', () => {
  const selected = document.querySelector('.stairs-tile[aria-pressed="true"]');
  if (selected?.dataset.stairs === 'stairs') {
    showBureauStep(3);
    tell('You found the stairs. The Bureau is shocked and slightly proud.');
    return;
  }
  stairsAttempts += 1;
  const response = stairsAttempts >= 2
    ? 'Those are not stairs. Hint: look for separate little steps.'
    : selected ? 'That is not the stairs. The Bureau may need to check your eyesight.' : 'Please choose one. Standing still is not a stair.';
  document.getElementById('stairsFeedback').textContent = response;
  tell(response);
});

document.querySelectorAll('.rona-tile').forEach(tile => tile.addEventListener('click', () => {
  tile.setAttribute('aria-pressed', String(tile.getAttribute('aria-pressed') !== 'true'));
}));
document.getElementById('ronaCheck').addEventListener('click', () => {
  const selected = new Set([...document.querySelectorAll('.rona-tile[aria-pressed="true"]')].map(tile => tile.dataset.rona));
  const correct = selected.size === requiredRona.size && [...requiredRona].every(item => selected.has(item));
  if (correct) {
    showBureauStep(4);
    tell('Rona Mae Malate verified. The Bureau cannot believe those three answers were all real.');
    return;
  }
  ronaAttempts += 1;
  let response = [...selected].some(item => !requiredRona.has(item))
    ? 'The Bureau does not believe you are its CEO, a tax champion, or the raccoon supervisor.'
    : 'Not quite. One or more suspiciously specific details are missing.';
  if (ronaAttempts >= 3) response += ' Hint: nagjowa ng mabaho, humiga sa kabaong, santong nagmumura.';
  document.getElementById('ronaFeedback').textContent = response;
  tell(response);
});

document.querySelectorAll('.captcha-tile[data-captcha]').forEach(tile => tile.addEventListener('click', () => {
  tile.setAttribute('aria-pressed', String(tile.getAttribute('aria-pressed') !== 'true'));
}));
document.getElementById('captchaCheck').addEventListener('click', () => {
  const selected = new Set([...document.querySelectorAll('.captcha-tile[data-captcha][aria-pressed="true"]')].map(tile => tile.dataset.captcha));
  const correct = selected.size === requiredCaptcha.size && [...requiredCaptcha].every(item => selected.has(item));
  if (correct) {
    showBureauStep(5);
    tell('Birthday CAPTCHA accepted. The raccoon remains uninvited.');
    return;
  }
  captchaAttempts += 1;
  let response;
  if ([...selected].some(item => !requiredCaptcha.has(item))) response = 'The Bureau has concerns about your guest list. No broccoli, spreadsheets, raccoons, or taxes.';
  else if (!selected.has('saint')) response = 'Almost. You forgot the guest of honor. Awkward.';
  else response = 'Someone or something important is missing from this party.';
  if (captchaAttempts >= 3) response += ' Hint: cake, balloons, candle, gift, and Saint.';
  document.getElementById('captchaFeedback').textContent = response;
  tell(response);
});

document.querySelectorAll('[data-password-answer]').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.passwordAnswer === 'right') {
    showBureauStep(6);
    tell('Password accepted. The Bureau regrets printing every option on the screen.');
  } else {
    passwordAttempts += 1;
    const response = passwordAttempts >= 2 ? 'Hint: reverse P-A-R-T-Y letter by letter. It starts with Y.' : 'Access denied. Please rotate your brain 180 degrees.';
    document.getElementById('passwordFeedback').textContent = response;
    tell(response);
  }
}));

document.querySelectorAll('[data-cake-answer]').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.cakeAnswer === 'right') {
    showBureauStep(7);
    tell('Correct. Birthday cake is not a math problem. Five stamps remain.');
  } else {
    const response = 'Incorrect. We do not ration birthday cake here. Try the answer with the MOST cake.';
    document.getElementById('cakeFeedback').textContent = response;
    tell(response);
  }
}));

const stampMessages = [
  'Stamp one: we lost the form.',
  'Stamp two: found it under a cupcake.',
  'Stamp three: the supervisor is a raccoon.',
  'Stamp four: the raccoon is on break.',
  'Stamp five: checking with upper management...'
];
document.getElementById('stampButton').addEventListener('click', event => {
  if (state.bureau || state.stamps >= 5) return;
  state.stamps += 1;
  document.getElementById('stampCount').textContent = `${state.stamps} / 5`;
  document.getElementById('stampStatus').textContent = stampMessages[state.stamps - 1];
  event.currentTarget.style.transform = `rotate(${state.stamps % 2 ? -3 : 3}deg)`;
  if (state.stamps === 5) {
    event.currentTarget.disabled = true;
    window.setTimeout(() => {
      state.bureau = true;
      showBureauStep(8);
      updateProgress();
      tell('Birthday clearance approved. The rest gets better. Mostly.');
      burstAt(document.querySelector('.bureau-card'), 42);
    }, reducedMotion.matches ? 0 : 950);
  }
});

const balloons = [...document.querySelectorAll('.balloon')];
function popBalloon(button) {
  const index = Number(button.dataset.wish);
  if (!Number.isInteger(index) || state.balloons.has(index)) return;
  state.balloons.add(index);
  button.disabled = true;
  button.classList.add('popped');
  button.setAttribute('aria-label', `Balloon ${index + 1} popped`);
  burstAt(button, 20);
  const wish = document.createElement('div');
  wish.className = 'balloon-wish';
  const number = document.createElement('span'); number.textContent = `0${index + 1} /`;
  wish.append(number, document.createTextNode(balloonLines[index]));
  document.getElementById('balloonWishes').append(wish);
  document.getElementById('wishesEmpty').hidden = true;
  document.getElementById('balloonCounter').textContent = `${state.balloons.size} OF 5 POPPED`;
  document.getElementById('boardHint').textContent = state.balloons.size === 5 ? 'ALL FIVE POPPED. YOU DID IT.' : `${5 - state.balloons.size} BALLOONS LEFT`;
  tell(balloonLines[index]);
  if (state.balloons.size === balloons.length) {
    window.setTimeout(() => { document.getElementById('balloonComplete').hidden = false; burstAt(document.getElementById('balloonStage'), 40); }, reducedMotion.matches ? 0 : 300);
    document.getElementById('balloonNext').hidden = false;
    updateProgress();
  }
}
balloons.forEach(button => button.addEventListener('click', () => popBalloon(button)));

const gifts = [...document.querySelectorAll('.gift-card')];
gifts.forEach(card => card.addEventListener('click', () => {
  const index = Number(card.dataset.gift);
  const opening = card.getAttribute('aria-expanded') !== 'true';
  card.setAttribute('aria-expanded', String(opening));
  if (opening && !state.gifts.has(index)) {
    state.gifts.add(index);
    document.getElementById('giftCounter').textContent = `${state.gifts.size} OF 3 OPENED`;
    burstAt(card, index === 2 ? 28 : 15);
    tell(card.querySelector('.gift-reveal strong').textContent);
    if (state.gifts.size === gifts.length) {
      document.getElementById('giftEnd').hidden = false;
      updateProgress();
    }
  }
}));

document.querySelectorAll('.pocket-card').forEach(card => card.addEventListener('click', () => {
  const open = card.getAttribute('aria-expanded') !== 'true';
  card.setAttribute('aria-expanded', String(open));
  card.querySelector('small').textContent = open ? 'Tap to close' : 'Tap to open';
}));
const cake = document.getElementById('cakeButton');
const celebrationDialog = document.getElementById('celebrationDialog');
const celebrationColors = ['#ff6c73', '#f8cf58', '#8b78ce', '#68aaa3', '#ee88ae'];
const birthdaySong = document.getElementById('birthdaySong');
const songToggle = document.getElementById('songToggle');
function updateSongControl() {
  const playing = !birthdaySong.paused && !birthdaySong.ended;
  songToggle.setAttribute('aria-pressed', String(playing));
  songToggle.textContent = playing ? 'Ⅱ Pause song' : birthdaySong.ended ? '♫ Play again' : '♫ Play birthday song';
  songToggle.setAttribute('aria-label', playing ? 'Pause birthday song' : birthdaySong.ended ? 'Play birthday song again' : 'Play birthday song');
}
function playBirthdaySong(restart = true) {
  if (!musicPausedByUser) resumeSiteMusicAfterBirthday = true;
  siteMusic.pause();
  if (restart || birthdaySong.ended) birthdaySong.currentTime = 0;
  const attempt = birthdaySong.play();
  if (attempt?.catch) attempt.catch(updateSongControl);
}
function restoreSiteMusic() {
  if (!resumeSiteMusicAfterBirthday || musicPausedByUser) return;
  resumeSiteMusicAfterBirthday = false;
  playSiteMusic();
}
birthdaySong.addEventListener('play', updateSongControl);
birthdaySong.addEventListener('pause', updateSongControl);
birthdaySong.addEventListener('ended', () => { updateSongControl(); restoreSiteMusic(); });
songToggle.addEventListener('click', () => {
  if (birthdaySong.paused || birthdaySong.ended) playBirthdaySong(false);
  else birthdaySong.pause();
});
function showBirthdaySurprise() {
  if (celebrationDialog.open) return;
  document.getElementById('gameCheerStatus').textContent = 'Tap a friend to make them cheer!';
  const confetti = document.getElementById('celebrationConfetti');
  confetti.replaceChildren();
  if (!reducedMotion.matches) {
    for (let i = 0; i < 48; i++) {
      const piece = document.createElement('i');
      piece.style.setProperty('--left', `${Math.random() * 100}%`);
      piece.style.setProperty('--delay', `${Math.random() * -2.8}s`);
      piece.style.setProperty('--duration', `${2.3 + Math.random() * 2.2}s`);
      piece.style.setProperty('--drift', `${Math.random() * 110 - 55}px`);
      piece.style.setProperty('--color', celebrationColors[i % celebrationColors.length]);
      confetti.append(piece);
    }
  }
  celebrationDialog.showModal();
  openMusicSettings(false);
  document.body.classList.add('celebration-open');
  document.getElementById('closeCelebration').focus();
  tell('Surprise! Happy birthday, Pat! Your three friends are celebrating with you.');
}
function closeBirthdaySurprise() { celebrationDialog.close(); }
document.getElementById('closeCelebration').addEventListener('click', closeBirthdaySurprise);
document.getElementById('continueCelebration').addEventListener('click', closeBirthdaySurprise);
document.getElementById('replayCelebration').addEventListener('click', () => { playBirthdaySong(); showBirthdaySurprise(); });
celebrationDialog.addEventListener('click', event => { if (event.target === celebrationDialog) closeBirthdaySurprise(); });
celebrationDialog.addEventListener('close', () => {
  document.body.classList.remove('celebration-open');
  birthdaySong.pause();
  restoreSiteMusic();
});
const cheerLines = {
  confetti: 'Confetti delivery! Happy birthday, Pat!',
  cake: 'The cake is yours, Pat. Yes, the whole cake.',
  cheer: ' We may not be together physically but we will always celebrate you'
};
document.querySelectorAll('.game-sprite').forEach(sprite => sprite.addEventListener('click', () => {
  sprite.classList.remove('cheer-now');
  void sprite.offsetWidth;
  sprite.classList.add('cheer-now');
  window.setTimeout(() => sprite.classList.remove('cheer-now'), 650);
  const message = cheerLines[sprite.dataset.cheer];
  document.getElementById('gameCheerStatus').textContent = message;
  tell(message);
}));
cake.addEventListener('click', () => {
  const extinguished = cake.classList.toggle('extinguished');
  cake.setAttribute('aria-label', extinguished ? 'Relight the birthday candle' : 'Blow out the birthday candle');
  document.getElementById('cakeLabel').textContent = extinguished ? 'TAP TO LIGHT IT AGAIN' : 'TAP TO BLOW IT OUT';
  document.getElementById('candleResult').textContent = extinguished ? 'Wish made. Keep it close to your heart. ✳' : '';
  if (extinguished) {
    playBirthdaySong();
    burstAt(cake, 60);
    document.getElementById('replayCelebration').hidden = false;
    window.setTimeout(() => { if (cake.classList.contains('extinguished')) showBirthdaySurprise(); }, reducedMotion.matches ? 0 : 350);
  }
});

document.getElementById('openLetter').addEventListener('click', () => {
  if (!(state.bureau && state.balloons.size === 5 && state.gifts.size === 3)) return;
  state.letterOpen = true;
  updateProgress();
  const letter = document.getElementById('letterPaper');
  letter.querySelector('h2').focus({ preventScroll: true });
  burstAt(letter, 65);
});
document.getElementById('confettiAgain').addEventListener('click', event => burstAt(event.currentTarget, 70));

function burstAt(element, amount) {
  if (reducedMotion.matches) return;
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2, y = rect.top + rect.height * .4;
  const colors = ['#ff6c73', '#f8cf58', '#8b78ce', '#68aaa3', '#ee88ae', '#1c3158'];
  const layer = document.getElementById('confettiLayer');
  for (let i = 0; i < amount; i++) {
    const piece = document.createElement('i');
    piece.className = `confetti-piece${i % 4 === 0 ? ' round' : ''}`;
    const angle = Math.random() * Math.PI * 2, distance = 70 + Math.random() * 190;
    piece.style.setProperty('--x', `${x}px`); piece.style.setProperty('--y', `${y}px`);
    piece.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    piece.style.setProperty('--dy', `${Math.sin(angle) * distance + 75}px`);
    piece.style.setProperty('--rotation', `${Math.random() * 360}deg`);
    piece.style.setProperty('--duration', `${1.1 + Math.random() * .8}s`);
    piece.style.setProperty('--color', colors[i % colors.length]);
    layer.append(piece);
    piece.addEventListener('animationend', () => piece.remove(), { once: true });
  }
}

if (document.modelContext?.registerTool) {
  try {
    Promise.resolve(document.modelContext.registerTool({
      name: 'complete_birthday_balloons', title: "Pop Saint's birthday balloons",
      description: "Pop the remaining birthday balloons and reveal their five notes.",
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new Error('Expected an empty object.');
        if (!state.bureau) throw new Error('Clear all eight Birthday Bureau tasks first.');
        balloons.forEach(popBalloon);
        await new Promise(resolve => window.setTimeout(resolve, reducedMotion.matches ? 0 : 320));
        return { popped: state.balloons.size, total: balloons.length, complete: true };
      }
    })).catch(() => {});
  } catch (_) { /* The site works in browsers without this interface. */ }
}

updateProgress();
playSiteMusic();