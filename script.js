// ================= JavaScript: การทำงานและฐานข้อมูล =================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } 
from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDiUc6y2M5FCu-tEnY1mgYGgVhu7H-PFnE",
    authDomain: "mindu-9f4b0.firebaseapp.com",
    projectId: "mindu-9f4b0",
    storageBucket: "mindu-9f4b0.firebasestorage.app",
    messagingSenderId: "237113799668",
    appId: "1:237113799668:web:0842f44252a1650a3abfa1",
    measurementId: "G-BYCSEYKY06"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let appData = [];
let currentSelectedMood = "";
let studentChartInstance = null;
let staffChartInstance = null;

const encouragementMessages = [
    "เก่งมากเลยที่ผ่านวันนี้มาได้! 🌟",
    "พรุ่งนี้เริ่มต้นใหม่นะ พักผ่อนเยอะๆ 💤",
    "ไม่ว่าวันนี้จะเจออะไรมา คุณทำดีที่สุดแล้ว 💙",
    "ให้เวลาตัวเองได้พักบ้างนะ 🍃",
    "ข้อความของคุณถูกบันทึกไว้อย่างปลอดภัยแล้ว ✨"
];

// จับคู่อิโมจิสำหรับแสดงในหน้าประวัติ
const moodEmojiMap = {
    'ตัวมารดา': '👑', 'ว้าวุ่น': '😵‍💫', 'ฉ่ำ': '✨', 'นอยด์': '😞',
    'จึ้ง': '🔥', 'ขิต': '💀', 'จะเครซี่': '🤯', 'กี่โมง': '⏰'
};

window.switchView = (viewId) => {
    document.getElementById('view-role-selection').classList.add('hidden');
    document.getElementById('view-student').classList.add('hidden');
    document.getElementById('view-staff').classList.add('hidden');
    document.getElementById('student-stats-section').classList.add('hidden'); 
    
    document.getElementById(viewId).classList.remove('hidden');
    if(viewId === 'view-staff') updateStaffDashboard();
};

window.selectMood = (moodName, btnElement) => {
    currentSelectedMood = moodName;
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
};

const fireConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#a2d2ff', '#ffc8dd', '#cdb4db', '#fcf6bd'] });
};

window.saveMood = async () => {
    if (!currentSelectedMood) {
        alert("กรุณาเลือกอารมณ์ของวันนี้ก่อนบันทึกนะ 😊"); return;
    }

    const record = {
        mood: currentSelectedMood,
        major: document.getElementById('student-major').value,
        note: document.getElementById('student-note').value,
        timestamp: Date.now() // เก็บเวลาปัจจุบัน
    };

    fireConfetti();

    const msgBox = document.getElementById('encouragement-msg');
    msgBox.innerText = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
    msgBox.style.display = 'block';

    document.getElementById('student-note').value = "";
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
    currentSelectedMood = "";

    try {
        await addDoc(collection(db, "mood_records"), record);
    } catch (error) {
        appData.push(record);
        if (!document.getElementById('student-stats-section').classList.contains('hidden')) {
            updateStudentChart();
            renderStudentHistory(); // อัปเดตประวัติทันที
        }
    }

    setTimeout(() => { msgBox.style.display = 'none'; }, 5000);
};

window.toggleStudentStats = () => {
    const statsSection = document.getElementById('student-stats-section');
    if (statsSection.classList.contains('hidden')) {
        statsSection.classList.remove('hidden');
        updateStudentChart();
        renderStudentHistory(); // โหลดประวัติเมื่อกดปุ่มดูสถิติ
    } else {
        statsSection.classList.add('hidden');
    }
};

// ====== ฟังก์ชันใหม่: แสดงประวัติข้อความและเวลา ======
window.renderStudentHistory = () => {
    const historyContainer = document.getElementById('student-history-list');
    historyContainer.innerHTML = '';

    // เรียงข้อมูลจากใหม่ล่าสุด ไป เก่าสุด
    const sortedData = [...appData].sort((a, b) => b.timestamp - a.timestamp);

    if (sortedData.length === 0) {
        historyContainer.innerHTML = '<p class="text-center" style="color: #adb5bd;">ยังไม่มีบันทึกเลย ลองบันทึกความรู้สึกแรกกันดูนะ!</p>';
        return;
    }

    sortedData.forEach(item => {
        // แปลง Timestamp เป็นรูปแบบวันที่และเวลา (ภาษาไทย)
        const dateObj = new Date(item.timestamp);
        const timeString = dateObj.toLocaleDateString('th-TH', { 
            year: 'numeric', month: 'short', day: 'numeric' 
        }) + ' เวลา ' + dateObj.toLocaleTimeString('th-TH', { 
            hour: '2-digit', minute:'2-digit' 
        }) + ' น.';

        const emoji = moodEmojiMap[item.mood] || '';
        
        // ตกแต่งสีกรอบตามระดับอารมณ์
        let borderColor = '#a2d2ff';
        if(['ตัวมารดา', 'ฉ่ำ'].includes(item.mood)) borderColor = '#ffd6a5';
        if(['ว้าวุ่น', 'นอยด์', 'ขิต'].includes(item.mood)) borderColor = '#ffadad';
        if(['จึ้ง'].includes(item.mood)) borderColor = '#fdffb6';

        // เช็คว่ามีข้อความไหม
        const noteHtml = item.note.trim() !== '' 
            ? `<div class="history-note">💭 "${item.note}"</div>` 
            : `<div class="history-note empty">ไม่มีข้อความเพิ่มเติม</div>`;

        // สร้างการ์ดประวัติ
        historyContainer.innerHTML += `
            <div class="history-card" style="border-left-color: ${borderColor};">
                <div class="history-header">
                    <span class="history-mood">${emoji} ${item.mood}</span>
                    <span class="history-time">🕒 ${timeString}</span>
                </div>
                ${noteHtml}
            </div>
        `;
    });
};

window.updateStudentChart = () => {
    const today = new Date().setHours(0,0,0,0);
    const recordsToday = appData.filter(d => new Date(d.timestamp).setHours(0,0,0,0) === today);
    
    document.getElementById('daily-stats').innerHTML = `
        📅 วันนี้คุณบันทึกความรู้สึกไปแล้ว: <b style="font-size: 24px;">${recordsToday.length}</b> ครั้ง<br>
        <span style="font-size:16px; color:var(--text-main);">อารมณ์ล่าสุด: <b>${recordsToday.length > 0 ? recordsToday[recordsToday.length-1].mood : '-'}</b></span>
    `;

    const ctx = document.getElementById('studentChart').getContext('2d');
    const recentData = appData.slice(-10);
    const labels = recentData.map((d, i) => `ครั้งที่ ${i+1}`);
    const dataPoints = recentData.map(d => {
        const moodScores = { 'ตัวมารดา':5, 'ฉ่ำ':5, 'จึ้ง':4, 'ว้าวุ่น':3, 'กี่โมง':3, 'จะเครซี่':2, 'นอยด์':2, 'ขิต':1 };
        return moodScores[d.mood] || 3;
    });

    if(studentChartInstance) studentChartInstance.destroy();
    studentChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'ระดับพลังงานใจ (1=ขิต, 5=ตัวมารดา)',
                data: dataPoints,
                borderColor: '#cdb4db', backgroundColor: 'rgba(205, 180, 219, 0.3)', 
                borderWidth: 3, tension: 0.4, fill: true, pointBackgroundColor: '#ffafcc', pointRadius: 5
            }]
        },
        options: { responsive: true, scales: { y: { min: 0, max: 6 } } }
    });
};

window.updateStaffDashboard = () => {
    const selectedMajor = document.getElementById('staff-filter-major').value;
    const ctx = document.getElementById('staffChart').getContext('2d');

    const filteredData = selectedMajor === 'All' ? appData : appData.filter(d => d.major === selectedMajor);
    const moodCounts = {};
    filteredData.forEach(d => { moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1; });

    const labels = Object.keys(moodCounts);
    const data = Object.values(moodCounts);

    if(staffChartInstance) staffChartInstance.destroy();
    
    staffChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#ffd6a5', '#caffbf', '#ffadad', '#a0c4ff', '#fdffb6', '#bdb2ff', '#ffc6ff', '#9bf6ff'],
                borderWidth: 2, hoverOffset: 10
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'right' } } }
    });

    const summaryDiv = document.getElementById('staff-summary');
    if(filteredData.length === 0) {
        summaryDiv.innerHTML = "ยังไม่มีข้อมูลนักศึกษาในสาขานี้ครับ 🍃";
    } else {
        let mostFrequentMood = labels.reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b);
        summaryDiv.innerHTML = `
            <strong>💡 สรุปภาพรวมแบบ Real-time:</strong><br><br>
            มีการบันทึกทั้งหมด <b>${filteredData.length}</b> ครั้ง <br>
            อารมณ์ส่วนใหญ่ของนักศึกษาในกลุ่มนี้คือ: <b style="color: #ff006e; font-size: 20px;">"${mostFrequentMood}"</b> 
        `;
    }
};

// Real-time Listener 
const q = query(collection(db, "mood_records"), orderBy("timestamp", "asc"));
onSnapshot(q, (snapshot) => {
    let firestoreData = [];
    snapshot.forEach((doc) => { firestoreData.push(doc.data()); });
    
    if(firestoreData.length === 0) {
        // ข้อมูลตัวอย่างสำหรับทดสอบ
        appData = [
            { mood: 'ฉ่ำ', major: 'Computer Education', note: 'วันนี้เรียนเขียนโปรแกรมเข้าใจมาก!', timestamp: Date.now() - 86400000 },
            { mood: 'นอยด์', major: 'Computer Education', note: 'ฝนตก รถติด มาสายเลย', timestamp: Date.now() - 3600000 },
            { mood: 'ตัวมารดา', major: 'Information Technology', note: 'พรีเซนต์งานผ่านฉลุย เริ่ดมาก', timestamp: Date.now() - 10000 }
        ];
    } else {
        appData = firestoreData;
    }

    if (!document.getElementById('student-stats-section').classList.contains('hidden')) {
        updateStudentChart();
        renderStudentHistory(); // อัปเดตประวัติแบบ Real-time ด้วย
    }
    if (!document.getElementById('view-staff').classList.contains('hidden')) updateStaffDashboard();
}, (error) => {
    console.warn("ใช้ระบบ Mock Data จำลองเนื่องจากไม่ได้เชื่อมต่อ:", error.message);
});
