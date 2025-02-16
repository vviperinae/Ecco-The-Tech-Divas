document.addEventListener("DOMContentLoaded", function () {
  const loggedInUser = localStorage.getItem("loggedInUser");
  if (loggedInUser) {
    hideLoginSignupForms(); 
    showProfileIcon(loggedInUser);
  }

  initializeChatbot();
  initializeWasteClassification();
  initializeLoginSignup();
  initializeMobileMenu();
  initializeLeaderboard();
  initializeBinData();
});

function hideLoginSignupForms() {
  const loginItem = document.getElementById("loginItem");
  const signupItem = document.getElementById("signupItem");
  const profileItem = document.getElementById("profileItem");

  if (loginItem) loginItem.style.display = "none";
  if (signupItem) signupItem.style.display = "none";
  if (profileItem) profileItem.style.display = "block";
}

function showProfileIcon(username) {
  const profileItem = document.getElementById("profileItem");
  if (profileItem) {
    profileItem.innerHTML = `<a href="#" class="navbar__links"><i class="fas fa-user"></i> ${username}</a>`;
  }
}

function initializeChatbot() {
  const chatbotContainer = document.getElementById("chatbot-container");
  const closeBtn = document.getElementById("close-btn");
  const sendBtn = document.getElementById("send-btn");
  const chatbotInput = document.getElementById("chatbot-input");
  const chatbotMessages = document.getElementById("chatbot-messages");
  const chatbotIcon = document.getElementById("chatbot-icon");

  chatbotIcon.addEventListener("click", () => toggleChatbotVisibility(true));
  closeBtn.addEventListener("click", () => toggleChatbotVisibility(false));
  sendBtn.addEventListener("click", sendMessage);
  chatbotInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  function toggleChatbotVisibility(show) {
    chatbotContainer.classList.toggle("hidden", !show);
    chatbotIcon.style.display = show ? "none" : "flex";
  }

  function sendMessage() {
    const userMessage = chatbotInput.value.trim();
    if (userMessage) {
      appendMessage("user", userMessage);
      chatbotInput.value = "";
      getBotResponse(userMessage);
    }
  }

  function appendMessage(sender, message) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", sender);
    messageElement.textContent = message;
    chatbotMessages.appendChild(messageElement);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  async function getBotResponse(userMessage) {
    const apiKey = "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";
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: userMessage }],
          max_tokens: 150,
        }),
      });

      const data = await response.json();
      const botMessage = data.choices[0].message.content;
      appendMessage("bot", botMessage);
    } catch (error) {
      console.error("Error fetching bot response:", error);
      appendMessage("bot", "Sorry, something went wrong. Please try again.");
    }
  }
}

function initializeWasteClassification() {
  if (!document.getElementById("webcam")) {
    return; // Exit if not on the AI Sorting page
  }

  let model;
  let userPoints = 0;

  const webcamElement = document.getElementById("webcam");
  const canvasElement = document.getElementById("webcam-canvas");
  const captureButton = document.getElementById("capture-btn");
  const predictionsElement = document.getElementById("waste-predictions");

  async function loadModel() {
    try {
      model = await mobilenet.load();
      console.log("Model loaded successfully!");
    } catch (error) {
      console.error("Error loading model:", error);
    }
  }

  async function setupWebcam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      webcamElement.srcObject = stream;
      console.log("Webcam accessed");
    } catch (error) {
      console.error("Error accessing webcam:", error);
    }
  }

  function captureImage() {
    const context = canvasElement.getContext("2d");
    canvasElement.width = webcamElement.videoWidth;
    canvasElement.height = webcamElement.videoHeight;
    context.drawImage(webcamElement, 0, 0, canvasElement.width, canvasElement.height);
    classifyImage(canvasElement);
  }

  async function classifyImage(imageElement) {
    try {
      const predictions = await model.classify(imageElement);
      displayPredictions(predictions);
      incrementPoints();
    } catch (error) {
      console.error("Error classifying image:", error);
    }
  }

  function displayPredictions(predictions) {
    predictionsElement.innerHTML = "<h3>Predictions:</h3>";

    const maxPrediction = predictions.reduce((max, prediction) => {
      return prediction.probability > max.probability ? prediction : max;
    });

    const { category, bin } = getWasteCategoryAndBin(maxPrediction.className);
    predictionsElement.innerHTML += `
      <p>${maxPrediction.className} (${Math.round(maxPrediction.probability * 100)}%)</p>
      <p><strong>Category:</strong> ${category}</p>
      <p><strong>Dispose in:</strong> ${bin}</p>
    `;
  }

  function getWasteCategoryAndBin(className) {
    const wasteMapping = {
      banana: { category: "Organic", bin: "Green Bin" },
      apple: { category: "Organic", bin: "Green Bin" },
      bottle: { category: "Recyclable", bin: "Blue Bin" },
      can: { category: "Recyclable", bin: "Blue Bin" },
      paper: { category: "Recyclable", bin: "Blue Bin" },
      cardboard: { category: "Recyclable", bin: "Blue Bin" },
      plastic: { category: "Recyclable", bin: "Blue Bin" },
      glass: { category: "Recyclable", bin: "Blue Bin" },
      metal: { category: "Recyclable", bin: "Blue Bin" },
      battery: { category: "Hazardous", bin: "Red Bin" },
      electronics: { category: "E-Waste", bin: "Yellow Bin" },
      clothing: { category: "Textile", bin: "Donation Bin" },
      default: { category: "General Waste", bin: "Black Bin" },
    };

    for (const key in wasteMapping) {
      if (className.toLowerCase().includes(key)) {
        return wasteMapping[key];
      }
    }

    return wasteMapping["default"];
  }

  function incrementPoints() {
    userPoints += 10;
    document.getElementById("user-points").textContent = userPoints;
    alert("+10 points for segregating waste!");
  }

  async function init() {
    await loadModel();
    await setupWebcam();
  }

  captureButton.addEventListener("click", captureImage);
  init();
}
function initializeMobileMenu() {
  const mobileMenu = document.getElementById("mobile-menu");
  const navbarMenu = document.querySelector(".navbar__menu");
  const dropdown = document.querySelector(".dropdown");

  mobileMenu.addEventListener("click", () => {
    navbarMenu.classList.toggle("active");
  });

  dropdown.addEventListener("click", () => {
    const dropdownMenu = dropdown.querySelector(".dropdown-menu");
    dropdownMenu.classList.toggle("active");
  });
}

function initializeLeaderboard() {
  function updateLeaderboard() {
    const leaderboardElement = document.getElementById("leaderboard");
    leaderboardElement.innerHTML = "";

    const users = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== "loggedInUser") {
        const userData = JSON.parse(localStorage.getItem(key));
        users.push({ name: key, totalPoints: userData.points || 0 });
      }
    }

    users.sort((a, b) => b.totalPoints - a.totalPoints);
    users.forEach((user, index) => {
      const listItem = document.createElement("li");
      listItem.textContent = `${index + 1}. ${user.name} - ${user.totalPoints} pts`;
      leaderboardElement.appendChild(listItem);
    });
  }

  updateLeaderboard();
}

function initializeBinData() {
  let binData = {
    green: { fullness: 0 },
    blue: { fullness: 0 },
    red: { fullness: 0 },
    yellow: { fullness: 0 },
  };

  function updateBinFullness(category) {
    switch (category) {
      case "Organic":
        binData.green.fullness += 10;
        break;
      case "Recyclable":
        binData.blue.fullness += 10;
        break;
      case "Hazardous":
        binData.red.fullness += 10;
        break;
      case "E-Waste":
        binData.yellow.fullness += 10;
        break;
      default:
        break;
    }
    updateBinData();
  }

  function resetBinFullness() {
    binData.green.fullness = 0;
    binData.blue.fullness = 0;
    binData.red.fullness = 0;
    binData.yellow.fullness = 0;
    updateBinData();
  }

  function updateCollectionSchedule(binId, fullness) {
    if (fullness >= 80) {
      return `Collection scheduled for <strong>tomorrow at 9 AM</strong>.`;
    } else if (fullness >= 50) {
      return `Collection scheduled for <strong>this Friday at 9 AM</strong>.`;
    } else {
      return `No immediate collection needed.`;
    }
  }

  function updateBinData() {
    for (const [bin, data] of Object.entries(binData)) {
      const fullnessElement = document.getElementById(`${bin}-fullness`);
      const scheduleElement = document.getElementById(`${bin}-schedule`);

      fullnessElement.textContent = `${data.fullness}%`;
      scheduleElement.innerHTML = updateCollectionSchedule(bin, data.fullness);
    }
  }

  document.getElementById("reset-collection").addEventListener("click", resetBinFullness);
  updateBinData();
}

function initializeLoginSignup() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const loginMessage = document.getElementById("loginMessage");

      loginMessage.innerHTML = "";
      loginMessage.classList.remove("success", "error");

      try {
        const response = await fetch("http://localhost:3600/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (response.ok) {
          loginMessage.innerHTML = "Login successful! Redirecting...";
          loginMessage.classList.add("success");
          localStorage.setItem("loggedInUser", username);
          setTimeout(() => {
            window.location.href = "index.html";
          }, 1000);
        } else {
          loginMessage.innerHTML = data.error || "Invalid username or password";
          loginMessage.classList.add("error");
        }
      } catch (err) {
        console.error("Error during login:", err);
        loginMessage.innerHTML = "An error occurred during login. Please try again.";
        loginMessage.classList.add("error");
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const signupMessage = document.getElementById("signupMessage");

      signupMessage.innerHTML = "";
      signupMessage.classList.remove("success", "error");

      try {
        const response = await fetch("http://localhost:3600/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (response.ok) {
          signupMessage.innerHTML = "Signup successful! Redirecting to login...";
          signupMessage.classList.add("success");
          setTimeout(() => {
            window.location.href = "login.html";
          }, 1000);
        } else {
          signupMessage.innerHTML = data.error || "Username already exists";
          signupMessage.classList.add("error");
        }
      } catch (err) {
        console.error("Error during signup:", err);
        signupMessage.innerHTML = "An error occurred during signup. Please try again.";
        signupMessage.classList.add("error");
      }
    });
  }
}

