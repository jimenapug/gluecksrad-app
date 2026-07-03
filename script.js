// ===========================================
// 1. HTML ELEMENTS
// ===========================================

const setupScreen = document.getElementById("setup-screen");
const votingScreen = document.getElementById("voting-screen");

const questionInput = document.getElementById("question-input");
const optionsContainer = document.getElementById("options-container");
const addOptionBtn = document.getElementById("add-option-btn");
const createPollBtn = document.getElementById("create-poll-btn");
const setupError = document.getElementById("setup-error");

const votingQuestion = document.getElementById("voting-question");
const voteOptionsContainer = document.getElementById("vote-options-container");
const resultsList = document.getElementById("results-list");

const voteForm = document.getElementById("vote-form");

const resetPollBtn = document.getElementById("reset-poll-btn");

const wheelCanvas = document.getElementById("wheel-canvas");
const ctx = wheelCanvas.getContext("2d");

const spinBtn = document.getElementById("spin-btn");
const winnerDisplay = document.getElementById("winner-display");

// ===========================================
// 2. CONSTANTS
// ===========================================

const MAX_OPTIONS = 8;
const MIN_OPTIONS = 2;

const WHEEL_COLORS = [
  "#ff2e88",
  "#00e5ff",
  "#ffe600",
  "#39ff14",
  "#ff6b35",
  "#b537f2",
  "#00ff9f",
  "#ff073a"
];

let currentRotation = 0;
const SPIN_DURATION_MS = 4000;

// ===========================================
// 3. ADD OPTION
// ===========================================

addOptionBtn.addEventListener("click", function () {
  const currentOptions = document.querySelectorAll(".option-input");

  if (currentOptions.length >= MAX_OPTIONS) {
    setupError.textContent = "Maximal 8 Optionen erlaubt.";
    return;
  }

  setupError.textContent = "";

  const nextNumber = currentOptions.length + 1;

  const label = document.createElement("label");
  label.textContent = "Option " + nextNumber + ":";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "option-input";
  input.placeholder = "Option " + nextNumber;

  optionsContainer.appendChild(label);
  optionsContainer.appendChild(input);
});

// ===========================================
// 4. CREATE POLL
// ===========================================

createPollBtn.addEventListener("click", function () {
  const question = questionInput.value.trim();

  let options = Array.from(document.querySelectorAll(".option-input"))
    .map(i => i.value.trim())
    .filter(Boolean);

  if (!question) {
    setupError.textContent = "Bitte gib eine Frage ein.";
    return;
  }

  if (options.length < MIN_OPTIONS) {
    setupError.textContent = "Mindestens 2 Optionen nötig.";
    return;
  }

  const pollData = {
    question,
    options,
    votes: options.map(() => 0)
  };

  localStorage.setItem("pollData", JSON.stringify(pollData));

  setupScreen.classList.add("hidden");
  votingScreen.classList.remove("hidden");

  renderVotingScreen(pollData);
});

// ===========================================
// 5. RENDER VOTING SCREEN
// ===========================================

function renderVotingScreen(pollData) {
  votingQuestion.textContent = pollData.question;

  voteOptionsContainer.innerHTML = "";

  pollData.options.forEach((text, i) => {
    const id = "opt-" + i;

    const label = document.createElement("label");

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "vote";
    radio.value = i;
    radio.id = id;

    label.appendChild(radio);
    label.appendChild(document.createTextNode(" " + text));

    voteOptionsContainer.appendChild(label);
  });

  renderResults(pollData);
  drawWheel(pollData);
}

// ===========================================
// 6. RESULTS
// ===========================================

function renderResults(pollData) {
  resultsList.innerHTML = "";

  pollData.options.forEach((text, i) => {
    const li = document.createElement("li");
    li.textContent = `${text}: ${pollData.votes[i]} Stimmen`;
    resultsList.appendChild(li);
  });
}

// ===========================================
// 7. VOTING
// ===========================================

voteForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const selected = document.querySelector('input[name="vote"]:checked');

  if (!selected) {
    alert("Bitte wählen!");
    return;
  }

  const pollData = JSON.parse(localStorage.getItem("pollData"));
  const index = parseInt(selected.value);

  pollData.votes[index]++;

  localStorage.setItem("pollData", JSON.stringify(pollData));

  renderResults(pollData);
  drawWheel(pollData);
});

// ===========================================
// 8. LOAD ON START
// ===========================================

function init() {
  const saved = localStorage.getItem("pollData");

  if (saved) {
    const pollData = JSON.parse(saved);

    setupScreen.classList.add("hidden");
    votingScreen.classList.remove("hidden");

    renderVotingScreen(pollData);
  }
}

init();

// ===========================================
// 9. RESET BUTTON (FIXED)
// ===========================================

resetPollBtn.addEventListener("click", function () {
  const ok = confirm("Neue Abstimmung starten?");

  if (!ok) return;

  localStorage.removeItem("pollData");

  questionInput.value = "";

  optionsContainer.innerHTML = `
    <label>Option 1:</label>
    <input type="text" class="option-input" placeholder="Option 1">
    <label>Option 2:</label>
    <input type="text" class="option-input" placeholder="Option 2">
  `;

  setupError.textContent = "";

  votingScreen.classList.add("hidden");
  setupScreen.classList.remove("hidden");

  location.reload();
});

// ===========================================
// 10. WHEEL LOGIC
// ===========================================

function calculateSlices(pollData) {
  const votes = pollData.votes;
  const total = votes.reduce((a, b) => a + b, 0);

  const weights = total === 0 ? votes.map(() => 1) : votes;

  const sum = weights.reduce((a, b) => a + b, 0);

  let angle = -Math.PI / 2;
  const slices = [];

  pollData.options.forEach((text, i) => {
    const size = (weights[i] / sum) * (Math.PI * 2);

    slices.push({
      text,
      i,
      start: angle,
      end: angle + size,
      mid: angle + size / 2
    });

    angle += size;
  });

  return slices;
}

function drawWheel(pollData) {
  const w = wheelCanvas.width / 2;
  const h = wheelCanvas.height / 2;
  const r = w - 10;

  ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);

  const slices = calculateSlices(pollData);

  slices.forEach((s, i) => {
    ctx.beginPath();
    ctx.moveTo(w, h);
    ctx.arc(w, h, r, s.start, s.end);
    ctx.closePath();

    ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
    ctx.fill();

    ctx.stroke();
  });
}

// ===========================================
// 11. SPIN
// ===========================================

spinBtn.addEventListener("click", function () {
  const pollData = JSON.parse(localStorage.getItem("pollData"));
  const slices = calculateSlices(pollData);

  spinBtn.disabled = true;
  winnerDisplay.textContent = "";

  const winner = slices[Math.floor(Math.random() * slices.length)];

  const midDeg = winner.mid * (180 / Math.PI);
  let target = (270 - midDeg) % 360;
  if (target < 0) target += 360;

  const spins = 5 + Math.floor(Math.random() * 3);

  const currentMod = currentRotation % 360;
  let diff = target - currentMod;
  if (diff < 0) diff += 360;

  currentRotation += spins * 360 + diff;

  wheelCanvas.style.transform = `rotate(${currentRotation}deg)`;

  setTimeout(() => {
    winnerDisplay.textContent = "Gewinner: " + winner.text;
    spinBtn.disabled = false;
  }, SPIN_DURATION_MS);
});
