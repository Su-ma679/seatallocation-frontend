const API = 'http://localhost:8080/api';
let allExams = [];
let deleteId = null;

async function loadExams() {
    try {
        const res = await fetch(`${API}/exams/all`);
        allExams = await res.json();
        const tbody = document.getElementById('examsTable');
        tbody.innerHTML = '';
        if (allExams.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:#888; padding:30px;">No exams scheduled yet</td></tr>';
            return;
        }
        const now = new Date();
        allExams.forEach((e, i) => {
            const start = new Date(`${e.examDate}T${e.startTime}`);
            const end = new Date(`${e.examDate}T${e.endTime}`);
            let status = '', color = '';
            if (now < start) { status = '🟢 Upcoming'; color = '#00e676'; }
            else if (now >= start && now <= end) { status = '🔴 Ongoing'; color = '#ff5252'; }
            else { status = '⚫ Expired'; color = '#666'; }

            tbody.innerHTML += `
            <tr>
                <td>${i+1}</td>
                <td><strong style="color:#6c63ff;">${e.subjectCode}</strong></td>
                <td>${e.subject}</td>
                <td>${e.examDate}</td>
                <td>${e.startTime}</td>
                <td>${e.endTime}</td>
                <td>${e.department}</td>
                <td>Year ${e.year}</td>
                <td><span style="color:${color}; font-weight:600;">${status}</span></td>
                <td><button class="btn btn-danger" onclick="confirmDelete(${e.id})">🗑</button></td>
            </tr>`;
        });
    } catch(e) { showToast('❌ Backend not running!', 'error'); }
}

async function addExam() {
    const subjectCode = document.getElementById('subjectCode').value.trim().toUpperCase();
    const subject = document.getElementById('subject').value.trim();
    const examDate = document.getElementById('examDate').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const department = document.getElementById('department').value;
    const year = parseInt(document.getElementById('year').value);

    if (!subjectCode || !subject || !examDate || !startTime || !endTime) {
        showToast('❌ Fill all fields!', 'error'); return;
    }

    if (endTime <= startTime) {
        showToast('❌ End time must be after start time!', 'error'); return;
    }

    showToast('⏳ Checking conflicts...', 'success');

    const res = await fetch(`${API}/exams/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectCode, subject, examDate, startTime, endTime, department, year })
    });

    const data = await res.json();

    if (data.status === 'error') {
        showToast(data.message, 'error');
        // Show conflict message in UI
        document.getElementById('conflictMsg') &&
            (document.getElementById('conflictMsg').textContent = data.message);
        return;
    }

    document.getElementById('subjectCode').value = '';
    document.getElementById('subject').value = '';
    document.getElementById('examDate').value = '';
    document.getElementById('startTime').value = '';
    document.getElementById('endTime').value = '';
    document.getElementById('department').selectedIndex = 0;
    document.getElementById('year').selectedIndex = 0;

    showToast('✅ Exam scheduled!', 'success');
    loadExams();
}

function confirmDelete(id) {
    deleteId = id;
    document.getElementById('confirmModal').style.display = 'flex';
}

function closeConfirm() {
    deleteId = null;
    document.getElementById('confirmModal').style.display = 'none';
}

function confirmYes() { deleteExam(); }

async function deleteExam() {
    if (!deleteId) return;
    await fetch(`${API}/exams/delete/${deleteId}`, { method: 'DELETE' });
    closeConfirm();
    showToast('✅ Exam deleted!', 'success');
    loadExams();
}

function showToast(msg, type) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 5000);
}

loadExams();
setInterval(loadExams, 60000);