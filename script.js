// ===========================================
// 1. GRABBING REFERENCES TO HTML ELEMENTS
// ===========================================
// document.getElementById() finds an element by its "id" attribute.
// We store these in variables so we don't have to search for them
// again every time we need them.

const setupScreen = document.getElementById("setup-screen");
const votingScreen = document.getElementById("voting-screen");

const questionInput = document.getElementById("question-input");
const optionsContainer = document.getElementById("options-container");
const addOptionBtn = document.getElementById("add-option-btn");
const createPollBtn = document.getElementById("create-poll-btn");
const setupError = document.getElementById("setup-error");

const MAX_OPTIONS = 8; // maximum number of answer options allowed
const MIN_OPTIONS = 2; // minimum number of answer options required

// ===========================================
// 2. ADD OPTION BUTTON
// ===========================================
// This function runs every time the user clicks "+ Option hinzufügen".

addOptionBtn.addEventListener("click", function () {
  // Count how many option inputs currently exist on the page
  const currentOptions = document.querySelectorAll(".option-input");

  // If we already have 8 options, stop here and show an error message
  if (currentOptions.length >= MAX_OPTIONS) {
    setupError.textContent = "Maximal 8 Optionen erlaubt.";
    return; // "return" stops the function immediately, nothing below runs
  }

  // Clear any old error message, since we're successfully adding an option
  setupError.textContent = "";

  // Figure out the next option number (e.g. if 2 exist, the new one is "Option 3")
  const nextNumber = currentOptions.length + 1;

  // Create a new <label> element in memory (not yet visible on the page)
  const newLabel = document.createElement("label");
  newLabel.textContent = "Option " + nextNumber + ":";

  // Create a new <input> element in memory
  const newInput = document.createElement("input");
  newInput.type = "text";
  newInput.className = "option-input"; // gives it the same class as the others
  newInput.placeholder = "Option " + nextNumber;

  // Now actually insert both new elements into the page,
  // right inside the #options-container div
  optionsContainer.appendChild(newLabel);
  optionsContainer.appendChild(newInput);
});

// ===========================================
// 3. CREATE POLL BUTTON
// ===========================================

createPollBtn.addEventListener("click", function () {
  // .trim() removes accidental spaces the user might have typed
  // before or after their text (e.g. "  Pizza  " becomes "Pizza")
  const question = questionInput.value.trim();

  // Grab ALL option input fields currently on the page
  const optionInputs = document.querySelectorAll(".option-input");

  // Build a plain list (array) of the typed option texts.
  // We use .map() to convert each <input> element into just its text value.
  let options = Array.from(optionInputs).map(function (input) {
    return input.value.trim();
  });

  // Remove any empty options (in case the user left a field blank)
  options = options.filter(function (text) {
    return text !== "";
  });

  // --- VALIDATION ---
  // Check the question isn't empty
  if (question === "") {
    setupError.textContent = "Bitte gib eine Frage ein.";
    return;
  }

  // Check we have enough non-empty options
  if (options.length < MIN_OPTIONS) {
    setupError.textContent = "Bitte gib mindestens 2 Optionen ein.";
    return;
  }

  // If we reach this point, everything is valid! Clear any old error.
  setupError.textContent = "";

  // --- BUILD THE POLL OBJECT ---
  // "votes" is an array of zeros, one for each option, e.g. [0, 0, 0]
  // meaning: option 0 has 0 votes, option 1 has 0 votes, etc.
  const pollData = {
    question: question,
    options: options,
    votes: options.map(function () {
      return 0;
    })
  };

  // --- SAVE TO LOCALSTORAGE ---
  // localStorage can only store TEXT (strings), so we convert our
  // JavaScript object into a text format called JSON using JSON.stringify().
  localStorage.setItem("pollData", JSON.stringify(pollData));

  // --- SWITCH SCREENS ---
  setupScreen.classList.add("hidden");    // hide the setup screen
  votingScreen.classList.remove("hidden"); // show the voting screen

  // Fill in the voting screen with our new poll's data
  renderVotingScreen(pollData);
});

// ===========================================
// 4. RENDER VOTING SCREEN
// ===========================================
// This function takes a pollData object and displays it:
// - shows the question
// - creates one radio button per option
// We'll call this both when a poll is first created, AND when the
// page is refreshed and we need to reload an existing poll.

const votingQuestion = document.getElementById("voting-question");
const voteOptionsContainer = document.getElementById("vote-options-container");
const resultsList = document.getElementById("results-list");

function renderVotingScreen(pollData) {
  // Show the question text
  votingQuestion.textContent = pollData.question;

  // Clear out any old radio buttons before adding new ones
  // (important for when we reload data after a refresh)
  voteOptionsContainer.innerHTML = "";

  // Loop through every option and create a radio button + label for it
  pollData.options.forEach(function (optionText, index) {
    // Each radio button needs a unique "id" so its <label> can point to it
    const optionId = "option-" + index;

    // Create the radio input
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "vote"; // SAME "name" for all = only one can be selected at a time
    radio.value = index; // we store the option's index (0, 1, 2...) as its value
    radio.id = optionId;

    // Create the label and connect it to the radio button above
    const label = document.createElement("label");
    label.setAttribute("for", optionId); // clicking the label also selects the radio
    label.textContent = optionText;

    // Insert the radio BEFORE its label's text, wrapped together
    label.prepend(radio); // puts the radio button at the very start of the label

    voteOptionsContainer.appendChild(label);
  });

  // Also update the results list to show current vote counts
  renderResults(pollData);

  // Draw the wheel based on the current vote counts
  drawWheel(pollData);
}

// ===========================================
// 5. RENDER RESULTS LIST
// ===========================================
// Shows "OptionText: X Stimmen" for every option.

function renderResults(pollData) {
  resultsList.innerHTML = ""; // clear old results first

  pollData.options.forEach(function (optionText, index) {
    const li = document.createElement("li");
    li.textContent = optionText + ": " + pollData.votes[index] + " Stimmen";
    resultsList.appendChild(li);
  });
}

// ===========================================
// 6. HANDLE VOTE SUBMISSION
// ===========================================

const voteForm = document.getElementById("vote-form");

voteForm.addEventListener("submit", function (event) {
  // By default, submitting a <form> reloads the whole page.
  // preventDefault() stops that, so we can handle it ourselves with JS.
  event.preventDefault();

  // Find which radio button is currently selected.
  // 'input[name="vote"]:checked' means: "an <input> named 'vote' that is checked"
  const selectedRadio = document.querySelector('input[name="vote"]:checked');

  // If nothing is selected, selectedRadio will be "null" (nothing found)
  if (!selectedRadio) {
    setupError.textContent = ""; // (just in case, though this is a different screen)
    alert("Bitte wähle eine Option aus, bevor du abstimmst.");
    return;
  }

  // Load the current poll data fresh from localStorage
  // (important in case it changed, e.g. in another browser tab)
  const pollData = JSON.parse(localStorage.getItem("pollData"));

  // selectedRadio.value is a STRING (e.g. "0"), so we convert it to a number
  const selectedIndex = parseInt(selectedRadio.value);

  // Increase the vote count for that specific option by 1
  pollData.votes[selectedIndex] = pollData.votes[selectedIndex] + 1;

  // Save the updated data back into localStorage
  localStorage.setItem("pollData", JSON.stringify(pollData));

  // Update the results list on screen to reflect the new vote
  renderResults(pollData);

  // Update the wheel too, since slice sizes depend on vote counts
  drawWheel(pollData);
});

// ===========================================
// 7. LOAD EXISTING POLL ON PAGE START
// ===========================================
// This code runs immediately when script.js loads (not inside any
// button click). It checks: "was there already a poll saved from
// before?" If yes, skip the setup screen and go straight to voting.

const savedPollData = localStorage.getItem("pollData");

if (savedPollData) {
  // A poll already exists! Convert it back into an object...
  const pollData = JSON.parse(savedPollData);

  // ...and show the voting screen instead of the setup screen.
  setupScreen.classList.add("hidden");
  votingScreen.classList.remove("hidden");
  renderVotingScreen(pollData);
}
// If savedPollData is null (nothing saved yet), we do nothing here,
// and the setup screen stays visible by default - exactly what we want.

// ===========================================
// 8. RESET POLL BUTTON
// ===========================================

const resetPollBtn = document.getElementById("reset-poll-btn");

resetPollBtn.addEventListener("click", function () {
  const confirmed = confirm("Möchtest du wirklich eine neue Abstimmung starten? Alle aktuellen Stimmen gehen verloren.");

  if (!confirmed) {
    return; // user clicked "Cancel", so do nothing
  }

  // Remove ALL app data from localStorage (not just one key), so no
  // stale value can possibly survive under any key we might have used.
  localStorage.clear();

  // Force a full reload of the page. This is the safest way to guarantee
  // a "fresh first visit" state: it wipes every in-memory JavaScript
  // variable (currentRotation, etc.) and re-runs script.js from the top,
  // which will find nothing in localStorage and show the empty setup
  // screen - exactly like a brand new visitor.
  location.reload();
});

// ===========================================
// 9. WHEEL DRAWING
// ===========================================

const wheelCanvas = document.getElementById("wheel-canvas");
const ctx = wheelCanvas.getContext("2d"); // "2d" = we're drawing flat 2D shapes

// A vivid color palette matching our arcade theme - one color per slice.
// If there are more than 8 options... well, MAX_OPTIONS is 8, so we're covered!
const WHEEL_COLORS = [
  "#ff2e88", // pink
  "#00e5ff", // cyan
  "#ffe600", // yellow
  "#39ff14", // green
  "#ff6b35", // orange
  "#b537f2", // purple
  "#00ff9f", // mint
  "#ff073a"  // red
];

// This helper calculates the start/end/middle angle (in radians) for
// each slice, based on how many votes each option has. We put this in
// its own function because BOTH drawing the wheel AND spinning it later
// need to know exactly where each slice is located.
function calculateSlices(pollData) {
  const votes = pollData.votes;
  const totalVotes = votes.reduce(function (sum, v) { return sum + v; }, 0);

  // If nobody has voted yet, give every option an EQUAL slice (weight = 1).
  // Otherwise, use the actual vote counts as weights.
  const weights = totalVotes === 0
    ? votes.map(function () { return 1; })
    : votes;

  const weightSum = weights.reduce(function (sum, w) { return sum + w; }, 0);

  let currentAngle = -Math.PI / 2; // start at the TOP of the circle (12 o'clock)
  const slices = [];

  pollData.options.forEach(function (optionText, index) {
    // This slice's share of the full circle (2 * PI radians = 360 degrees)
    const sliceAngle = (weights[index] / weightSum) * (2 * Math.PI);
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;

    slices.push({
      optionText: optionText,
      index: index,
      startAngle: startAngle,
      endAngle: endAngle,
      midAngle: startAngle + sliceAngle / 2
    });

    currentAngle = endAngle; // the next slice starts where this one ended
  });

  return slices;
}

function drawWheel(pollData) {
  const centerX = wheelCanvas.width / 2;
  const centerY = wheelCanvas.height / 2;
  const radius = centerX - 10; // small gap so the border doesn't get cut off

  // Clear the entire canvas before redrawing (otherwise old slices stay behind)
  ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);

  const slices = calculateSlices(pollData);

  slices.forEach(function (slice) {
    // --- Draw the colored slice (a "pie" shape) ---
    ctx.beginPath();
    ctx.moveTo(centerX, centerY); // start at the center
    ctx.arc(centerX, centerY, radius, slice.startAngle, slice.endAngle); // draw the curved edge
    ctx.closePath(); // draws a straight line back to the center, completing the slice
    ctx.fillStyle = WHEEL_COLORS[slice.index % WHEEL_COLORS.length];
    ctx.fill();
    ctx.strokeStyle = "#1a1a2e"; // dark outline between slices
    ctx.lineWidth = 3;
    ctx.stroke();

    // --- Draw the option text along the slice ---
    ctx.save(); // remember the current canvas settings so we can restore them after
    ctx.translate(centerX, centerY); // move the "origin" to the wheel's center
    ctx.rotate(slice.midAngle); // rotate so we can write text pointing outward
    ctx.textAlign = "right";
    ctx.fillStyle = "#1a1a2e";
    ctx.font = "bold 16px 'VT323', monospace";
    ctx.fillText(slice.optionText, radius - 15, 5);
    ctx.restore(); // undo the translate/rotate for the next slice
  });
}

// ===========================================
// 10. SPIN THE WHEEL
// ===========================================

const spinBtn = document.getElementById("spin-btn");
const winnerDisplay = document.getElementById("winner-display");

// This tracks the TOTAL rotation applied so far (it only ever grows).
// We never reset it to 0, so each new spin always turns FORWARD from
// wherever the wheel currently is - avoiding an ugly instant "snap back".
let currentRotation = 0;

const SPIN_DURATION_MS = 4000; // must match the "4s" in the CSS transition!

// --- Picks a winning slice, weighted by vote count ---
// Imagine the circle's edge as a number line from -90deg to +270deg.
// We drop a "dart" at a random point along that line. Bigger slices
// take up more space on the line, so they're more likely to get hit.
function pickWinner(slices) {
  const randomPoint = -Math.PI / 2 + Math.random() * (2 * Math.PI);

  for (let i = 0; i < slices.length; i++) {
    if (randomPoint >= slices[i].startAngle && randomPoint < slices[i].endAngle) {
      return slices[i];
    }
  }
  // Fallback (only happens due to rare floating-point rounding at the very edge)
  return slices[slices.length - 1];
}

spinBtn.addEventListener("click", function () {
  const pollData = JSON.parse(localStorage.getItem("pollData"));
  const slices = calculateSlices(pollData);

  // Disable the button so users can't click "Spin" again mid-animation
  spinBtn.disabled = true;
  winnerDisplay.textContent = "";

  // Decide the winner FIRST (before any animation) using weighted randomness
  const winnerSlice = pickWinner(slices);

  // --- Figure out how many degrees to rotate so the winner lands under the pointer ---
  // Convert the winning slice's middle angle from radians to degrees
  const midDeg = winnerSlice.midAngle * (180 / Math.PI);

  // The pointer sits at the TOP, which is -90deg (i.e. 270deg) in our system.
  // We calculate how many degrees the wheel needs to turn so that this
  // slice's middle ends up exactly at that position.
  let targetRotation = (270 - midDeg) % 360;
  if (targetRotation < 0) targetRotation += 360; // keep it positive (0-359)

  // Add a few extra full spins purely for visual excitement (5, 6, or 7 turns)
  const extraSpins = 5 + Math.floor(Math.random() * 3);

  // Since currentRotation keeps growing, find out where the wheel
  // "visually" is right now (its rotation modulo 360)...
  const currentMod = currentRotation % 360;

  // ...then calculate the shortest FORWARD distance to our target angle
  let diff = targetRotation - currentMod;
  if (diff < 0) diff += 360;

  // Final rotation = everything so far + full extra spins + the precise adjustment
  currentRotation = currentRotation + extraSpins * 360 + diff;

  // Apply the rotation - the CSS "transition" we wrote makes this animate smoothly
  wheelCanvas.style.transform = "rotate(" + currentRotation + "deg)";

  // Wait for the animation to finish before announcing the winner
  setTimeout(function () {
    winnerDisplay.textContent = "🎉 Gewinner: " + winnerSlice.optionText + "!";
    spinBtn.disabled = false;
  }, SPIN_DURATION_MS);
});
