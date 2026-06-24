const API = 'http://localhost:8080/api';

async function loadExams() {
    try {
        const res = await fetch(`${API}/exams/all`);
        const exams = await res.json();
        const select = document.getElementById('examSelect');
        select.innerHTML = '<option value="">-- Select Exam --</option>';
        exams.forEach(e => {
            select.innerHTML += `<option value="${e.id}">[${e.subjectCode}] ${e.subject} - ${e.examDate} (${e.department} Yr${e.year})</option>`;
        });
    } catch(e) { showToast('❌ Backend not running!', 'error'); }
}

async function generateAllocation() {
    const examId = document.getElementById('examSelect').value;
    if (!examId) { showToast('❌ Select an exam!', 'error'); return; }

    const examRes = await fetch(`${API}/exams/all`);
    const exams = await examRes.json();
    const exam = exams.find(e => e.id == examId);

    if (exam) {
        const now = new Date();
        const start = new Date(`${exam.examDate}T${exam.startTime}`);
        const end = new Date(`${exam.examDate}T${exam.endTime}`);
        if (now >= start && now <= end) {
            document.getElementById('allocationResult').innerHTML = `
            <div class="card" style="text-align:center; padding:40px; border-color:#ff5252;">
                <div style="font-size:50px; margin-bottom:15px;">🚫</div>
                <h3 style="color:#ff5252;">Exam is currently ongoing!</h3>
                <p style="color:#666; margin-top:10px;">Cannot modify allocation during active exam.</p>
                <p style="color:#666; margin-top:5px;">Exam ends at: <strong style="color:#ffab40;">${exam.endTime}</strong></p>
            </div>`;
            return;
        }
    }

    showToast('⚡ Generating...', 'success');
    try {
        const res = await fetch(`${API}/allocation/generate/${examId}`, { method: 'POST' });
        const data = await res.json();
        if (data.status === 'error' || data.status === 'warning') {
            document.getElementById('allocationResult').innerHTML = `
            <div class="card" style="text-align:center; padding:40px; border-color:#ff5252;">
                <div style="font-size:50px; margin-bottom:15px;">⚠️</div>
                <h3 style="color:#ff5252;">${data.message}</h3>
                <p style="color:#666; margin-top:10px;">Go to Student page and add students!</p>
            </div>`;
            return;
        }
        showToast(data.message, 'success');
        renderAllocation(examId, 'allocationResult');
    } catch(e) { showToast('❌ Error!', 'error'); }
}
async function viewFullAllocation() {
    const examId = document.getElementById('examSelect').value;
    if (!examId) { showToast('❌ Select an exam!', 'error'); return; }
    await renderAllocation(examId, 'fullPageContent');
    document.getElementById('fullPageModal').style.display = 'block';
}

async function renderAllocation(examId, targetId) {
    try {
        const res = await fetch(`${API}/allocation/${examId}`);
        const allocations = await res.json();

        if (!allocations || allocations.length === 0) {
            document.getElementById(targetId).innerHTML = `
            <div class="card" style="text-align:center; padding:40px; color:#888;">
                No allocation yet. Click ⚡ Generate Seats first!
            </div>`;
            return;
        }

        const exam = allocations[0].exam;
        const halls = {};
        allocations.forEach(a => {
            const hn = a.hall.hallName;
            if (!halls[hn]) halls[hn] = { hall: a.hall, seats: {} };
            halls[hn].seats[`${a.seatRow}-${a.seatColumn}`] = a;
        });

        let html = `
        <div class="card" style="text-align:center; padding:20px; margin-bottom:20px; background:linear-gradient(135deg,#12122a,#0d0d20); border-color:var(--primary);">
            <h2 style="color:#00d4ff;">📝 ${exam.subject}</h2>
            <p style="color:#666; margin-top:8px;">📅 ${exam.examDate} &nbsp;|&nbsp; ⏰ ${exam.examTime} &nbsp;|&nbsp; ${exam.department} &nbsp;|&nbsp; Year ${exam.year}</p>
            <p style="margin-top:8px;">Total Allocated: <span style="color:#00e676; font-weight:700;">${allocations.length} students</span></p>
        </div>
        <div class="card" style="margin-bottom:20px;">
            <p style="color:#666; font-size:12px; margin-bottom:10px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Department Legend</p>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <span style="padding:4px 12px; border-radius:6px; background:rgba(108,99,255,0.15); border:1px solid rgba(108,99,255,0.5); color:#a89fff; font-size:12px;">■ CSE</span>
                <span style="padding:4px 12px; border-radius:6px; background:rgba(0,212,255,0.15); border:1px solid rgba(0,212,255,0.5); color:#80eaff; font-size:12px;">■ ECE</span>
                <span style="padding:4px 12px; border-radius:6px; background:rgba(255,171,64,0.15); border:1px solid rgba(255,171,64,0.5); color:#ffd090; font-size:12px;">■ MECH</span>
                <span style="padding:4px 12px; border-radius:6px; background:rgba(0,230,118,0.15); border:1px solid rgba(0,230,118,0.5); color:#80ffbb; font-size:12px;">■ CIVIL</span>
                <span style="padding:4px 12px; border-radius:6px; background:rgba(255,82,82,0.15); border:1px solid rgba(255,82,82,0.5); color:#ff9090; font-size:12px;">■ IT</span>
                <span style="padding:4px 12px; border-radius:6px; background:rgba(224,64,251,0.15); border:1px solid rgba(224,64,251,0.5); color:#f0a0ff; font-size:12px;">■ EEE</span>
            </div>
        </div>`;

        for (const hallName in halls) {
            const { hall, seats } = halls[hallName];
            const rows = hall.rows;
            const cols = hall.columns;

            html += `
            <div class="card" style="margin-bottom:25px;">
                <div style="margin-bottom:15px;">
                    <h3 style="color:#00d4ff;">🏫 ${hallName}</h3>
                    <p style="color:#555; font-size:13px; margin-top:4px;">${rows} rows × ${cols} columns | ${Object.keys(seats).length} students seated</p>
                </div>
                <div style="overflow-x:auto;">
                <div style="display:inline-grid; grid-template-columns:repeat(${cols}, 125px); gap:8px; padding:20px; background:var(--card2); border-radius:12px;">`;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const key = `${r}-${c}`;
                    if (seats[key]) {
                        const s = seats[key].student;
                        html += `
                        <div class="seat dept-${s.department}">
                            <div class="seat-number">R${r+1} | C${c+1}</div>
                            <div class="student-name">${s.name}</div>
                            <div class="dept-badge">${s.department} | ${s.rollNo}</div>
                        </div>`;
                    } else {
                        html += `<div class="seat empty">R${r+1} C${c+1}<br/>Empty</div>`;
                    }
                }
            }

            html += `</div></div><div class="entrance">🚪 ENTRANCE</div></div>`;
        }

        document.getElementById(targetId).innerHTML = html;
    } catch(e) {
        document.getElementById(targetId).innerHTML = `
        <div class="card" style="text-align:center; padding:40px;">
            <p style="color:#ff5252;">Error loading allocation!</p>
        </div>`;
    }
}

function showToast(msg, type) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 4000);
}

loadExams();