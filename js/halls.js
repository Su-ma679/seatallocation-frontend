const API = 'http://localhost:8080/api';
let allHalls = [];
let deleteId = null;

async function loadHalls() {
    try {
        const res = await fetch(`${API}/halls/all`);
        allHalls = await res.json();
        const tbody = document.getElementById('hallsTable');
        tbody.innerHTML = '';
        if (allHalls.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888; padding:30px;">No halls added yet</td></tr>';
            return;
        }
        allHalls.forEach((h, i) => {
            tbody.innerHTML += `
            <tr>
                <td>${i+1}</td>
                <td>${h.hallName}</td>
                <td>${h.rows}</td>
                <td>${h.columns}</td>
                <td>${h.totalSeats}</td>
                <td><button class="btn btn-danger" onclick="confirmDelete(${h.id})">🗑 Delete</button></td>
            </tr>`;
        });
    } catch(e) { showToast('❌ Backend not running!', 'error'); }
}

async function addHall() {
    const hallName = document.getElementById('hallName').value.trim();
    const rows = parseInt(document.getElementById('rows').value);
    const columns = parseInt(document.getElementById('columns').value);
    if (!hallName || !rows || !columns) { showToast('❌ Fill all fields!', 'error'); return; }
    const dup = allHalls.find(h => h.hallName === hallName);
    if (dup) { showToast('❌ Hall name already exists!', 'error'); return; }
    const res = await fetch(`${API}/halls/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hallName, rows, columns })
    });
    if (res.ok) {
        document.getElementById('hallName').value = '';
        document.getElementById('rows').value = '';
        document.getElementById('columns').value = '';
        showToast('✅ Hall added!', 'success');
        loadHalls();
    } else {
        showToast('❌ Failed to add hall!', 'error');
    }
}

function confirmDelete(id) {
    deleteId = id;
    document.getElementById('confirmModal').style.display = 'flex';
}

function closeConfirm() {
    deleteId = null;
    document.getElementById('confirmModal').style.display = 'none';
}

function confirmYes() { deleteHall(); }

async function deleteHall() {
    if (!deleteId) return;
    await fetch(`${API}/halls/delete/${deleteId}`, { method: 'DELETE' });
    closeConfirm();
    showToast('✅ Hall deleted!', 'success');
    loadHalls();
}

function showToast(msg, type) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 4000);
}

loadHalls();