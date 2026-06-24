const API = 'http://localhost:8080/api';
let allStudents = [];
let deleteId = null;

async function loadStudents() {
    try {
        const res = await fetch(`${API}/students/all`);
        allStudents = await res.json();
        renderTable(allStudents);
    } catch(e) { showToast('❌ Backend not running!', 'error'); }
}

function renderTable(students) {
    const tbody = document.getElementById('studentsTable');
    tbody.innerHTML = '';
    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888; padding:30px;">No students found</td></tr>';
        return;
    }
    students.forEach((s, i) => {
        tbody.innerHTML += `
        <tr>
            <td>${i+1}</td>
            <td>${s.name}</td>
            <td>${s.rollNo}</td>
            <td>${s.department}</td>
            <td>Year ${s.year}</td>
            <td><button class="btn btn-danger" onclick="confirmDelete(${s.id})">🗑 Delete</button></td>
        </tr>`;
    });
}

function searchStudents() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allStudents.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.rollNo.toLowerCase().includes(query)
    );
    renderTable(filtered);
}

async function addStudent() {
    const name = document.getElementById('name').value.trim();
    const rollNo = document.getElementById('rollNo').value.trim().toUpperCase();
    const department = document.getElementById('department').value;
    const year = parseInt(document.getElementById('year').value);

    if (!name || !rollNo) { showToast('❌ Fill all fields!', 'error'); return; }

    // Check if any exam is ongoing for this dept/year
    const examRes = await fetch(`${API}/exams/all`);
    const exams = await examRes.json();
    const now = new Date();
    const ongoingExam = exams.find(e => {
        const start = new Date(`${e.examDate}T${e.examTime}`);
        const end = new Date(`${e.examDate}T${e.endTime}`);
        const deptMatch = e.department === 'ALL' || e.department === department;
        const yearMatch = e.year == year;
        return now >= start && now <= end && deptMatch && yearMatch;
    });

    if (ongoingExam) {
        showToast(`🚫 Exam "${ongoingExam.subject}" is ongoing! Cannot add students now.`, 'error');
        return;
    }

    const duplicate = allStudents.find(s => s.rollNo === rollNo);
    if (duplicate) { showToast('❌ USN already exists!', 'error'); return; }

    const res = await fetch(`${API}/students/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rollNo, department, year })
    });

    if (res.ok) {
        document.getElementById('name').value = '';
        document.getElementById('rollNo').value = '';
        document.getElementById('department').selectedIndex = 0;
        document.getElementById('year').selectedIndex = 0;
        showToast('✅ Student added!', 'success');
        loadStudents();
    } else {
        showToast('❌ Failed to add!', 'error');
    }
}

async function uploadCSV() {
    const file = document.getElementById('csvFile').files[0];
    if (!file) { showToast('❌ Select a CSV file!', 'error'); return; }
    const text = await file.text();
    const lines = text.trim().split('\n');
    let added = 0, skipped = 0;
    for (const line of lines) {
        const parts = line.split(',');
        if (parts.length < 4) { skipped++; continue; }
        const name = parts[0].trim();
        const rollNo = parts[1].trim().toUpperCase();
        const department = parts[2].trim().toUpperCase();
        const year = parseInt(parts[3].trim());
        if (!name || !rollNo || !department || !year) { skipped++; continue; }
        const dup = allStudents.find(s => s.rollNo === rollNo);
        if (dup) { skipped++; continue; }
        await fetch(`${API}/students/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, rollNo, department, year })
        });
        added++;
    }
    showToast(`✅ Added ${added}, skipped ${skipped}!`, 'success');
    loadStudents();
}

function confirmDelete(id) {
    deleteId = id;
    document.getElementById('confirmModal').style.display = 'flex';
}

function closeConfirm() {
    deleteId = null;
    document.getElementById('confirmModal').style.display = 'none';
}

function confirmYes() { deleteStudent(); }

async function deleteStudent() {
    if (!deleteId) return;
    const res = await fetch(`${API}/students/delete/${deleteId}`, { method: 'DELETE' });
    if (res.ok) {
        closeConfirm();
        showToast('✅ Student deleted!', 'success');
        loadStudents();
    } else {
        showToast('❌ Cannot delete — student has seat allocation! Clear allocations first.', 'error');
        closeConfirm();
    }
}

function showToast(msg, type) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 4000);
}

loadStudents();