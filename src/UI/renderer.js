let currentView = 'movies';
let isAdmin = false;

// Admin credentials loaded from .env via main process
let ADMIN_USERNAME = '';
let ADMIN_PASSWORD = '';

// Auto-hide admin-only buttons for spectators
function hideAdminButtons() {
    if (isAdmin) return;
    document.querySelectorAll('.card-actions').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.add-btn-container').forEach(el => el.style.display = 'none');
    const db = document.getElementById('detail-body');
    if (db) {
        db.querySelectorAll('button[title]').forEach(el => el.style.display = 'none');
        db.querySelectorAll('.btn-glow, .btn').forEach(el => {
            const t = (el.textContent || '').toUpperCase();
            if (t.includes('ASSIGN') || t.includes('EDIT') || t.includes('PUBLISH') || t.includes('ADD')) {
                el.style.display = 'none';
            }
        });
    }
}

function enterApp(admin) {
    isAdmin = admin;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    const badge = document.getElementById('user-role-badge');
    badge.textContent = admin ? 'ADMIN' : 'SPECTATOR';
    badge.className = 'role-badge ' + (admin ? 'admin' : 'spectator');
    window.currentMovieFilter = 'all';
    loadView('movies');
    if (!admin) new MutationObserver(hideAdminButtons).observe(document.body, { childList: true, subtree: true });
}

function logout() {
    isAdmin = false;
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
}

document.addEventListener('DOMContentLoaded', async () => {
    // Load admin credentials from environment
    const creds = await window.api.getAdminCredentials();
    ADMIN_USERNAME = creds.username || '';
    ADMIN_PASSWORD = creds.password || '';

    // Nav Click Handling
    document.querySelectorAll('.nav-links li:not(.separator)').forEach(item => {
        item.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-links li').forEach(el => el.classList.remove('active'));
            e.currentTarget.classList.add('active');

            currentView = e.currentTarget.getAttribute('data-view');
            loadView(currentView);
        });
    });

    // Modal Close
    document.getElementById('modal-close').addEventListener('click', closeAddModal);

    // Modal Submit
    document.getElementById('modal-submit').addEventListener('click', submitAddModal);

    // Filter Click Handling
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            window.currentMovieFilter = e.currentTarget.getAttribute('data-filter');
            loadView('movies');
        });
    });

    // Login button
    document.getElementById('login-admin-btn').addEventListener('click', () => {
        const u = document.getElementById('login-username').value.trim();
        const p = document.getElementById('login-password').value.trim();
        const errorEl = document.getElementById('login-error');
        if (u === ADMIN_USERNAME && p === ADMIN_PASSWORD) {
            errorEl.textContent = '';
            enterApp(true);
        } else {
            errorEl.textContent = '> ERR: INVALID CREDENTIALS. TRY AGAIN.';
        }
    });

    // Clear error on input change
    document.getElementById('login-username').addEventListener('input', () => {
        document.getElementById('login-error').textContent = '';
    });
    document.getElementById('login-password').addEventListener('input', () => {
        document.getElementById('login-error').textContent = '';
    });

    // Enter key on password field
    document.getElementById('login-password').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('login-admin-btn').click();
    });

    // Spectator button
    document.getElementById('login-spectator-btn').addEventListener('click', () => {
        document.getElementById('login-error').textContent = '';
        enterApp(false);
    });

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', logout);
});

// Entity schemas for Add Modal
const schemas = {
    movies: [
        { name: 'title', label: 'Project Working Title', type: 'text' }
    ],
    actors: [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'birth_year', label: 'Birth Year', type: 'year-select' },
        { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'] }
    ],
    directors: [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'birth_year', label: 'Birth Year', type: 'year-select' }
    ],
    producers: [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'birth_year', label: 'Birth Year', type: 'year-select' },
        { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'] }
    ],
    crew: [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'birth_year', label: 'Birth Year', type: 'year-select' },
        { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'] }
    ]
};

window.deleteRecord = async function (type, id) {
    if (confirm(`Are you sure you want to delete this record (ID: ${id})?`)) {
        const res = await window.api.deleteEntity(type, id);
        if (res.success) {
            loadView(currentView);
        } else {
            alert(`Delete failed: ${res.error}\n\nThis is likely because of foreign key constraints (e.g., this person is linked to a movie).`);
        }
    }
};

window.openAddModal = async function (type) {
    if (type === 'movies') {
        const tempName = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const res = await window.api.addEntity('movies', { title: tempName });
        if (res.success) {
            loadView('movies');
        } else {
            alert(`Failed to create draft: ${res.error}`);
        }
        return;
    }

    currentAddType = type;
    document.getElementById('modal-title').innerText = `>> SYS.INSERT_${type.toUpperCase()}`;
    const schema = schemas[type];
    const container = document.getElementById('modal-form-container');
    container.innerHTML = '';

    schema.forEach(field => {
        const id = `input-${field.name}`;
        const group = document.createElement('div');
        group.className = 'form-group';

        let inputHtml = '';
        if (field.type === 'select') {
            inputHtml = `<select id="${id}">
                ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
            </select>`;
        } else if (field.type === 'year-select') {
            const currentYear = new Date().getFullYear();
            let options = '<option value="">Select Year</option>';
            for (let y = currentYear + 5; y >= 1880; y--) {
                options += `<option value="${y}">${y}</option>`;
            }
            inputHtml = `<select id="${id}">${options}</select>`;
        } else {
            inputHtml = `<input type="${field.type}" id="${id}" placeholder="Enter ${field.label.toLowerCase()}...">`;
        }

        group.innerHTML = `<label for="${id}">${field.name.toUpperCase()}</label>${inputHtml}`;
        container.appendChild(group);
    });

    document.getElementById('add-modal').classList.remove('hidden');
};

function closeAddModal() {
    document.getElementById('add-modal').classList.add('hidden');
}

async function submitAddModal() {
    if (!currentAddType) return;
    const schema = schemas[currentAddType];
    const data = {};

    schema.forEach(field => {
        const val = document.getElementById(`input-${field.name}`).value;
        data[field.name] = val;
    });

    if (currentAddType !== 'movies' && (!data.name || !data.name.trim())) {
        alert("Validation Error: Name is required.");
        return;
    }

    const submitBtn = document.getElementById('modal-submit');
    submitBtn.innerText = 'EXECUTING...';
    submitBtn.disabled = true;

    const res = await window.api.addEntity(currentAddType, data);

    submitBtn.innerText = 'EXECUTE_INSERT()';
    submitBtn.disabled = false;

    if (res.success) {
        closeAddModal();
        loadView(currentView);
    } else {
        alert(`Insert failed: ${res.error}`);
    }
}

function buildGenericTable(data, title, entityType = null) {
    if (!data || data.length === 0) {
        let html = `<div style="margin-bottom: 30px;"><h3 style="color: var(--accent); margin-bottom: 10px; font-weight:600;">> ${title}</h3><p style="color:var(--text-secondary);">No data found.</p>`;
        if (entityType && schemas[entityType]) {
            html += `<div class="add-btn-container" style="background:transparent; border:none; text-align:left; padding:0; margin-top:10px;"><button class="btn btn-glow" onclick="openAddModal('${entityType}')">+ ADD NEW ${entityType.toUpperCase()}</button></div>`;
        }
        html += `</div>`;
        return html;
    }
    const keys = Object.keys(data[0]);

    let html = `<div style="margin-bottom: 30px;">
        <h3 style="color: var(--accent); margin-bottom: 15px; font-weight: 600;">> ${title}</h3>
        <div class="table-container">
        <table>
            <thead><tr>${keys.map(k => `<th>${k.replace(/_/g, ' ')}</th>`).join('')}${entityType ? '<th>ACTION</th>' : ''}</tr></thead>
            <tbody>
                ${data.map(row => `<tr>${keys.map(k => {
        let val = row[k];
        if (val == null) return '<td style="color:#64748b;">NULL</td>';
        if (k.toLowerCase().includes('revenue') || k.toLowerCase().includes('cost') || k.toLowerCase().includes('budget') || k.toLowerCase().includes('pay') || k.toLowerCase().includes('profit') || k.toLowerCase().includes('spend')) {
            val = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
        } else if (k.toLowerCase().includes('pct') || k.toLowerCase().includes('rate')) {
            val = val + '%';
        } else if (k.toLowerCase() === 'id' || k.toLowerCase().includes('_id')) {
            val = `<span style="color:var(--accent);">#${val}</span>`;
        } else if (k.toLowerCase() === 'name' || k.toLowerCase() === 'title') {
            val = `<strong style="color:var(--text-primary);">${val}</strong>`;
        }
        return `<td>${val}</td>`;
    }).join('')}
                ${entityType ? `<td><button class="btn-delete" onclick="deleteRecord('${entityType}', ${row.id})">DELETE</button></td>` : ''}
                </tr>`).join('')}
            </tbody>
        </table>
        ${entityType && schemas[entityType] ? `<div class="add-btn-container"><button class="btn btn-glow" onclick="openAddModal('${entityType}')">+ ADD NEW ${entityType.toUpperCase()}</button></div>` : ''}
        </div>
    </div>`;
    return html;
}
function buildCardGrid(data, title, entityType) {
    if (!data || data.length === 0) {
        return `<div style="margin-bottom: 30px;"><h3 style="color: var(--accent); margin-bottom: 10px; font-weight:600;">> ${title}</h3><p style="color:var(--text-secondary);">No data found.</p>
        <div class="add-btn-container" style="background:transparent; border:none; text-align:left; padding:0; margin-top:10px;"><button class="btn btn-glow" onclick="openAddModal('${entityType}')">+ ADD NEW MOVIE</button></div></div>`;
    }

    let html = `<div style="margin-bottom: 30px;">
        <h3 style="color: var(--accent); margin-bottom: 20px; font-weight: 600;">> ${title}</h3>
        <div class="card-grid">`;

    const f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    data.forEach(item => {
        let statsHtml = '';

        let badgeClass = item.status === 'published' ? 'published' : 'draft';
        let badgeText = item.status === 'published' ? '[PUBLISHED]' : '[DRAFT]';

        html += `
        <div class="card" onclick="openMovieDetail(${item.id}, '${item.title.replace(/'/g, "\\'")}', '${item.status}')">
            <div class="card-badge ${badgeClass}">${badgeText}</div>
            <div class="card-title">${item.title}</div>
            <div class="card-body">
                ${item.status === 'published' ? `<p><strong>Release Year:</strong> <span style="color:var(--text-primary);">${item.release_year}</span></p>` : ''}
                <p style="margin-top:8px;"><strong>Genre:</strong> <span style="color:var(--text-primary);">${item.genre || 'N/A'}</span></p>
                <p style="margin-top:8px;"><strong>Topic:</strong> <span style="color:var(--text-primary);">${item.topic || 'N/A'}</span></p>
                ${statsHtml}
            </div>
            <div class="card-actions">
                <button class="btn-delete" onclick="event.stopPropagation(); deleteRecord('${entityType}', ${item.id})">DELETE</button>
            </div>
        </div>`;
    });

    html += `</div>
    <div class="add-btn-container" style="background:transparent; border:none; text-align:left; padding:0; margin-top:20px;">
        <button class="btn btn-glow" onclick="openAddModal('${entityType}')">+ ADD NEW MOVIE</button>
    </div>
    </div>`;

    return html;
}

function buildPersonCardGrid(data, title, entityType, detailFn) {
    if (!data || data.length === 0) {
        return `<div style="margin-bottom: 30px;"><h3 style="color: var(--accent); margin-bottom: 10px; font-weight:600;">> ${title}</h3><p style="color:var(--text-secondary);">No data found.</p>
        <div class="add-btn-container" style="background:transparent; border:none; text-align:left; padding:0; margin-top:10px;"><button class="btn btn-glow" onclick="openAddModal('${entityType}')">+ ADD NEW ${entityType.toUpperCase()}</button></div></div>`;
    }

    let html = `<div style="margin-bottom: 30px;">
        <h3 style="color: var(--accent); margin-bottom: 20px; font-weight: 600;">> ${title}</h3>
        <div class="card-grid">`;

    data.forEach(item => {
        const escapedName = item.name.replace(/'/g, "\\'");
        const genderRow = item.gender
            ? `<p style="margin-top:8px;"><strong>Gender:</strong> <span style="color:var(--text-primary);">${item.gender}</span></p>`
            : '';
        html += `
        <div class="card" onclick="${detailFn}(${item.id}, '${escapedName}')">
            <div class="card-badge">${item.birth_year || 'N/A'}</div>
            <div class="card-title">${item.name}</div>
            <div class="card-body">
                ${genderRow}
            </div>
            <div class="card-actions">
                <button class="btn-delete" onclick="event.stopPropagation(); deleteRecord('${entityType}', ${item.id})">DELETE</button>
            </div>
        </div>`;
    });

    html += `</div>
    <div class="add-btn-container" style="background:transparent; border:none; text-align:left; padding:0; margin-top:20px;">
        <button class="btn btn-glow" onclick="openAddModal('${entityType}')">+ ADD NEW ${entityType.toUpperCase()}</button>
    </div>
    </div>`;

    return html;
}

window.openMovieDetail = async function (id, title, status) {
    const modal = document.getElementById('detail-modal');
    document.getElementById('detail-title').innerText = `>> SYS.DETAILS [${title}]`;
    const body = document.getElementById('detail-body');
    body.innerHTML = '<p class="blink" style="color:var(--accent); font-family:monospace;">> FETCHING CLASSIFIED FILES...</p>';
    modal.classList.remove('hidden');

    try {
        const [roster, finance, movieFinance] = await Promise.all([
            window.api.getMovieFullRoster(id),
            window.api.getMovieTotalSpend(id),
            window.api.getMovieFinance(id)
        ]);

        const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
        const safeTitle = title.replace(/'/g, "\\'");

        let html = `
            <h4 style="color:var(--accent); margin-bottom: 10px; border-bottom: 1px dashed var(--border-color); padding-bottom:5px; font-family:monospace;">> ROSTER / CAST</h4>
            <ul style="list-style: none; color:var(--text-secondary); margin-bottom: 20px; max-height:180px; overflow-y:auto;">
        `;

        if (roster && roster.length > 0) {
            roster.forEach(r => {
                const roleText = r.role_detail ? r.role_detail : r.person_type;
                const safeName = r.person_name.replace(/'/g, "\\'");
                const safeRole = (r.role_detail || '').replace(/'/g, "\\'");

                let salaryBadge = '';
                if ((r.person_type === 'Actor' || r.person_type === 'Crew') && r.salary_or_investment) {
                    salaryBadge = `<span style="color:var(--accent); font-size:0.78rem; margin-left:6px;">${fmt.format(r.salary_or_investment)}</span>`;
                } else if (r.person_type === 'Producer' && r.salary_or_investment) {
                    salaryBadge = `<span style="color:#94a3b8; font-size:0.78rem; margin-left:6px;">inv: ${fmt.format(r.salary_or_investment)}</span>`;
                }

                let actionBtns = '';
                if (r.person_type === 'Actor') {
                    const sal = r.salary_or_investment != null ? r.salary_or_investment : 'null';
                    actionBtns = `
                        <button onclick="showEditRosterAssignment(${id},'${safeTitle}','${status}','Actor',${r.person_id},'${safeName}','${safeRole}',${sal})" style="background:none;border:1px solid #64748b;color:#94a3b8;padding:2px 7px;border-radius:3px;cursor:pointer;font-size:0.75rem;margin-left:6px;" title="Edit role/salary">✏</button>
                        <button onclick="unassignFromMovie(${id},'${safeTitle}','${status}','Actor',${r.person_id},'${safeName}')" style="background:none;border:1px solid var(--danger);color:var(--danger);padding:2px 7px;border-radius:3px;cursor:pointer;font-size:0.75rem;margin-left:4px;" title="Remove from movie">✕</button>`;
                } else if (r.person_type === 'Crew') {
                    const sal = r.salary_or_investment != null ? r.salary_or_investment : 'null';
                    actionBtns = `
                        <button onclick="showEditRosterAssignment(${id},'${safeTitle}','${status}','Crew',${r.person_id},'${safeName}','${safeRole}',${sal})" style="background:none;border:1px solid #64748b;color:#94a3b8;padding:2px 7px;border-radius:3px;cursor:pointer;font-size:0.75rem;margin-left:6px;" title="Edit role/salary">✏</button>
                        <button onclick="unassignFromMovie(${id},'${safeTitle}','${status}','Crew',${r.person_id},'${safeName}')" style="background:none;border:1px solid var(--danger);color:var(--danger);padding:2px 7px;border-radius:3px;cursor:pointer;font-size:0.75rem;margin-left:4px;" title="Remove from movie">✕</button>`;
                } else if (r.person_type === 'Director') {
                    actionBtns = `
                        <button onclick="unassignFromMovie(${id},'${safeTitle}','${status}','Director',${r.person_id},'${safeName}')" style="background:none;border:1px solid var(--danger);color:var(--danger);padding:2px 7px;border-radius:3px;cursor:pointer;font-size:0.75rem;margin-left:6px;" title="Remove director">✕</button>`;
                } else if (r.person_type === 'Producer') {
                    actionBtns = `
                        <button onclick="unassignFromMovie(${id},'${safeTitle}','${status}','Producer',${r.person_id},'${safeName}')" style="background:none;border:1px solid var(--danger);color:var(--danger);padding:2px 7px;border-radius:3px;cursor:pointer;font-size:0.75rem;margin-left:6px;" title="Remove producer">✕</button>`;
                }

                html += `<li style="padding:6px 0; border-bottom:1px solid var(--border-color); display:flex; align-items:center;">
                    <span style="flex:1;">— <strong style="color:var(--text-primary);">${r.person_name}</strong> <span style="font-size:0.8rem; color:#64748b;">(${roleText})</span>${salaryBadge}</span>
                    ${actionBtns}
                </li>`;
            });
        } else {
            html += `<li>No cast/crew assigned yet.</li>`;
        }
        html += `</ul>`;

        html += `
            <h4 style="color:var(--accent); margin-bottom: 10px; border-bottom: 1px dashed var(--border-color); padding-bottom:5px; font-family:monospace;">> FINANCIALS</h4>
            <div style="color:var(--text-secondary); font-family:monospace; font-size:0.85rem; line-height:2;">
        `;

        if (movieFinance) {
            html += `
                <p><strong>Budget (Investments):</strong> <span style="color:var(--text-primary);">${fmt.format(movieFinance.budget || 0)}</span></p>
                <p><strong>Production Cost:</strong> <span style="color:var(--danger);">${fmt.format(movieFinance.production_cost || 0)}</span></p>
                <p><strong>Marketing Cost:</strong> <span style="color:var(--danger);">${fmt.format(movieFinance.marketing_cost || 0)}</span></p>
            `;
            if (status === 'published') {
                html += `
                <p><strong>Box Office Revenue:</strong> <span style="color:var(--accent);">${fmt.format(movieFinance.box_office_revenue || 0)}</span></p>
                <p><strong>Net Profit:</strong> <span style="color:${(movieFinance.net_profit || 0) >= 0 ? 'var(--accent)' : 'var(--danger)'}; font-size:1rem; font-weight:bold;">${fmt.format(movieFinance.net_profit || 0)}</span></p>
                `;
            }
        }

        if (finance) {
            html += `<p style="margin-top:6px;"><strong>Total Payroll Spend:</strong> <span style="color:var(--danger); font-weight:bold;">${fmt.format(finance.total_spend || 0)}</span></p>`;
        }

        if (!movieFinance && !finance) {
            html += `<p>No financial records yet. Use EDIT FINANCES to add a producer and budget.</p>`;
        }

        html += `</div>`;

        if (status === 'draft') {
            html += `<button class="btn btn-glow" style="margin-top:20px; width:100%; border-color: #FFD700; color: #FFD700;" onclick="showPublishMovieForm(${id}, '${safeTitle}')">PUBLISH PROJECT</button>`;
        }
        html += `<button class="btn btn-glow" style="margin-top:10px; width:100%;" onclick="showEditFinanceForm(${id}, '${safeTitle}', '${status}')">EDIT FINANCES</button>`;

        body.innerHTML = html;

    } catch (err) {
        body.innerHTML = `<p style="color:var(--danger);">Error: ${err.message}</p>`;
    }
};

document.getElementById('detail-close').addEventListener('click', () => {
    document.getElementById('detail-modal').classList.add('hidden');
});

window.openActorDetail = async function (id, name) {
    const modal = document.getElementById('detail-modal');
    document.getElementById('detail-title').innerText = `>> SYS.ACTOR [${name}]`;
    const body = document.getElementById('detail-body');
    body.innerHTML = '<p class="blink" style="color:var(--accent); font-family:monospace;">> FETCHING CLASSIFIED FILES...</p>';
    modal.classList.remove('hidden');

    try {
        const movies = await window.api.getMoviesByActorId(id);
        const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

        let html = `<h4 style="color:var(--accent); margin-bottom: 10px; border-bottom: 1px dashed var(--border-color); padding-bottom:5px; font-family:monospace;">> FILMOGRAPHY</h4>
            <ul style="list-style: none; color:var(--text-secondary); margin-bottom: 10px; max-height:280px; overflow-y:auto;">`;

        if (movies && movies.length > 0) {
            movies.forEach(m => {
                const roleText = m.role ? ` <em style="color:#94a3b8;">as ${m.role}</em>` : '';
                const salaryText = m.salary ? `<span style="float:right; color:var(--accent); font-size:0.8rem;">${fmt.format(m.salary)}</span>` : '';
                html += `<li style="padding:8px 0; border-bottom: 1px solid var(--border-color);">
                    <strong style="color:var(--text-primary);">${m.title}</strong>
                    <span style="color:var(--accent); margin-left:6px;">(${m.release_year || 'N/A'})</span>
                    ${roleText}${salaryText}
                </li>`;
            });
        } else {
            html += `<li style="color:var(--text-secondary);">No movie assignments found.</li>`;
        }

        html += `</ul>`;

        html += `<button class="btn btn-glow" style="margin-top:20px; width:100%;" onclick="showAssignMovieForm('actor', ${id}, '${name.replace(/'/g, "\\'")}')">ASSIGN MOVIE</button>`;
        html += `<button class="btn" style="margin-top:8px; width:100%; border-color:#64748b; color:#94a3b8;" onclick="showEditPersonForm('actor', ${id}, '${name.replace(/'/g, "\\'")}')">EDIT INFO</button>`;

        body.innerHTML = html;

    } catch (err) {
        body.innerHTML = `<p style="color:var(--danger);">Error: ${err.message}</p>`;
    }
};

window.openDirectorDetail = async function (id, name) {
    const modal = document.getElementById('detail-modal');
    document.getElementById('detail-title').innerText = `>> SYS.DIRECTOR [${name}]`;
    const body = document.getElementById('detail-body');
    body.innerHTML = '<p class="blink" style="color:var(--accent); font-family:monospace;">> FETCHING CLASSIFIED FILES...</p>';
    modal.classList.remove('hidden');

    try {
        const [movies, roi] = await Promise.all([
            window.api.getMoviesByDirectorId(id),
            window.api.getDirectorRoi(id)
        ]);

        let html = `<h4 style="color:var(--accent); margin-bottom: 10px; border-bottom: 1px dashed var(--border-color); padding-bottom:5px; font-family:monospace;">> DIRECTED FILMS</h4>
            <ul style="list-style: none; color:var(--text-secondary); margin-bottom: 16px; max-height:200px; overflow-y:auto;">`;

        if (movies && movies.length > 0) {
            movies.forEach(m => {
                html += `<li style="padding:8px 0; border-bottom: 1px solid var(--border-color);">
                    <strong style="color:var(--text-primary);">${m.title}</strong>
                    <span style="color:var(--accent); margin-left:6px;">(${m.release_year || 'N/A'})</span>
                    ${m.genre ? `<span style="margin-left:8px; color:#64748b; font-size:0.8rem;">[${m.genre}]</span>` : ''}
                </li>`;
            });
        } else {
            html += `<li style="color:var(--text-secondary);">No directed films found.</li>`;
        }
        html += `</ul>`;

        if (roi) {
            const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
            const roiColor = (roi.roi_pct >= 0) ? 'var(--accent)' : 'var(--danger)';
            html += `<h4 style="color:var(--accent); margin-bottom: 10px; border-bottom: 1px dashed var(--border-color); padding-bottom:5px; font-family:monospace;">> ROI ANALYSIS</h4>
                <div style="color:var(--text-secondary); font-family:monospace; font-size:0.85rem; line-height:2;">
                    ${roi.total_budget != null ? `<p><strong>Total Budget:</strong> <span style="color:var(--text-primary);">${fmt.format(roi.total_budget)}</span></p>` : ''}
                    ${roi.total_spend != null ? `<p><strong>Total Spend:</strong> <span style="color:var(--danger);">${fmt.format(roi.total_spend)}</span></p>` : ''}
                    ${roi.total_revenue != null ? `<p><strong>Total Revenue:</strong> <span style="color:var(--accent);">${fmt.format(roi.total_revenue)}</span></p>` : ''}
                    ${roi.roi_pct != null ? `<p><strong>ROI:</strong> <span style="color:${roiColor}; font-size:1rem; font-weight:bold;">${roi.roi_pct}%</span></p>` : ''}
                </div>`;
        }

        html += `<button class="btn btn-glow" style="margin-top:20px; width:100%;" onclick="showAssignMovieFormDirector(${id}, '${name.replace(/'/g, "\\'")}')">ASSIGN TO MOVIE</button>`;
        html += `<button class="btn" style="margin-top:8px; width:100%; border-color:#64748b; color:#94a3b8;" onclick="showEditPersonForm('director', ${id}, '${name.replace(/'/g, "\\'")}')">EDIT INFO</button>`;

        body.innerHTML = html;
    } catch (err) {
        body.innerHTML = `<p style="color:var(--danger);">Error: ${err.message}</p>`;
    }
};

window.openProducerDetail = async function (id, name) {
    const modal = document.getElementById('detail-modal');
    document.getElementById('detail-title').innerText = `>> SYS.PRODUCER [${name}]`;
    const body = document.getElementById('detail-body');
    body.innerHTML = '<p class="blink" style="color:var(--accent); font-family:monospace;">> FETCHING CLASSIFIED FILES...</p>';
    modal.classList.remove('hidden');

    try {
        const movies = await window.api.getMoviesByProducerId(id);

        let html = `<h4 style="color:var(--accent); margin-bottom: 10px; border-bottom: 1px dashed var(--border-color); padding-bottom:5px; font-family:monospace;">> PRODUCED FILMS</h4>
            <ul style="list-style: none; color:var(--text-secondary); margin-bottom: 10px; max-height:280px; overflow-y:auto;">`;

        if (movies && movies.length > 0) {
            movies.forEach(m => {
                html += `<li style="padding:8px 0; border-bottom: 1px solid var(--border-color);">
                    <strong style="color:var(--text-primary);">${m.title}</strong>
                    <span style="color:var(--accent); margin-left:6px;">(${m.release_year || 'N/A'})</span>
                    ${m.genre ? `<span style="margin-left:8px; color:#64748b; font-size:0.8rem;">[${m.genre}]</span>` : ''}
                </li>`;
            });
        } else {
            html += `<li style="color:var(--text-secondary);">No produced films found.</li>`;
        }

        html += `</ul>`;
        html += `<button class="btn" style="margin-top:20px; width:100%; border-color:#64748b; color:#94a3b8;" onclick="showEditPersonForm('producer', ${id}, '${name.replace(/'/g, "\\'")}')">EDIT INFO</button>`;
        body.innerHTML = html;

    } catch (err) {
        body.innerHTML = `<p style="color:var(--danger);">Error: ${err.message}</p>`;
    }
};


window.openCrewDetail = async function (id, name) {
    const modal = document.getElementById('detail-modal');
    document.getElementById('detail-title').innerText = `>> SYS.CREW [${name}]`;
    const body = document.getElementById('detail-body');
    body.innerHTML = '<p class="blink" style="color:var(--accent); font-family:monospace;">> FETCHING CLASSIFIED FILES...</p>';
    modal.classList.remove('hidden');

    try {
        const movies = await window.api.getMoviesByCrewMemberId(id);
        const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

        let html = `<h4 style="color:var(--accent); margin-bottom: 10px; border-bottom: 1px dashed var(--border-color); padding-bottom:5px; font-family:monospace;">> FILMOGRAPHY</h4>
            <ul style="list-style: none; color:var(--text-secondary); margin-bottom: 10px; max-height:280px; overflow-y:auto;">`;

        if (movies && movies.length > 0) {
            movies.forEach(m => {
                const roleText = m.job_title ? ` <em style="color:#94a3b8;">as ${m.job_title}</em>` : '';
                const salaryText = m.salary ? `<span style="float:right; color:var(--accent); font-size:0.8rem;">${fmt.format(m.salary)}</span>` : '';
                html += `<li style="padding:8px 0; border-bottom: 1px solid var(--border-color);">
                    <strong style="color:var(--text-primary);">${m.title}</strong>
                    <span style="color:var(--accent); margin-left:6px;">(${m.release_year || 'N/A'})</span>
                    ${roleText}${salaryText}
                </li>`;
            });
        } else {
            html += `<li style="color:var(--text-secondary);">No movie assignments found.</li>`;
        }
        html += `</ul>`;

        html += `<button class="btn btn-glow" style="margin-top:20px; width:100%;" onclick="showAssignMovieForm('crew', ${id}, '${name.replace(/'/g, "\\'")}')">ASSIGN MOVIE</button>`;
        html += `<button class="btn" style="margin-top:8px; width:100%; border-color:#64748b; color:#94a3b8;" onclick="showEditPersonForm('crew', ${id}, '${name.replace(/'/g, "\\'")}')">EDIT INFO</button>`;

        body.innerHTML = html;
    } catch (err) {
        body.innerHTML = `<p style="color:var(--danger);">Error: ${err.message}</p>`;
    }
};

window.showEditFinanceForm = async function (movieId, movieTitle, status) {
    const body = document.getElementById('detail-body');
    body.innerHTML = '<p class="blink" style="color:var(--accent); font-family:monospace;">> PREPARING FORM...</p>';

    try {
        const producers = await window.api.getAllProducers();
        const finance = await window.api.getMovieTotalSpend(movieId);

        // Try to fetch existing movie finance data. If we can't, we just show empty inputs.
        // Actually, we can get current financial values from 'finance' if they match, but getMovieTotalSpend only returns total_spend.
        // It's okay, we'll just show empty for now, or you could add a getMovieFinance route.
        // Let's just keep them empty initially as a true form.

        let producerOpts = `<option value="">Select Producer...</option>`;
        producers.forEach(p => {
            producerOpts += `<option value="${p.id}">${p.name}</option>`;
        });
        producerOpts += `<option value="new">+ CREATE NEW PRODUCER</option>`;

        const html = `
            <div style="margin-bottom:20px;">
                <h4 style="color:var(--accent); margin-bottom: 15px; border-bottom: 1px dashed var(--border-color); padding-bottom:5px; font-family:monospace;">> EDIT FINANCES</h4>
                
                <div class="form-group">
                    <label>PRODUCER (FUNDS THE MOVIE)</label>
                    <select id="fin-producer" onchange="if(this.value==='new') document.getElementById('fin-new-prod-container').style.display='block'; else document.getElementById('fin-new-prod-container').style.display='none';">
                        ${producerOpts}
                    </select>
                </div>
                
                <div class="form-group" id="fin-new-prod-container" style="display:none; background: rgba(0,255,204,0.05); padding:10px; border-left:3px solid var(--accent);">
                    <label>NEW PRODUCER NAME</label>
                    <input type="text" id="fin-new-prod-name" placeholder="Enter new producer name...">
                </div>
                
                <div class="form-group">
                    <label>PRODUCER INVESTMENT ($)</label>
                    <input type="number" id="fin-investment" placeholder="0">
                </div>
                
                <div class="form-group">
                    <label>PRODUCTION COST ($)</label>
                    <input type="number" id="fin-prod-cost" placeholder="0">
                </div>
                
                <div class="form-group">
                    <label>MARKETING COST ($)</label>
                    <input type="number" id="fin-mkt-cost" placeholder="0">
                </div>
                
                <div class="form-group">
                    <label>BOX OFFICE REVENUE ($)</label>
                    ${status === 'draft'
                        ? `<input type="number" id="fin-box-office" placeholder="0" disabled style="opacity:0.4; cursor:not-allowed;">
                           <p style="color:#64748b; font-size:0.75rem; margin-top:4px;">Revenue is editable only after the movie is published.</p>`
                        : `<input type="number" id="fin-box-office" placeholder="0">`
                    }
                </div>
                
                <div style="display:flex; justify-content:space-between; margin-top:20px;">
                    <button class="btn btn-delete" onclick="openMovieDetail(${movieId}, '${movieTitle.replace(/'/g, "\\'")}', '${status}')">CANCEL</button>
                    <button class="btn btn-glow" id="fin-submit-btn" onclick="submitEditFinance(${movieId}, '${movieTitle.replace(/'/g, "\\'")}', '${status}')">EXECUTE_UPDATE()</button>
                </div>
            </div>
        `;
        body.innerHTML = html;
    } catch (err) {
        body.innerHTML = `<p style="color:var(--danger);">Error: ${err.message}</p>`;
    }
};

window.submitEditFinance = async function (movieId, movieTitle, status) {
    const prodId = document.getElementById('fin-producer').value;
    if (!prodId) {
        alert("Validation Error: Producer must be selected.");
        return;
    }

    const prodName = document.getElementById('fin-new-prod-name').value;
    if (prodId === 'new' && (!prodName || !prodName.trim())) {
        alert("Validation Error: New Producer Name is required.");
        return;
    }

    const data = {
        movieId: movieId,
        producerId: prodId,
        producerName: prodName,
        investment: document.getElementById('fin-investment').value || null,
        productionCost: document.getElementById('fin-prod-cost').value || null,
        marketingCost: document.getElementById('fin-mkt-cost').value || null,
        boxOfficeRevenue: status === 'published'
            ? (document.getElementById('fin-box-office').value || null)
            : undefined
    };

    const btn = document.getElementById('fin-submit-btn');
    btn.innerText = 'UPDATING...';
    btn.disabled = true;

    const res = await window.api.updateMovieFinance(data);
    if (res.success) {
        loadView(currentView); // Refresh background view
        openMovieDetail(movieId, movieTitle, status); // Go back to details
    } else {
        btn.innerText = 'EXECUTE_UPDATE()';
        btn.disabled = false;
        alert(`Update failed: ${res.error}`);
    }
};

window.showAssignMovieForm = async function (type, personId, personName) {
    const body = document.getElementById('detail-body');
    body.innerHTML = '<p class="blink" style="color:var(--accent); font-family:monospace;">> PREPARING FORM...</p>';

    try {
        const movies = await window.api.getAllMovies();

        let movieOpts = `<option value="">Select Movie...</option>`;
        movies.forEach(m => {
            movieOpts += `<option value="${m.id}">${m.title} (${m.release_year})</option>`;
        });

        const html = `
            <div style="margin-bottom:20px;">
                <h4 style="color:var(--accent); margin-bottom: 15px; border-bottom: 1px dashed var(--border-color); padding-bottom:5px; font-family:monospace;">> ASSIGN TO MOVIE</h4>
                
                <div class="form-group">
                    <label>MOVIE</label>
                    <select id="assign-movie-id">
                        ${movieOpts}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>ROLE / JOB TITLE</label>
                    <input type="text" id="assign-role" placeholder="e.g. Lead Actor, Cameraman...">
                </div>
                
                <div class="form-group">
                    <label>SALARY ($) [REQUIRED]</label>
                    <input type="number" id="assign-salary" placeholder="0">
                </div>
                
                <div style="display:flex; justify-content:space-between; margin-top:20px;">
                    <button class="btn btn-delete" onclick="${type === 'actor' ? `openActorDetail(${personId}, '${personName.replace(/'/g, "\\'")}')` : `openCrewDetail(${personId}, '${personName.replace(/'/g, "\\'")}')`}">CANCEL</button>
                    <button class="btn btn-glow" id="assign-submit-btn" onclick="submitAssignMovie('${type}', ${personId}, '${personName.replace(/'/g, "\\'")}')">EXECUTE_ASSIGN()</button>
                </div>
            </div>
        `;
        body.innerHTML = html;
    } catch (err) {
        body.innerHTML = `<p style="color:var(--danger);">Error: ${err.message}</p>`;
    }
};

window.submitAssignMovie = async function (type, personId, personName) {
    const movieId = document.getElementById('assign-movie-id').value;
    const role = document.getElementById('assign-role').value;
    const salary = document.getElementById('assign-salary').value;

    if (!movieId) {
        alert("Validation Error: Movie must be selected.");
        return;
    }
    if (!salary) {
        alert("Validation Error: Salary is required.");
        return;
    }

    const btn = document.getElementById('assign-submit-btn');
    btn.innerText = 'ASSIGNING...';
    btn.disabled = true;

    let res;
    if (type === 'actor') {
        res = await window.api.assignMovieActor({ movieId, actorId: personId, role: role || null, salary });
    } else {
        res = await window.api.assignMovieCrew({ movieId, crewId: personId, jobTitle: role || null, salary });
    }

    if (res.success) {
        if (type === 'actor') openActorDetail(personId, personName);
        else openCrewDetail(personId, personName);
    } else {
        btn.innerText = 'EXECUTE_ASSIGN()';
        btn.disabled = false;
        alert(`Assignment failed: ${res.error}`);
    }
};

window.showPublishMovieForm = async function (movieId, movieTitle) {
    const body = document.getElementById('detail-body');
    body.innerHTML = '<p class="blink" style="color:var(--accent); font-family:monospace;">> PREPARING FORM...</p>';

    try {
        const currentYear = new Date().getFullYear();
        let yearOptions = '<option value="">Select Year...</option>';
        for (let y = currentYear + 5; y >= 1880; y--) {
            yearOptions += `<option value="${y}">${y}</option>`;
        }

        const html = `
            <div style="margin-bottom:20px;">
                <h4 style="color:#FFD700; margin-bottom: 15px; border-bottom: 1px dashed var(--border-color); padding-bottom:5px; font-family:monospace;">> PUBLISH: ${movieTitle}</h4>
                <p style="color:var(--text-secondary); font-size: 0.85rem; margin-bottom: 20px;">
                    Warning: A project cannot be published without an assigned Producer (Finance Record).
                </p>
                
                <div class="form-group">
                    <label for="pub-title">FINAL TITLE [REQUIRED]</label>
                    <input type="text" id="pub-title" value="${movieTitle.replace(/"/g, '&quot;')}" autofocus>
                </div>
                
                <div class="form-group">
                    <label for="pub-genre">GENRE [REQUIRED]</label>
                    <input type="text" id="pub-genre" placeholder="e.g. Sci-Fi, Action...">
                </div>
                
                <div class="form-group">
                    <label for="pub-topic">TOPIC [REQUIRED]</label>
                    <input type="text" id="pub-topic" placeholder="e.g. Cybernetics, AI Rebellion...">
                </div>
                
                <div class="form-group">
                    <label for="pub-year">RELEASE YEAR [REQUIRED]</label>
                    <select id="pub-year">
                        ${yearOptions}
                    </select>
                </div>
                
                <div style="display:flex; justify-content:space-between; margin-top:20px;">
                    <button class="btn btn-delete" onclick="openMovieDetail(${movieId}, '${movieTitle.replace(/'/g, "\\'")}', 'draft')">CANCEL</button>
                    <button class="btn btn-glow" style="border-color: #FFD700; color: #FFD700;" id="pub-submit-btn" onclick="submitPublishMovie(${movieId}, '${movieTitle.replace(/'/g, "\\'")}')">EXECUTE_PUBLISH()</button>
                </div>
            </div>
        `;
        body.innerHTML = html;
    } catch (err) {
        body.innerHTML = `<p style="color:var(--danger);">Error: ${err.message}</p>`;
    }
};

window.submitPublishMovie = async function (movieId, movieTitle) {
    const title = document.getElementById('pub-title').value;
    const genre = document.getElementById('pub-genre').value;
    const topic = document.getElementById('pub-topic').value;
    const year = document.getElementById('pub-year').value;

    if (!title || !genre || !topic || !year) {
        alert("Validation Error: All fields (Title, Genre, Topic, Release Year) are required to publish.");
        return;
    }

    if (title.trim() === movieTitle && movieTitle.startsWith('temp_')) {
        alert("Validation Error: You must change the auto-generated temporary title before publishing.");
        return;
    }

    if (title.trim().toLowerCase().startsWith('temp_') || title.trim().toLowerCase() === 'temp') {
        alert("Validation Error: Final title cannot be or start with 'temp'.");
        return;
    }

    const btn = document.getElementById('pub-submit-btn');
    btn.innerText = 'PUBLISHING...';
    btn.disabled = true;

    try {
        const res = await window.api.publishMovie({
            id: movieId,
            title: title.trim(),
            genre: genre,
            topic: topic,
            release_year: parseInt(year)
        });

        if (res.success) {
            loadView(currentView); // Refresh background view
            document.getElementById('detail-modal').classList.add('hidden');
        } else {
            btn.innerText = 'EXECUTE_PUBLISH()';
            btn.disabled = false;
            alert(`Publish failed: ${res.error}`);
        }
    } catch (error) {
        btn.innerText = 'EXECUTE_PUBLISH()';
        btn.disabled = false;
        alert(`UI Error: ${error.message}`);
    }
};

// ============================================================
// UNASSIGN FROM MOVIE
// ============================================================

window.unassignFromMovie = async function (movieId, movieTitle, status, personType, personId, personName) {
    if (!confirm(`Remove "${personName}" from "${movieTitle}"?`)) return;

    let res;
    const t = personType.toLowerCase();
    if (t === 'actor')    res = await window.api.unassignMovieActor({ movieId, actorId: personId });
    else if (t === 'director') res = await window.api.unassignMovieDirector({ movieId, directorId: personId });
    else if (t === 'crew')     res = await window.api.unassignMovieCrew({ movieId, crewId: personId });
    else if (t === 'producer') res = await window.api.unassignMovieProducer({ movieId, producerId: personId });

    if (res && res.success) {
        openMovieDetail(movieId, movieTitle, status);
    } else {
        alert(`Remove failed: ${res?.error}`);
    }
};

// ============================================================
// RE-ASSIGN (edit role/salary for actor or crew on a movie)
// ============================================================

window.showEditRosterAssignment = async function (movieId, movieTitle, status, personType, personId, personName, currentRole, currentSalary) {
    const body = document.getElementById('detail-body');
    const labelRole = personType === 'Actor' ? 'ROLE' : 'JOB TITLE';
    const safeTitle = movieTitle.replace(/'/g, "\\'");
    const safeName  = personName.replace(/'/g, "\\'");

    body.innerHTML = `
        <div>
            <h4 style="color:var(--accent); margin-bottom:15px; border-bottom:1px dashed var(--border-color); padding-bottom:5px; font-family:monospace;">> EDIT ASSIGNMENT: ${personName}</h4>

            <div class="form-group">
                <label>${labelRole}</label>
                <input type="text" id="edit-roster-role" value="${currentRole || ''}" placeholder="Enter ${labelRole.toLowerCase()}...">
            </div>

            <div class="form-group">
                <label>SALARY ($)</label>
                <input type="number" id="edit-roster-salary" value="${currentSalary != null ? currentSalary : ''}" placeholder="0">
            </div>

            <div style="display:flex; justify-content:space-between; margin-top:20px;">
                <button class="btn btn-delete" onclick="openMovieDetail(${movieId}, '${safeTitle}', '${status}')">CANCEL</button>
                <button class="btn btn-glow" id="edit-roster-btn" onclick="submitEditRosterAssignment(${movieId}, '${safeTitle}', '${status}', '${personType}', ${personId}, '${safeName}')">EXECUTE_UPDATE()</button>
            </div>
        </div>
    `;
};

window.submitEditRosterAssignment = async function (movieId, movieTitle, status, personType, personId, personName) {
    const role   = document.getElementById('edit-roster-role').value || null;
    const salary = document.getElementById('edit-roster-salary').value || null;

    const btn = document.getElementById('edit-roster-btn');
    btn.innerText = 'UPDATING...';
    btn.disabled  = true;

    let res;
    if (personType === 'Actor') {
        res = await window.api.updateMovieActor({ movieId, actorId: personId, role, salary });
    } else {
        res = await window.api.updateMovieCrew({ movieId, crewId: personId, jobTitle: role, salary });
    }

    if (res.success) {
        openMovieDetail(movieId, movieTitle, status);
    } else {
        btn.innerText = 'EXECUTE_UPDATE()';
        btn.disabled  = false;
        alert(`Update failed: ${res.error}`);
    }
};

// ============================================================
// ASSIGN DIRECTOR TO MOVIE
// ============================================================

window.showAssignMovieFormDirector = async function (directorId, directorName) {
    const body = document.getElementById('detail-body');
    body.innerHTML = '<p class="blink" style="color:var(--accent); font-family:monospace;">> PREPARING FORM...</p>';

    try {
        const movies = await window.api.getAllMovies();
        let movieOpts = `<option value="">Select Movie...</option>`;
        movies.forEach(m => {
            movieOpts += `<option value="${m.id}">${m.title}</option>`;
        });

        const safeName = directorName.replace(/'/g, "\\'");

        body.innerHTML = `
            <div>
                <h4 style="color:var(--accent); margin-bottom:15px; border-bottom:1px dashed var(--border-color); padding-bottom:5px; font-family:monospace;">> ASSIGN DIRECTOR TO MOVIE</h4>

                <div class="form-group">
                    <label>MOVIE</label>
                    <select id="dir-assign-movie-id">
                        ${movieOpts}
                    </select>
                </div>

                <div style="display:flex; justify-content:space-between; margin-top:20px;">
                    <button class="btn btn-delete" onclick="openDirectorDetail(${directorId}, '${safeName}')">CANCEL</button>
                    <button class="btn btn-glow" id="dir-assign-btn" onclick="submitAssignMovieDirector(${directorId}, '${safeName}')">EXECUTE_ASSIGN()</button>
                </div>
            </div>
        `;
    } catch (err) {
        body.innerHTML = `<p style="color:var(--danger);">Error: ${err.message}</p>`;
    }
};

window.submitAssignMovieDirector = async function (directorId, directorName) {
    const movieId = document.getElementById('dir-assign-movie-id').value;
    if (!movieId) {
        alert('Validation Error: Movie must be selected.');
        return;
    }

    const btn = document.getElementById('dir-assign-btn');
    btn.innerText = 'ASSIGNING...';
    btn.disabled  = true;

    const res = await window.api.assignMovieDirector({ movieId, directorId });
    if (res.success) {
        openDirectorDetail(directorId, directorName);
    } else {
        btn.innerText = 'EXECUTE_ASSIGN()';
        btn.disabled  = false;
        alert(`Assignment failed: ${res.error}`);
    }
};

// ============================================================
// EDIT PERSON INFO
// ============================================================

window.showEditPersonForm = async function (type, id, name) {
    const body = document.getElementById('detail-body');
    body.innerHTML = '<p class="blink" style="color:var(--accent); font-family:monospace;">> FETCHING CURRENT DATA...</p>';

    try {
        let person;
        if (type === 'actor')    person = await window.api.getActorById(id);
        else if (type === 'director') person = await window.api.getDirectorById(id);
        else if (type === 'producer') person = await window.api.getProducerById(id);
        else                          person = await window.api.getCrewMemberById(id);

        const currentYear = new Date().getFullYear();
        let yearOptions = '<option value="">Not specified</option>';
        for (let y = currentYear; y >= 1880; y--) {
            yearOptions += `<option value="${y}" ${person.birth_year == y ? 'selected' : ''}>${y}</option>`;
        }

        const hasGender = type !== 'director';
        const genderHtml = hasGender ? `
            <div class="form-group">
                <label>GENDER</label>
                <select id="edit-person-gender">
                    <option value="Male"   ${person.gender === 'Male'   ? 'selected' : ''}>Male</option>
                    <option value="Female" ${person.gender === 'Female' ? 'selected' : ''}>Female</option>
                </select>
            </div>` : '';

        const cancelFn = type === 'actor'    ? `openActorDetail(${id}, '${name.replace(/'/g, "\\'")}')` :
                         type === 'director' ? `openDirectorDetail(${id}, '${name.replace(/'/g, "\\'")}')` :
                         type === 'producer' ? `openProducerDetail(${id}, '${name.replace(/'/g, "\\'")}')` :
                                               `openCrewDetail(${id}, '${name.replace(/'/g, "\\'")}')`;

        body.innerHTML = `
            <div>
                <h4 style="color:var(--accent); margin-bottom:15px; border-bottom:1px dashed var(--border-color); padding-bottom:5px; font-family:monospace;">> EDIT INFO: ${name}</h4>

                <div class="form-group">
                    <label>NAME</label>
                    <input type="text" id="edit-person-name" value="${person.name.replace(/"/g, '&quot;')}">
                </div>

                <div class="form-group">
                    <label>BIRTH YEAR</label>
                    <select id="edit-person-year">${yearOptions}</select>
                </div>

                ${genderHtml}

                <div style="display:flex; justify-content:space-between; margin-top:20px;">
                    <button class="btn btn-delete" onclick="${cancelFn}">CANCEL</button>
                    <button class="btn btn-glow" id="edit-person-btn" onclick="submitEditPerson('${type}', ${id})">EXECUTE_UPDATE()</button>
                </div>
            </div>
        `;
    } catch (err) {
        body.innerHTML = `<p style="color:var(--danger);">Error: ${err.message}</p>`;
    }
};

window.submitEditPerson = async function (type, id) {
    const name      = document.getElementById('edit-person-name').value.trim();
    const birthYear = document.getElementById('edit-person-year').value || null;

    if (!name) {
        alert('Validation Error: Name is required.');
        return;
    }

    let gender = null;
    if (type !== 'director') {
        gender = document.getElementById('edit-person-gender').value;
    }

    const btn = document.getElementById('edit-person-btn');
    btn.innerText = 'UPDATING...';
    btn.disabled  = true;

    let res;
    if (type === 'actor')         res = await window.api.updateActor({ id, name, birthYear, gender });
    else if (type === 'director') res = await window.api.updateDirector({ id, name, birthYear });
    else if (type === 'producer') res = await window.api.updateProducer({ id, name, birthYear, gender });
    else                          res = await window.api.updateCrewMember({ id, name, birthYear, gender });

    if (res.success) {
        loadView(currentView);
        if (type === 'actor')         openActorDetail(id, name);
        else if (type === 'director') openDirectorDetail(id, name);
        else if (type === 'producer') openProducerDetail(id, name);
        else                          openCrewDetail(id, name);
    } else {
        btn.innerText = 'EXECUTE_UPDATE()';
        btn.disabled  = false;
        alert(`Update failed: ${res.error}`);
    }
};

async function loadView(view) {
    const title = document.getElementById('view-title');
    const dynamicView = document.getElementById('dynamic-view');

    dynamicView.innerHTML = '<p style="color: var(--accent); font-family: monospace;" class="blink">> FETCHING DATA...</p>';

    try {
        const filtersDiv = document.getElementById('movie-filters');

        if (view === 'movies') {
            filtersDiv.classList.remove('hidden');
            title.innerText = 'MOVIES_DIRECTORY';
            const [movies, financials] = await Promise.all([
                window.api.getAllMovies(),
                window.api.getFinancialOverview()
            ]);

            let merged = movies.map(m => {
                const fin = financials.find(f => f.movie_id === m.id) || {};
                return { ...m, ...fin };
            });

            if (window.currentMovieFilter === 'draft') {
                merged = merged.filter(m => m.status === 'draft');
            } else if (window.currentMovieFilter === 'published') {
                merged = merged.filter(m => m.status === 'published');
            }

            dynamicView.innerHTML = buildCardGrid(merged, 'MOVIES DATABASE', 'movies');
        }
        else if (view === 'actors') {
            filtersDiv.classList.add('hidden');
            title.innerText = 'ACTORS_DIRECTORY';
            const data = await window.api.getAllActors();
            dynamicView.innerHTML = buildPersonCardGrid(data, 'ALL_ACTORS', 'actors', 'openActorDetail');
        }
        else if (view === 'directors') {
            title.innerText = 'DIRECTORS_DIRECTORY';
            const data = await window.api.getAllDirectors();
            dynamicView.innerHTML = buildPersonCardGrid(data, 'ALL_DIRECTORS', 'directors', 'openDirectorDetail');
        }
        else if (view === 'producers') {
            title.innerText = 'PRODUCERS_DIRECTORY';
            const data = await window.api.getAllProducers();
            dynamicView.innerHTML = buildPersonCardGrid(data, 'ALL_PRODUCERS', 'producers', 'openProducerDetail');
        }
        else if (view === 'crew') {
            title.innerText = 'CREW_DIRECTORY';
            const data = await window.api.getAllCrew();
            dynamicView.innerHTML = buildPersonCardGrid(data, 'REGISTERED_CREW', 'crew', 'openCrewDetail');
        }
    } catch (err) {
        dynamicView.innerHTML = `<div style="background: rgba(255, 0, 85, 0.1); border: 1px solid var(--danger); color: var(--danger); padding: 20px; font-family: monospace;">
            <h4>> ERR_FETCH_DATA</h4>
            <p>${err.message}</p>
        </div>`;
    }
}
