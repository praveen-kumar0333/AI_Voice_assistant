// DO NOT put your real keys here. The GitHub Robot will replace these.


let currentAudio = null;
function loadProfile(){
  const saved = localStorage.getItem("voiceAssistantProfile");
  if(saved){
    profile = JSON.parse(saved);
    document.getElementById("profileSection").style.display = "none";
    addMessage(`Welcome back, ${profile.name}!`,"ai");
  } else {
    document.getElementById("profileSection").style.display = "flex";
  }
}

window.onload = () => {
    const saved = localStorage.getItem("voiceAssistantProfile");

    if (saved) {
        profile = JSON.parse(saved);
        document.getElementById("profileSection").style.display = "none";
        addMessage(`Welcome back, ${profile.name}!`, "ai");
    } else {
        document.getElementById("profileSection").style.display = "flex";
    }
};


function saveProfile(){
  const name = document.getElementById("userName").value.trim();
  const number = document.getElementById("familyNumber").value.trim();
  if(!name || !number){ 
    alert("Please enter name and number"); 
    return; 
  }
  profile.name = name;
  profile.family = number;
  localStorage.setItem("voiceAssistantProfile", JSON.stringify(profile));
  document.getElementById("profileSection").style.display = "none";
  addMessage(`Welcome, ${profile.name}!`,"ai");
}

document.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem("voiceAssistantProfile");

    if (saved) {
        profile = JSON.parse(saved);
        document.getElementById("profileSection").style.display = "none";
    } else {
        document.getElementById("profileSection").style.display = "flex";
    }
});






// const GEMINI_API_KEY = CONFIG.GEMINI_API_KEY; 
// const MURF_API_KEY = CONFIG.MURF_API_KEY;




const GEMINI_API_KEY = "INSERT_GEMINI_KEY_HERE";
const MURF_API_KEY = "INSERT_MURF_KEY_HERE";

let profile = {};
let schedule = {};


window.onload = () => {
    loadProfile();
};

function loadProfile(){
  const saved = localStorage.getItem("voiceAssistantProfile");
  if(saved){
    profile = JSON.parse(saved);
    document.getElementById("profileSection").style.display = "none";
    addMessage(`Welcome back, ${profile.name}!`,"ai");
  } else {
    document.getElementById("profileSection").style.display = "flex";
  }
}

function saveProfile(){
  const name = document.getElementById("userName").value.trim();
  const number = document.getElementById("familyNumber").value.trim();
  if(!name || !number){ 
    alert("Please enter name and number"); 
    return; 
  }
  profile.name = name;
  profile.family = number;
  localStorage.setItem("voiceAssistantProfile", JSON.stringify(profile));
  document.getElementById("profileSection").style.display = "none";
  addMessage(`Welcome, ${profile.name}!`,"ai");
}

async function generateReplyGemini(userText) {
    
    const API_KEY = GEMINI_API_KEY; 
    
    
    const URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
    
    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ text: userText }] 
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Gemini Error:", data.error.message);
            return "AI Error: " + data.error.message;
        }

        if (data.candidates && data.candidates[0].content) {
           
            return data.candidates[0].content.parts[0].text;
        } else {
            return "I couldn't process that. Try asking in a different way.";
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        return "Network error. Check your connection.";
    }
}

async function speakWithMurf(text) {
        if (text.toLowerCase() === "stop") {
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
            const audio = new Audio(data.audioFile);
            audio.play();
        }
    } catch (err) {
        console.error("Murf Error:", err);
    }
}

function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Your browser does not support speech recognition.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = document.getElementById("languageSelect").value;
    document.getElementById("status").innerText = "Listening...";
    document.getElementById("voiceAnimation").classList.add("active");
    recognition.start();

    recognition.onresult = async function(event) {
        document.getElementById("voiceAnimation").classList.remove("active");
        const userText = event.results[0][0].transcript;
        addMessage(userText, "user");

        document.getElementById("status").innerText = "Thinking...";
        const reply = await generateReplyGemini(userText);
        
        addMessage(reply, "ai");
        speakWithMurf(reply);
        document.getElementById("status").innerText = "Click to speak again";
    };

    recognition.onerror = () => {
        document.getElementById("voiceAnimation").classList.remove("active");
        document.getElementById("status").innerText = "Error occurred. Try again.";
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

function clearChat() {
    document.getElementById("chatbox").innerHTML = "";
}

async function askGemini() {
    const input = document.getElementById("userInputText");
    const text = input.value.trim();
    if (!text) return;

   
    if (text.toLowerCase() === "stop") {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            addMessage("Audio stopped.", "ai");
        }
        input.value = "";
        return;
    }

    addMessage(text, "user");
    input.value = ""; 

    const reply = await generateReplyGemini(text);
    addMessage(reply, "ai");
    speakWithMurf(reply);
}

function generateSpeech() {
    const text = document.getElementById("ttsInput").value.trim();
    if (!text) {
        alert("Please enter some text!");
        return;
    }
    addMessage(text, "user");
    speakWithMurf(text);
}


function callFamily() {
    const msg = "Emergency alert triggered. Contacting family.";
    addMessage(msg, "ai");
    speakWithMurf(msg);
    setTimeout(() => {
        if (profile.family) {
            window.location.href = `tel:${profile.family}`;
        }
    }, 2000);
}

document.getElementById("emergencyBtn").addEventListener("click", () => {
    if (profile.family) callFamily();
    else alert("Please save an emergency contact in your profile first.");
});

function saveSchedule() {
    schedule.medicine = document.getElementById("medicineTime").value;
    schedule.exercise = document.getElementById("exerciseTime").value;
    schedule.lunch = document.getElementById("lunchTime").value;
    schedule.dinner = document.getElementById("dinnerTime").value;
    alert("Reminders set successfully!");
}

setInterval(() => {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    
    if (schedule.medicine === currentTime) speakWithMurf("Reminder: It is time for your medicine.");
    if (schedule.exercise === currentTime) speakWithMurf("Reminder: It is time for your exercise.");
    if (schedule.lunch === currentTime) speakWithMurf("Reminder: It is lunch time.");
    if (schedule.dinner === currentTime) speakWithMurf("Reminder: It is dinner time.");
}, 60000);

const translations = {
  "en-US": {
    mainTitle: "🤖 VoiceTask AI Assistant",
    subTitle: "Your smart voice companion",
    profileTitle: "👤 User Profile",
    userName: "Enter your name",
    familyNumber: "Emergency Contact Number",
    saveProfileBtn: "Save Profile",
    scheduleTitle: "⏰ Daily Reminder Setup",
    medicineLabel: "💊 Medicine Time",
    exerciseLabel: "🏃 Exercise Time",
    lunchLabel: "🍛 Lunch Time",
    dinnerLabel: "🌙 Dinner Time",
    saveScheduleBtn: "Save Schedule",
    startBtn: "🎤 Start Speaking",
    clearBtn: "🧹 Clear Chat",
    statusText: "Click the button and start speaking",
    emergencyBtn: "🚨 EMERGENCY"
  },

  "hi-IN": {
    mainTitle: "🤖 वॉइसटास्क एआई असिस्टेंट",
    subTitle: "छात्रों और बुजुर्गों के लिए आपका स्मार्ट वॉइस साथी",
    profileTitle: "👤 उपयोगकर्ता प्रोफ़ाइल",
    userName: "अपना नाम दर्ज करें",
    familyNumber: "आपातकालीन संपर्क नंबर",
    saveProfileBtn: "सहेजें",
    scheduleTitle: "⏰ दैनिक अनुस्मारक सेटअप",
    medicineLabel: "💊 दवा का समय",
    exerciseLabel: "🏃 व्यायाम का समय",
    lunchLabel: "🍛 लंच का समय",
    dinnerLabel: "🌙 डिनर का समय",
    saveScheduleBtn: "सहेजें",
    startBtn: "🎤 बोलना शुरू करें",
    clearBtn: "🧹 चैट साफ़ करें",
    statusText: "बटन पर क्लिक करें और बोलना शुरू करें",
    emergencyBtn: "🚨 आपातकाल"
  },

  "kn-IN": {
    mainTitle: "🤖 ವಾಯ್ಸ್‌ಟಾಸ್ಕ್ AI ಸಹಾಯಕ",
    subTitle: "ನಿಮ್ಮ ಸ್ಮಾರ್ಟ್ ವಾಯ್ಸ್ ಸಹಾಯಕ",
    profileTitle: "👤 ಬಳಕೆದಾರ ಪ್ರೊಫೈಲ್",
    userName: "ನಿಮ್ಮ ಹೆಸರು ನಮೂದಿಸಿ",
    familyNumber: "ತುರ್ತು ಸಂಪರ್ಕ ಸಂಖ್ಯೆ",
    saveProfileBtn: "ಉಳಿಸಿ",
    scheduleTitle: "⏰ ದೈನಂದಿನ ನೆನಪಿನ ವ್ಯವಸ್ಥೆ",
    medicineLabel: "💊 ಔಷಧ ಸಮಯ",
    exerciseLabel: "🏃 ವ್ಯಾಯಾಮ ಸಮಯ",
    lunchLabel: "🍛 ಮಧ್ಯಾಹ್ನ ಊಟ ಸಮಯ",
    dinnerLabel: "🌙 ರಾತ್ರಿ ಊಟ ಸಮಯ",
    saveScheduleBtn: "ಉಳಿಸಿ",
    startBtn: "🎤 ಮಾತನಾಡಲು ಪ್ರಾರಂಭಿಸಿ",
    clearBtn: "🧹 ಚಾಟ್ ತೆರವುಗೊಳಿಸಿ",
    statusText: "ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ ಮಾತನಾಡಲು ಪ್ರಾರಂಭಿಸಿ",
    emergencyBtn: "🚨 ತುರ್ತು ಪರಿಸ್ಥಿತಿ"
  },

  "ta-IN": {
    mainTitle: "🤖 VoiceTask AI உதவியாளர்",
    subTitle: "உங்கள் ஸ்மார்ட் குரல் துணை",
    profileTitle: "👤 பயனர் சுயவிவரம்",
    userName: "உங்கள் பெயரை உள்ளிடவும்",
    familyNumber: "அவசர தொடர்பு எண்",
    saveProfileBtn: "சேமிக்கவும்",
    scheduleTitle: "⏰ தினசரி நினைவூட்டல் அமைப்பு",
    medicineLabel: "💊 மருந்து நேரம்",
    exerciseLabel: "🏃 உடற்பயிற்சி நேரம்",
    lunchLabel: "🍛 மதிய உணவு நேரம்",
    dinnerLabel: "🌙 இரவு உணவு நேரம்",
    saveScheduleBtn: "சேமிக்கவும்",
    startBtn: "🎤 பேச தொடங்கவும்",
    clearBtn: "🧹 உரையாடலை அழிக்கவும்",
    statusText: "பொத்தானை அழுத்தி பேச தொடங்கவும்",
    emergencyBtn: "🚨 அவசரம்"
  },

  "te-IN": {
    mainTitle: "🤖 వాయిస్‌టాస్క్ AI సహాయకుడు",
    subTitle: "మీ స్మార్ట్ వాయిస్ సహాయకుడు",
    profileTitle: "👤 వినియోగదారు ప్రొఫైల్",
    userName: "మీ పేరు నమోదు చేయండి",
    familyNumber: "అత్యవసర సంప్రదింపు నంబర్",
    saveProfileBtn: "సేవ్ చేయండి",
    scheduleTitle: "⏰ రోజువారీ రిమైండర్ సెటప్",
    medicineLabel: "💊 ఔషధ సమయం",
    exerciseLabel: "🏃 వ్యాయామ సమయం",
    lunchLabel: "🍛 భోజన సమయం",
    dinnerLabel: "🌙 రాత్రి భోజన సమయం",
    saveScheduleBtn: "సేవ్ చేయండి",
    startBtn: "🎤 మాట్లాడడం ప్రారంభించండి",
    clearBtn: "🧹 చాట్ క్లియర్ చేయండి",
    statusText: "బటన్‌పై క్లిక్ చేసి మాట్లాడడం ప్రారంభించండి",
    emergencyBtn: "🚨 అత్యవసరం"
  }
};
function translatePage() {
    const lang = document.getElementById("languageSelect").value;
    const tr = translations[lang];
    if (tr) {
        document.getElementById("mainTitle").innerText = tr.mainTitle;
        document.getElementById("emergencyBtn").innerText = tr.emergencyBtn;
    }
}
