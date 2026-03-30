// SECURE PLACEHOLDERS - The GitHub Robot replaces these during deployment
const GEMINI_API_KEY = "INSERT_GEMINI_KEY_HERE";
const MURF_API_KEY = "INSERT_MURF_KEY_HERE";

let currentAudio = null;
let profile = { name: "", family: "" };
let schedule = {};

// --- PROFILE LOGIC ---
window.onload = () => {
    loadProfile();
};

function loadProfile() {
    const saved = localStorage.getItem("voiceAssistantProfile");
    if (saved) {
        profile = JSON.parse(saved);
        document.getElementById("profileSection").style.display = "none";
        addMessage(`Welcome back, ${profile.name}!`, "ai");
    } else {
        document.getElementById("profileSection").style.display = "flex";
    }
}

function saveProfile() {
    const name = document.getElementById("userName").value.trim();
    const number = document.getElementById("familyNumber").value.trim();
    if (!name || !number) {
        alert("Please enter name and number");
        return;
    }
    profile.name = name;
    profile.family = number;
    localStorage.setItem("voiceAssistantProfile", JSON.stringify(profile));
    document.getElementById("profileSection").style.display = "none";
    addMessage(`Welcome, ${profile.name}!`, "ai");
}

// --- AI LOGIC (GEMINI) ---
async function generateReplyGemini(userText) {
    const URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: userText }] }]
            })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        }
        return "I couldn't process that. Try asking differently.";
    } catch (error) {
        return "Network error. Check your connection.";
    }
}

// --- VOICE LOGIC (MURF) ---
async function speakWithMurf(text) {
    // STOP logic
    if (text.toLowerCase().includes("stop")) {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        return;
    }

    try {
        const response = await fetch("https://api.murf.ai/v1/speech/generate", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "api-key": MURF_API_KEY 
            },
            body: JSON.stringify({ 
                voiceId: "en-US-natalie", 
                text: text, 
                format: "mp3" 
            })
        });
        const data = await response.json();
        if (data.audioFile) {
            if (currentAudio) currentAudio.pause(); // Stop previous audio
            currentAudio = new Audio(data.audioFile);
            currentAudio.play();
        }
    } catch (err) {
        console.error("Murf Error:", err);
    }
}

// --- CORE FUNCTIONS ---
function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Browser does not support speech recognition.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = document.getElementById("languageSelect").value;
    document.getElementById("status").innerText = "Listening...";
    recognition.start();

    recognition.onresult = async (event) => {
        const userText = event.results[0][0].transcript;
        addMessage(userText, "user");
        document.getElementById("status").innerText = "Thinking...";
        const reply = await generateReplyGemini(userText);
        addMessage(reply, "ai");
        speakWithMurf(reply);
        document.getElementById("status").innerText = "Click to speak again";
    };
}

function addMessage(text, type) {
    const chatbox = document.getElementById("chatbox");
    const div = document.createElement("div");
    div.classList.add("message", type);
    div.innerText = text;
    chatbox.appendChild(div);
    chatbox.scrollTop = chatbox.scrollHeight;
}

// Emergency Call Function
document.getElementById("emergencyBtn").addEventListener("click", () => {
    if (profile.family) {
        addMessage("Emergency alert! Calling family.", "ai");
        window.location.href = `tel:${profile.family}`;
    } else {
        alert("Please save an emergency contact first.");
    }
});

// Reminder System
setInterval(() => {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    if (schedule.medicine === currentTime) speakWithMurf("Reminder: It is time for your medicine.");
}, 60000);
