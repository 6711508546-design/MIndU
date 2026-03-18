// --- 1. การตั้งค่า Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyDiUc6y2M5FCu-tEnY1mgYGgVhu7H-PFnE",
    authDomain: "mindu-9f4b0.firebaseapp.com",
    projectId: "mindu-9f4b0",
    storageBucket: "mindu-9f4b0.firebasestorage.app",
    messagingSenderId: "237113799668",
    appId: "1:237113799668:web:0842f44252a1650a3abfa1",
    measurementId: "G-BYCSEYKY06"
};
// ตรวจสอบว่ายังไม่ได้ initialize app ไปแล้ว
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// --- 2. ตัวแปรและข้อมูลพื้นฐาน ---
const moods = [
    { id: "mother", emoji: "👑", text: "ตัวมารดา" },
    { id: "confused", emoji: "😵‍💫", text: "ว้าวุ่น" },
    { id: "glow", emoji: "✨", text: "ฉ่ำ" },
    { id: "noid", emoji: "😞", text: "นอยด์" },
    { id: "fire", emoji: "🔥", text: "จึ้ง" },
    { id: "dead", emoji: "💀", text: "ขิต" },
    { id: "crazy", emoji: "🤯", text: "จะเครซี่" },
    { id: "time", emoji: "⏰", text: "กี่โมง" },
    { id: "water", emoji: "💧", text: "น้ำตาไหล" }
];

let selectedMood = null;
let chartInstance = null;

let deviceId = localStorage.getItem("mindu_device_id");
if (!deviceId) {
    deviceId = "device_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("mindu_device_id", deviceId);
}

const messages = [
    "เก่งมากที่ผ่านวันนี้มาได้นะ 💙",
    "พักผ่อนเยอะๆ พรุ่งนี้เริ่มต้นใหม่ 🌟",
    "ไม่เป็นไรนะ กอดๆ 🤗",
    "คุณทำดีที่สุดแล้ว ภูมิใจในตัวเองเถอะ ✨"
];

// --- 3. ฟังก์ชันการทำงานของ UI ---
function switchScreen(screenId) {
    document.querySelectorAll('.container').forEach(el => el.classList.remove('active-screen'));
    document.getElementById(screenId).classList.add('active-screen');

    if (screenId === 'student-screen') {
        renderMoodButtons();
        loadStudentHistory();
    } else if (screenId === 'staff-screen') {
        loadStaffDashboard();
    }
}

function renderMoodButtons() {
    const container = document.getElementById('mood-container');
    container.innerHTML = '';
    moods.forEach(mood => {
        const btn = document.createElement('div');
        btn.className = 'mood-btn';
        btn.innerHTML = `<span class="mood-emoji">${mood.emoji}</span>${mood.text}`;
        btn.onclick = () => {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedMood = mood;
        };
        container.appendChild(btn);
    });
}

// --- 4. ฟังก์ชันของฝั่งนักศึกษา ---
async function saveMood() {
    const major = document.getElementById('student-major').value;
    const text = document.getElementById('student-text').value;

    if (!major) return alert("กรุณาเลือกสาขาวิชาของคุณด้วยนะ 😊");
    if (!selectedMood) return alert("เลือกอารมณ์วันนี้ให้หน่อยนะ 🥺");

    const entry = {
        deviceId: deviceId,
        major: major,
        moodText: selectedMood.text,
        moodEmoji: selectedMood.emoji,
        text: text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection("mindu_entries").add(entry);
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        alert(`บันทึกสำเร็จ! 🎉\n${randomMsg}`);
        
        document.getElementById('student-text').value = '';
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
        selectedMood = null;

        loadStudentHistory();

    } catch (error) {
        console.error("Error saving document: ", error);
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
}

async function loadStudentHistory() {
    const list = document.getElementById('student-history-list');
    list.innerHTML = '<p>กำลังโหลดประวัติ...</p>';

    try {
        const snapshot = await db.collection("mindu_entries")
            .where("deviceId", "==", deviceId)
            .orderBy("timestamp", "desc")
            .limit(5)
            .get();

        if (snapshot.empty) {
            list.innerHTML = '<p style="text-align:center; color:#999;">ยังไม่มีประวัติการบันทึก เริ่มบันทึกความรู้สึกแรกของคุณเลย!</p>';
            return;
        }

        list.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.timestamp ? data.timestamp.toDate().toLocaleString('th-TH') : 'เมื่อสักครู่';
            
            const card = document.createElement('div');
            card.className = 'history-card';
            card.innerHTML = `
                <div class="history-header">
                    <span>อารมณ์: ${data.moodEmoji} ${data.moodText}</span>
                    <span>${date}</span>
                </div>
                <p style="margin-top: 10px; color: #444;">${data.text ? data.text : '<i>(ไม่มีข้อความระบาย)</i>'}</p>
            `;
            list.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading history: ", error);
        list.innerHTML = '<p>ไม่สามารถโหลดประวัติได้</p>';
    }
}

// --- 5. ฟังก์ชันของฝั่งอาจารย์ ---
function checkPassword() {
    const pwd = document.getElementById('staff-password').value;
    if (pwd === "20043") {
        document.getElementById('staff-password').value = '';
        document.getElementById('login-error').style.display = 'none';
        switchScreen('staff-screen');
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
}

async function loadStaffDashboard() {
    const filter = document.getElementById('filter-major').value;
    
    try {
        let query = db.collection("mindu_entries");
        if (filter !== "all") {
            query = query.where("major", "==", filter);
        }
        
        const snapshot = await query.get();
        const moodCounts = {};
        let totalEntries = 0;

        snapshot.forEach(doc => {
            const mood = doc.data().moodText;
            moodCounts[mood] = (moodCounts[mood] || 0) + 1;
            totalEntries++;
        });

        updateChart(moodCounts);
        updateSummary(moodCounts, totalEntries, filter);

    } catch (error) {
        console.error("Error loading dashboard: ", error);
    }
}

function updateChart(data) {
    const ctx = document.getElementById('moodChart').getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }

    const labels = Object.keys(data);
    const values = Object.values(data);

    if (labels.length === 0) {
        chartInstance = new Chart(ctx, {
            type: 'pie',
            data: { labels: ['ไม่มีข้อมูล'], datasets: [{ data: [1], backgroundColor: ['#eee'] }] }
        });
        return;
    }

    chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#FFB5E8', '#B28DFF', '#AFCBFF', '#AFF8DB', 
                    '#FFC9DE', '#FFABAB', '#FFC3A0', '#D5AAFF', '#85E3FF'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function updateSummary(data, total, filter) {
    const summaryBox = document.getElementById('staff-summary');
    if (total === 0) {
        summaryBox.innerHTML = `ยังไม่มีข้อมูลการบันทึกอารมณ์ของนักศึกษา${filter === 'all' ? 'ทั้งหมด' : 'สาขานี้'}`;
        return;
    }

    let maxMood = '';
    let maxCount = 0;
    for (const [mood, count] of Object.entries(data)) {
        if (count > maxCount) {
            maxCount = count;
            maxMood = mood;
        }
    }

    let text = `มีการบันทึกทั้งหมด <b>${total}</b> ครั้ง <br>`;
    text += `อารมณ์ส่วนใหญ่ของนักศึกษาคือ <b>"${maxMood}"</b> (${maxCount} คน)`;
    summaryBox.innerHTML = text;
}
