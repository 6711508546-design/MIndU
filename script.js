// ================= JavaScript: ระบบและฐานข้อมูล =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } 
from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDiUc6y2M5FCu-tEnY1mgYGgVhu7H-PFnE", 
    authDomain: "mindu-9f4b0.firebaseapp.com",
    projectId: "mindu-9f4b0", 
    storageBucket: "mindu-9f4b0.firebasestorage.app",
    messagingSenderId: "237113799668", 
    appId: "1:237113799668:web:0842f44252a1650a3abfa1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let appData = [];
let currentSelectedMood = "";
let studentChartInstance = null; 
let staffChartInstance = null;

const moodEmojiMap = { 
    'ตัวมารดา': '👑', 'ว้าวุ่น': '😵‍💫', 'ฉ่ำ': '✨', 'นอยด์': '😞', 
    'จึ้ง': '🔥', 'ขิต': '💀', 'จะเครซี่': '🤯', 'กี่โมง': '⏰' 
};

// นำคำใบ้รหัสผ่านออก เพื่อความปลอดภัย
window.enterStaffView = () => {
    const pin = prompt("🔐 กรุณาใส่รหัสผ่านเพื่อเข้าสู่ระบบของบุคลากร:");
    if (pin === "20043") {
        switchView('view-staff');
    } else if (pin !== null) {
        alert("❌ รหัสผ่านไม่ถูกต้อง! ไม่อนุญาตให้เข้าถึงข้อมูล");
    }
};

window.switchView = (viewId) => {
    document.getElementById('view-role-selection').classList.add('hidden');
    document.getElementById('view-student').classList.add('hidden');
    document.getElementById('view-staff').classList.add('hidden');
    
    if(viewId !== 'view-student') document.getElementById('student-stats-section').classList.add('hidden');
    
    document.getElementById(viewId).classList.remove('hidden');
    
    if(viewId === 'view-staff') updateStaffDashboard();
    if(viewId === 'view-student' && appData.length > 0) {
        document.getElementById('student-stats-section').classList.remove('hidden');
        updateStudentChart(); 
        renderStudentHistory();
    }
};

window.selectMood = (moodName, btnElement) => {
    currentSelectedMood = moodName;
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
};

window.saveMood = async () => {
    if (!currentSelectedMood) { alert("กรุณาเลือกอารมณ์ของวันนี้ก่อนบันทึกนะ 😊"); return; }

    const noteInput = document.getElementById('student-note').value;
    const majorSelect = document.getElementById('student-major');
    const majorText = majorSelect.options[majorSelect.selectedIndex].text; 

    const record = {
        mood: currentSelectedMood,
        majorValue: majorSelect.value, 
        majorText: majorText, 
        note: noteInput,
        timestamp: Date.now()
    };

    if(typeof confetti === 'function') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#a2d2ff', '#ffc8dd', '#cdb4db'] });
    }

    const msgBox = document.getElementById('encouragement-msg');
    msgBox.innerText = "บันทึกความรู้สึกของคุณเรียบร้อยแล้ว เก่งมากเลยที่ผ่านวันนี้มาได้ 🌟";
    msgBox.style.display = 'block';

    document.getElementById('student-note').value = "";
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
    currentSelectedMood = "";

    try { 
        await addDoc(collection(db, "mood_records"), record);
    } catch (error) { 
        appData.push(record); 
    }

    document.getElementById('student-stats-section').classList.remove('hidden');
    updateStudentChart();
    renderStudentHistory();

    setTimeout(() => { msgBox.style.display = 'none'; }, 5000);
};

window.renderStudentHistory = () => {
    const historyContainer = document.getElementById('student-history-list');
    historyContainer.innerHTML = '';
    const sortedData = [...appData].sort((a, b) => b.timestamp - a.timestamp);

    if (sortedData.length === 0) return;

    sortedData.forEach(item => {
        const dateObj = new Date(item.timestamp);
        const timeStr = dateObj.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }) + ' ' + 
                      dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute:'2-digit' }) + ' น.';
        const emoji = moodEmojiMap[item.mood] || '';
        
        let borderColor = '#a2d2ff';
        if(['ตัวมารดา', 'ฉ่ำ'].includes(item.mood)) borderColor = '#ffd6a5';
        if(['ว้าวุ่น', 'นอยด์', 'ขิต'].includes(item.mood)) borderColor = '#ffadad';

        const noteHtml = item.note.trim() !== '' 
            ? `<div class="history-note">💭 "${item.note}"</div>` 
            : `<div class="history-note" style="color: #adb5bd; font-style: italic;">ไม่มีข้อความระบาย</div>`;

        historyContainer.innerHTML += `
            <div class="history-card" style="border-left-color: ${borderColor};">
                <div class="history-header">
                    <span class="history-mood">${emoji} ${item.mood}</span>
                    <span class="history-time">🕒 ${timeStr}</span>
                </div>
                ${noteHtml}
            </div>
        `;
    });
};

window.updateStaffDashboard = () => {
    const selectedMajorValue = document.getElementById('staff-filter-major').value;
    const filteredData = selectedMajorValue === 'All' ? appData : appData.filter(d => d.majorValue === selectedMajorValue);
    
    const moodCounts = {};
    filteredData.forEach(d => { moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1; });
    const labels = Object.keys(moodCounts);
    const data = Object.values(moodCounts);

    if(staffChartInstance) staffChartInstance.destroy();
    const ctx = document.getElementById('staffChart').getContext('2d');
    staffChartInstance = new Chart(ctx, {
        type: 'pie',
        data: { 
            labels: labels, 
            datasets: [{ data: data, backgroundColor: ['#ffd6a5', '#caffbf', '#ffadad', '#a0c4ff', '#fdffb6', '#bdb2ff', '#ffc6ff', '#9bf6ff'], borderWidth: 2 }] 
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false }
    });

    const summaryDiv = document.getElementById('staff-summary');
    if(filteredData.length === 0) {
        summaryDiv.innerHTML = "ยังไม่มีข้อมูลนักศึกษาในสาขานี้ครับ";
    } else {
        let mostFrequentMood = labels.reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b);
        summaryDiv.innerHTML = `บันทึกทั้งหมด <b>${filteredData.length}</b> รายการ | อารมณ์ส่วนใหญ่: <b style="color: #ff006e;">"${mostFrequentMood}"</b>`;
    }

    const feedContainer = document.getElementById('staff-history-feed');
    feedContainer.innerHTML = '';
    const sortedFeed = [...filteredData].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
    
    if (sortedFeed.length === 0) { 
        feedContainer.innerHTML = '<p class="text-center" style="color:#adb5bd;">ยังไม่มีอารมณ์ถูกบันทึก</p>'; 
        return; 
    }

    sortedFeed.forEach(item => {
        const dateObj = new Date(item.timestamp);
        const timeStr = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute:'2-digit' }) + ' น.';
        const emoji = moodEmojiMap[item.mood] || '';
        
        feedContainer.innerHTML += `
            <div class="staff-feed-card">
                <div class="staff-feed-emoji">${emoji}</div>
                <div class="staff-feed-info">
                    <div class="staff-feed-major">${item.majorText || 'นักศึกษา'} รู้สึก ${item.mood}</div>
                    <div class="staff-feed-time">บันทึกเมื่อเวลา ${timeStr}</div>
                </div>
            </div>
        `;
    });
};

window.updateStudentChart = () => {
    const today = new Date().setHours(0,0,0,0);
    const recordsToday = appData.filter(d => new Date(d.timestamp).setHours(0,0,0,0) === today);
    document.getElementById('daily-stats').innerHTML = `วันนี้บันทึกไปแล้ว <b>${recordsToday.length}</b> ครั้ง`;

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
            datasets: [{ label: 'ระดับพลังงานใจ', data: dataPoints, borderColor: '#cdb4db', backgroundColor: 'rgba(205, 180, 219, 0.3)', borderWidth: 3, fill: true, tension: 0.3 }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: { y: { min: 0, max: 6, ticks: { stepSize: 1 } } } 
        }
    });
};

const q = query(collection(db, "mood_records"), orderBy("timestamp", "asc"));
onSnapshot(q, (snapshot) => {
    let firestoreData = [];
    snapshot.forEach((doc) => { firestoreData.push(doc.data()); });
    
    if(firestoreData.length === 0) {
        appData = [
            { mood: 'ฉ่ำ', majorValue: 'ComCru', majorText: 'สาขาวิชาคอมพิวเตอร์ศึกษา (ComCru)', note: 'วันนี้เรียนเข้าใจมาก!', timestamp: Date.now() - 86400000 },
            { mood: 'นอยด์', majorValue: 'IT', majorText: 'สาขาวิชาเทคโนโลยีสารสนเทศ', note: 'ฝนตก รถติด มาสายเลย', timestamp: Date.now() - 3600000 }
        ];
    } else { 
        appData = firestoreData; 
    }

    if (!document.getElementById('student-stats-section').classList.contains('hidden')) { 
        updateStudentChart(); 
        renderStudentHistory(); 
    }
    if (!document.getElementById('view-staff').classList.contains('hidden')) {
        updateStaffDashboard();
    }
}, (error) => { 
    console.warn("ระบบเชื่อมต่อจำลองทำงาน:", error.message); 
});
