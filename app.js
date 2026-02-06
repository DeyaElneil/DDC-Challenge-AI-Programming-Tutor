// ======================================================
// ELEMENT REFERENCES
// ======================================================
const dashboard = document.getElementById("dashboard");
const chatStage = document.getElementById("chatStage");
const startBtn = document.getElementById("startBtn");
const themeToggle = document.getElementById("themeToggle");
const themeLabel = document.getElementById("themeLabel");
const chatWindow = document.getElementById("chatWindow");
const typingIndicator = document.getElementById("typingIndicator");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const micBtn = document.getElementById("micBtn");
const homeBtn = document.getElementById("homeBtn");
const collapseBtn = document.getElementById("collapseCompilerBtn");
const restoreBtn = document.getElementById("restoreCompilerBtn");
const compilerPanel = document.getElementById("compilerPanel");
const workspace = document.querySelector(".workspace");

let isDark = false;


// ======================================================
// AI STATE MACHINE + HISTORY
// ======================================================
let aiState = "idle";
let conversationHistory = [];

const confirmations = [
  "yes", "yeah", "yep", "ok", "okay", "continue",
  "go on", "sure", "understood", "proceed"
];


// ======================================================
// UI TRANSITIONS
// ======================================================
startBtn.addEventListener("click", () => {
  dashboard.classList.add("slide-down");
  chatStage.classList.add("active");
  document.getElementById("compilerContainer").style.display = "flex";
});

collapseBtn.addEventListener("click", () => {
  compilerPanel.classList.add("collapsed");
  restoreBtn.style.display = "flex";
  workspace.classList.add("centered");
});

restoreBtn.addEventListener("click", () => {
  compilerPanel.classList.remove("collapsed");
  restoreBtn.style.display = "none";
  workspace.classList.remove("centered");
});


homeBtn.addEventListener("click", () => {
  dashboard.classList.remove("slide-down");
  chatStage.classList.remove("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.getElementById("collapseCompilerBtn").addEventListener("click", () => {
  document.getElementById("compilerPanel").classList.toggle("collapsed");
});
// ======================================================
// THEME TOGGLE
// ======================================================
themeToggle.addEventListener("click", () => {
  isDark = !isDark;
  document.body.setAttribute("data-theme", isDark ? "dark" : "light");
  themeLabel.textContent = isDark ? "Dark" : "Light";
  themeToggle.firstElementChild.textContent = isDark ? "🌙" : "☀";
});


// ======================================================
// ADD MESSAGE (Markdown + Avatar + History)
// ======================================================
function addMessage(text, sender) {
  const row = document.createElement("div");
  row.className = "message-row " + sender;

  if (sender === "ai") {
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "AI";
    row.appendChild(avatar);
  }

  const bubble = document.createElement("div");
  bubble.className = "message-bubble " + sender;

  // Render Markdown like Copilot
  bubble.innerHTML = marked.parse(text);

  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Save to history
  conversationHistory.push({ sender, text });
}


// ======================================================
// SEND MESSAGE (State Machine + History + Continue Logic)
// ======================================================
async function sendMessage(text) {
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";
  typingIndicator.style.display = "block";

  const isConfirmation = confirmations.includes(text.toLowerCase());

  try {
    const res = await fetch("http://localhost:4000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        state: aiState,
        continue: isConfirmation,
        history: conversationHistory
      })
    });

    const data = await res.json();
    typingIndicator.style.display = "none";

    addMessage(data.reply || "No response from AI.", "ai");

    if (data.nextState) {
      aiState = data.nextState;
    }

  } catch (err) {
    typingIndicator.style.display = "none";
    addMessage("There was an error contacting the server.", "ai");
  }
}


// ======================================================
// SEND BUTTON + ENTER KEY
// ======================================================
sendBtn.addEventListener("click", () => {
  const text = userInput.value.trim();
  sendMessage(text);
});

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const text = userInput.value.trim();
    sendMessage(text);
  }
});


// ======================================================
// RECENT ITEMS
// ======================================================
document.querySelectorAll(".recent-item").forEach(item => {
  item.addEventListener("click", () => {
    const text = item.textContent;
    userInput.value = text;
    sendMessage(text);
  });
});


// ======================================================
// SUGGESTED PROMPTS
// ======================================================
document.querySelectorAll(".suggest-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    const prompt = chip.getAttribute("data-prompt");
    userInput.value = prompt;
    sendMessage(prompt);
  });
});


// ======================================================
// DRAG & DROP
// ======================================================
["dragenter", "dragover"].forEach(evt => {
  dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach(evt => {
  dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove("dragover");
  });
});

dropZone.addEventListener("drop", (e) => {
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    addMessage("File detected: " + file.name + ". You can now reference it in your question.", "ai");
  }
});


// ======================================================
// FILE UPLOAD
// ======================================================
uploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    addMessage("Uploaded file: " + file.name + ". You can now reference it in your question.", "ai");
  }
});


// ======================================================
// VOICE INPUT PLACEHOLDER
// ======================================================
micBtn.addEventListener("click", () => {
  alert("Voice input placeholder — Web Speech API can be added later.");
});