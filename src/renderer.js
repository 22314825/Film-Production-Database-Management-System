let currentView = 'movies';

document.addEventListener('DOMContentLoaded', async () => {
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

    // Load initial view
    window.currentMovieFilter = 'all';
    loadView('movies');
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
            val = `<strong style="color:#fff;">${val}</strong>`;
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
                ${item.status === 'published' ? `<p><strong>Release Year:</strong> <span style="color:#fff;">${item.release_year}</span></p>` : ''}
                <p style="margin-top:8px;"><strong>Genre:</strong> <span style="color:#fff;">${item.genre || 'N/A'}</span></p>
                <p style="margin-top:8px;"><strong>Topic:</strong> <span style="color:#fff;">${item.topic || 'N/A'}</span></p>
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
            ? `<p style="margin-top:8px;"><strong>Gender:</strong> <span style="color:#fff;">${item.gender}</span></p>`
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
        const [roster, finance] = await Promise.all([
            window.api.getMovieFullRoster(id),
            window.api.getMovieTotalSpend(id)
        ]);

        let html = `
            <h4 style="color:var(--accent); margin-bottom: 10px; border-bottom: 1px dashed var(--border-color); padding-bottom:5px; font-family:monospace;">> ROSTER / CAST</h4>
            <ul style="list-style: none; color:var(--text-secondary); margin-bottom: 20px; max-height:150px; overflow-y:auto;">
        `;
        if (roster && roster.length > 0) {
            roster.forEach(r => {
                const roleText = r.role_detail ? r.role_detail : r.person_type;
                html += `<li style="padding:4px 0;">- <strong style="color:#fff;">${r.person_name}</strong> <span style="font-size:0.8rem;">(${roleText})</span></li>`;
            });
        } else {
            html += `<li>No cast/crew assigned yet.</li>`;
        }
        html += `</ul>`;

        html += `
            <h4 style="color:var(--accent); margin-bottom: 10px; border-bottom: 1px dashed var(--border-color); padding-bottom:5px; font-family:monospace;">> FINANCIALS</h4>
            <div style="color:var(--text-secondary);">
        `;
        if (finance) {
            const f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
            html += `
                <p style="margin-bottom:8px;"><strong>Total Spend:</strong> <span style="color:var(--danger); font-size:1.1rem; font-weight:bold;">${f.format(finance.total_spend || 0)}</span></p>
                <p style="font-size:0.8rem; margin-top:5px;">(Includes all production, marketing, and negotiated cast/director payouts)</p>
            `;
        } else {
            html += `<p>No financial records available.</p>`;
        }

        html += `</div>`;

        if (status === 'draft') {
            html += `<button class="btn btn-glow" style="margin-top:20px; width:100%; border-color: #ffaa00; color: #ffaa00;" onclick="showPublishMovieForm(${id}, '${title.replace(/'/g, "\\'")}')">PUBLISH PROJECT</button>`;
        }

        html += `<button class="btn btn-glow" style="margin-top:10px; width:100%;" onclick="showEditFinanceForm(${id}, '${title.replace(/'/g, "\\'")}', '${status}')">EDIT FINANCES</button>`;

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
                    <strong style="color:#fff;">${m.title}</strong>
                    <span style="color:var(--accent); margin-left:6px;">(${m.release_year || 'N/A'})</span>
                    ${roleText}${salaryText}
                </li>`;
            });
        } else {
            html += `<li style="color:var(--text-secondary);">No movie assignments found.</li>`;
        }

        html += `</ul>`;

        html += `<button class="btn btn-glow" style="margin-top:20px; width:100%;" onclick="showAssignMovieForm('actor', ${id}, '${name.replace(/'/g, "\\'")}')">ASSIGN MOVIE</button>`;

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
                    <strong style="color:#fff;">${m.title}</strong>
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
                    ${roi.total_budget != null ? `<p><strong>Total Budget:</strong> <span style="color:#fff;">${fmt.format(roi.total_budget)}</span></p>` : ''}
                    ${roi.total_spend != null ? `<p><strong>Total Spend:</strong> <span style="color:var(--danger);">${fmt.format(roi.total_spend)}</span></p>` : ''}
                    ${roi.total_revenue != null ? `<p><strong>Total Revenue:</strong> <span style="color:var(--accent);">${fmt.format(roi.total_revenue)}</span></p>` : ''}
                    ${roi.roi_pct != null ? `<p><strong>ROI:</strong> <span style="color:${roiColor}; font-size:1rem; font-weight:bold;">${roi.roi_pct}%</span></p>` : ''}
                </div>`;
        }

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
                    <strong style="color:#fff;">${m.title}</strong>
                    <span style="color:var(--accent); margin-left:6px;">(${m.release_year || 'N/A'})</span>
                    ${m.genre ? `<span style="margin-left:8px; color:#64748b; font-size:0.8rem;">[${m.genre}]</span>` : ''}
                </li>`;
            });
        } else {
            html += `<li style="color:var(--text-secondary);">No produced films found.</li>`;
        }

        html += `</ul>`;
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
                    <strong style="color:#fff;">${m.title}</strong>
                    <span style="color:var(--accent); margin-left:6px;">(${m.release_year || 'N/A'})</span>
                    ${roleText}${salaryText}
                </li>`;
            });
        } else {
            html += `<li style="color:var(--text-secondary);">No movie assignments found.</li>`;
        }
        html += `</ul>`;

        html += `<button class="btn btn-glow" style="margin-top:20px; width:100%;" onclick="showAssignMovieForm('crew', ${id}, '${name.replace(/'/g, "\\'")}')">ASSIGN MOVIE</button>`;

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
                    <input type="number" id="fin-box-office" placeholder="0">
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
        boxOfficeRevenue: document.getElementById('fin-box-office').value || null
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
                <h4 style="color:#ffaa00; margin-bottom: 15px; border-bottom: 1px dashed var(--border-color); padding-bottom:5px; font-family:monospace;">> PUBLISH: ${movieTitle}</h4>
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
                    <button class="btn btn-glow" style="border-color: #ffaa00; color: #ffaa00;" id="pub-submit-btn" onclick="submitPublishMovie(${movieId}, '${movieTitle.replace(/'/g, "\\'")}')">EXECUTE_PUBLISH()</button>
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
