// ================= JavaScript: การทำงานและฐานข้อมูล =================

// 1. นำเข้า Firebase Modular V9
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } 
from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 2. ตั้งค่า Firebase (ใช้ API Key ของคุณ)
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

// 3. ตัวแปรสำหรับเก็บสถานะ
let appData = []; // เก็บข้อมูล Mock/Firebase
let currentSelectedMood = "";
let studentChartInstance = null;
let staffChartInstance = null;

// ข้อความให้กำลังใจแบบสุ่ม
const encouragementMessages = [
    "เก่งมากเลยที่ผ่านวันนี้มาได้! 🌟",
    "พรุ่งนี้เริ่มต้นใหม่นะ พักผ่อนเยอะๆ 💤",
    "ไม่ว่าวันนี้จะเจออะไรมา คุณทำดีที่สุดแล้ว 💙",
    "รอยยิ้มของคุณมีค่าเสมอ 😊",
    "ให้เวลาตัวเองได้พักบ้างนะ 🍃",
    "คุณเจ๋งที่สุดเลยรู้ตัวไหม! ✨"
];

// 4. ฟังก์ชันจัดการหน้าจอ (เปลี่ยน View)
window.switchView = (viewId) => {
    document.getElementById('view-role-selection').classList.add('hidden');
    document.getElementById('view-student').classList.add('hidden');
    document.getElementById('view-staff').classList.add('hidden');
    document.getElementById('student-stats-section').classList.add('hidden'); 
    
    document.getElementById(viewId).classList.remove('hidden');
    if(viewId === 'view-staff') updateStaffDashboard();
};

// 5. ฟังก์ชันเลือกอารมณ์ (ไฮไลต์ปุ่มที่ถูกกด)
window.selectMood = (moodName, btnElement) => {
    currentSelectedMood = moodName;
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
};

// 6. ฟังก์ชันจุดพลุ (ดึงมาจาก library canvas-confetti ใน HTML)
const fireConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#a2d2ff', '#ffc8dd', '#cdb4db', '#fcf6bd'] });
};

// 7. ฟังก์ชันบันทึกข้อมูลหลัก
window.saveMood = async () => {
    if (!currentSelectedMood) {
        alert("กรุณาเลือกอารมณ์ของวันนี้ก่อนบันทึกนะ 😊"); return;
    }

    const record = {
        mood: currentSelectedMood,
        major: document.getElementById('student-major').value,
        note: document.getElementById('student-note').value,
        timestamp: Date.now()
    };

    fireConfetti(); // เรียกเอฟเฟกต์จุดพลุ

    // สุ่มแสดงข้อความให้กำลังใจ
    const msgBox = document.getElementById('encouragement-msg');
    msgBox.innerText = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
    msgBox.style.display = 'block';

    // ล้างฟอร์ม
    document.getElementById('student-note').value = "";
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
    currentSelectedMood = "";

    // บันทึกลง Firebase (มี Fallback ให้เก็บลง Array ชั่วคราวถ้า Firebase error)
    try {
        await addDoc(collection(db, "mood_records"), record);
    } catch (error) {
        appData.push(record);
        if (!document.getElementById('student-stats-section').classList.contains('hidden')) updateStudentChart();
    }

    // ซ่อนข้อความให้กำลังใจเมื่อผ่านไป 5 วินาที
    setTimeout(() => { msgBox.style.display = 'none'; }, 5000);
};

// 8. ฟังก์ชัน เปิด-ปิด หน้าดูกราฟของนักศึกษา
window.toggleStudentStats = () => {
    const statsSection = document.getElementById('student-stats-section');
    if (statsSection.classList.contains('hidden')) {
        statsSection.classList.remove('hidden');
        updateStudentChart(); // อัปเดตกราฟทันทีเมื่อเปิดดู
    } else {
        statsSection.classList.add('hidden');
    }
};

// 9. ฟังก์ชันสร้างและอัปเดตกราฟ (นักศึกษา)
window.updateStudentChart = () => {
    // คำนวณจำนวนครั้งที่บันทึก "ภายในวันนี้"
    const today = new Date().setHours(0,0,0,0);
    const recordsToday = appData.filter(d => new Date(d.timestamp).setHours(0,0,0,0) === today);
    
    document.getElementById('daily-stats').innerHTML = `
        📅 วันนี้คุณบันทึกความรู้สึกไปแล้ว: <b style="font-size: 24px;">${recordsToday.length}</b> ครั้ง<br>
        <span style="font-size:16px; color:var(--text-main);">อารมณ์ล่าสุด: <b>${recordsToday.length > 0 ? recordsToday[recordsToday.length-1].mood : '-'}</b></span>
    `;

    const ctx = document.getElementById('studentChart').getContext('2d');
    const recentData = appData.slice(-10); // ดึงมาแค่ 10 ครั้งล่าสุด
    const labels = recentData.map((d, i) => `ครั้งที่ ${i+1}`);
    const dataPoints = recentData.map(d => {
        // ให้คะแนนอารมณ์เพื่อนำไปพล็อตเป็นเส้นกราฟสูง-ต่ำ
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

// 10. ฟังก์ชันสร้างและอัปเดตกราฟ (อาจารย์)
window.updateStaffDashboard = () => {
    const selectedMajor = document.getElementById('staff-filter-major').value;
    const ctx = document.getElementById('staffChart').getContext('2d');

    // กรองข้อมูลตามสาขาที่เลือก
    const filteredData = selectedMajor === 'All' ? appData : appData.filter(d => d.major === selectedMajor);
    
    // นับจำนวนอารมณ์แต่ละประเภท
    const moodCounts = {};
    filteredData.forEach(d => { moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1; });

    const labels = Object.keys(moodCounts);
    const data = Object.values(moodCounts);

    if(staffChartInstance) staffChartInstance.destroy();
    
    // กราฟโดนัท (Doughnut Chart)
    staffChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#ffd6a5', '#caffbf', '#ffadad', '#a0c4ff', '#fdffb6', '#bdb2ff', '#ffc6ff', '#9bf6ff'],
                borderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'right' } } }
    });

    // แสดงข้อความสรุปใต้กราฟ
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

// 11. Real-time Listener ฟังการเปลี่ยนแปลงจาก Firebase
const q = query(collection(db, "mood_records"), orderBy("timestamp", "asc"));
onSnapshot(q, (snapshot) => {
    let firestoreData = [];
    snapshot.forEach((doc) => { firestoreData.push(doc.data()); });
    
    // ถ้ายังไม่มีข้อมูลในฐานข้อมูล ให้ใช้ Mock data โชว์ก่อน
    if(firestoreData.length === 0) {
        appData = [
            { mood: 'ฉ่ำ', major: 'Computer Education', note: '', timestamp: Date.now() - 86400000 },
            { mood: 'นอยด์', major: 'Computer Education', note: '', timestamp: Date.now() - 3600000 },
            { mood: 'ตัวมารดา', major: 'Information Technology', note: '', timestamp: Date.now() }
        ];
    } else {
        appData = firestoreData;
    }

    // หากเปิดหน้านั้นๆ ค้างไว้อยู่ ให้สั่งวาดกราฟใหม่เพื่อแสดงข้อมูลล่าสุด (Real-time)
    if (!document.getElementById('student-stats-section').classList.contains('hidden')) updateStudentChart();
    if (!document.getElementById('view-staff').classList.contains('hidden')) updateStaffDashboard();
}, (error) => {
    console.warn("ใช้ระบบ Mock Data จำลองเนื่องจากไม่ได้เชื่อมต่อฐานข้อมูล:", error.message);
});
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}
