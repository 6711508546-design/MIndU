// --- ตั้งค่าข้อมูลอารมณ์ ---
const emotionsList = [
    { id: 'mother', emoji: '👑', label: 'ตัวมารดา' },
    { id: 'confused', emoji: '😵‍💫', label: 'ว้าวุ่น' },
    { id: 'happy', emoji: '✨', label: 'ฉ่ำ' },
    { id: 'sad', emoji: '😞', label: 'นอยด์' },
    { id: 'amazing', emoji: '🔥', label: 'จึ้ง' },
    { id: 'dead', emoji: '💀', label: 'ขิต' },
    { id: 'crazy', emoji: '🤯', label: 'จะเครซี่' },
    { id: 'waiting', emoji: '⏰', label: 'กี่โมง' }
];

const encouragementMsgs = [
    "เก่งมากที่ผ่านวันนี้มาได้! พักผ่อนเยอะๆ นะ 🌿",
    "พรุ่งนี้เริ่มใหม่ได้เสมอ เป็นกำลังใจให้นะ ✌️",
    "เธอทำดีที่สุดแล้ว! กอดๆ นะ 💖",
    "รับทราบความรู้สึก! ขอให้พรุ่งนี้ใจดีกับเธอนะ ✨",
    "ไม่ว่าวันนี้จะเจออะไรมา เธอเก่งมากเลยนะ! 👑"
];

let selectedEmotion = null;
let studentLogs = []; // เก็บข้อมูลนักศึกษา { timestamp, emotionId, note }

// อินสแตนซ์ของกราฟเพื่อใช้ทำลาย (Destroy) ก่อนสร้างใหม่
let stuChartInstance = null;
let staffPieInstance = null;
let staffBarInstance = null;

// --- ฟังก์ชันการนำทาง (Navigation) ---
function openView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    document.getElementById('btnBack').style.display = viewId === 'view-home' ? 'none' : 'block';

    if (viewId === 'view-student') initStudentView();
    if (viewId === 'view-staff') initStaffDashboard();
}

function goHome() {
    openView('view-home');
}

// --- ฟังก์ชันฝั่งนักศึกษา (Student View) ---
function initStudentView() {
    const container = document.getElementById('emotionsContainer');
    if (container.innerHTML === '') {
        emotionsList.forEach(emo => {
            const div = document.createElement('div');
            div.className = 'emotion-item';
            div.onclick = () => selectEmotion(div, emo.id);
            div.innerHTML = `<span class="emoji">${emo.emoji}</span><span class="emoji-label">${emo.label}</span>`;
            container.appendChild(div);
        });
    }
    updateStudentChart();
}

function selectEmotion(element, emotionId) {
    document.querySelectorAll('.emotion-item').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedEmotion = emotionId;
}

function saveEmotion() {
    if (!selectedEmotion) {
        alert('ช่วยเลือกอารมณ์ของวันนี้ก่อนนะ!');
        return;
    }
    
    const note = document.getElementById('studentNote').value;
    const now = new Date();
    
    // บันทึกข้อมูล
    studentLogs.push({
        time: now,
        emotionId: selectedEmotion,
        note: note
    });

    // แสดงข้อความสุ่มให้กำลังใจ
    const msgBox = document.getElementById('randomMsg');
    msgBox.innerHTML = encouragementMsgs[Math.floor(Math.random() * encouragementMsgs.length)];
    msgBox.style.display = 'block';
    setTimeout(() => msgBox.style.display = 'none', 5000);

    // รีเซ็ตฟอร์ม
    document.querySelectorAll('.emotion-item').forEach(el => el.classList.remove('selected'));
    document.getElementById('studentNote').value = '';
    selectedEmotion = null;

    // อัปเดตกราฟ
    updateStudentChart();
}

function updateStudentChart() {
    const historyContainer = document.getElementById('studentHistory');
    historyContainer.innerHTML = '';
    
    if (studentLogs.length === 0) {
        historyContainer.innerHTML = '<p style="text-align:center; color:#999;">ยังไม่มีข้อมูลในวันนี้</p>';
        return;
    }

    // สร้างประวัติแบบ Text
    const emotionCounts = {};
    emotionsList.forEach(e => emotionCounts[e.id] = 0);

    // เรียงจากใหม่ไปเก่า
    const reversedLogs = [...studentLogs].reverse();
    reversedLogs.forEach(log => {
        emotionCounts[log.emotionId]++;
        const emoObj = emotionsList.find(e => e.id === log.emotionId);
        const timeStr = log.time.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'});
        
        historyContainer.innerHTML += `
            <div class="history-item">
                <span>${emoObj.emoji} <b>${emoObj.label}</b></span>
                <span style="color:#888; font-size:0.8rem;">${timeStr} ${log.note ? '📝' : ''}</span>
            </div>
        `;
    });

    // สร้างกราฟ Bar Chart แสดงสถิติอารมณ์ส่วนตัว
    const ctx = document.getElementById('studentChart').getContext('2d');
    if (stuChartInstance) stuChartInstance.destroy();

    const labels = emotionsList.map(e => e.emoji + ' ' + e.label);
    const data = emotionsList.map(e => emotionCounts[e.id]);

    stuChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'จำนวนครั้งที่รู้สึก',
                data: data,
                backgroundColor: 'rgba(177, 156, 217, 0.6)',
                borderColor: 'rgba(177, 156, 217, 1)',
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
}

// --- ฟังก์ชันฝั่งอาจารย์ (Staff Dashboard) ---
function initStaffDashboard() {
    // ตั้งค่าวันที่ปัจจุบันใน filter
    if(!document.getElementById('filterDate').value){
        document.getElementById('filterDate').valueAsDate = new Date();
    }
    updateStaffDashboard();
}

function generateMockStaffData() {
    // จำลองข้อมูลนักศึกษา 50 คนแบบสุ่ม
    const mockData = {};
    emotionsList.forEach(e => mockData[e.id] = Math.floor(Math.random() * 15));
    
    // จำลองข้อมูลตามสาขา
    const major = document.getElementById('filterMajor').value;
    if(major === 'comedu') {
        mockData['confused'] += 10;
        mockData['dead'] += 8;
    }

    return mockData;
}

function updateStaffDashboard() {
    const dataMap = generateMockStaffData();
    const labels = emotionsList.map(e => e.emoji + ' ' + e.label);
    const dataVals = emotionsList.map(e => dataMap[e.id]);
    const colors = ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#B5EAD7', '#C7CEEA', '#E2F0CB', '#FFDAC1', '#FF9AA2'];

    // หาอารมณ์ที่มีคนเลือกมากที่สุด เพื่อสร้างข้อความสรุป
    let maxCount = -1;
    let topEmotion = '';
    emotionsList.forEach(e => {
        if(dataMap[e.id] > maxCount) {
            maxCount = dataMap[e.id];
            topEmotion = e.label;
        }
    });

    const summaryBox = document.getElementById('aiSummary');
    summaryBox.innerHTML = `💡 <b>สรุปอัตโนมัติ:</b> ช่วงนี้นักศึกษาส่วนใหญ่มีความรู้สึก <b>"${topEmotion}"</b> เพิ่มขึ้น (จำนวน ${maxCount} รายการ) อาจต้องมีการจัดกิจกรรมผ่อนคลายหรือให้คำปรึกษาเพิ่มเติมครับ`;

    // วาด Pie Chart
    const pieCtx = document.getElementById('staffPieChart').getContext('2d');
    if (staffPieInstance) staffPieInstance.destroy();
    staffPieInstance = new Chart(pieCtx, {
        type: 'doughnut',
        data: { labels: labels, datasets: [{ data: dataVals, backgroundColor: colors }] },
        options: { responsive: true, plugins: { legend: { position: 'right', labels:{font:{family:'Prompt'}} } } }
    });

    // วาด Bar Chart
    const barCtx = document.getElementById('staffBarChart').getContext('2d');
    if (staffBarInstance) staffBarInstance.destroy();
    staffBarInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'จำนวนนักศึกษา',
                data: dataVals,
                backgroundColor: 'rgba(174, 198, 207, 0.8)',
                borderRadius: 5
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}
