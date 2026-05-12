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

    // Load initial view
    loadView('movies');
});

// Entity schemas for Add Modal
const schemas = {
    movies: [
        { name: 'title', label: 'Title', type: 'text' },
        { name: 'genre', label: 'Genre', type: 'text' },
        { name: 'topic', label: 'Topic', type: 'text' },
        { name: 'release_year', label: 'Release Year', type: 'year-select' }
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

window.deleteRecord = async function(type, id) {
    if (confirm(`Are you sure you want to delete this record (ID: ${id})?`)) {
        const res = await window.api.deleteEntity(type, id);
        if (res.success) {
            loadView(currentView);
        } else {
            alert(`Delete failed: ${res.error}\n\nThis is likely because of foreign key constraints (e.g., this person is linked to a movie).`);
        }
    }
};

window.openAddModal = function(type) {
    currentAddType = type;
    const schema = schemas[type];
    if (!schema) return;

    document.getElementById('modal-title').innerText = `>> SYS.INSERT_${type.toUpperCase()}`;
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

    if (currentAddType === 'movies' && (!data.title || !data.title.trim())) {
        alert("Validation Error: Movie Title is required.");
        return;
    } else if (currentAddType !== 'movies' && (!data.name || !data.name.trim())) {
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
        
    data.forEach(item => {
        html += `
        <div class="card" onclick="openMovieDetail(${item.id}, '${item.title.replace(/'/g, "\\'")}')">
            <div class="card-badge">${item.release_year || 'N/A'}</div>
            <div class="card-title">${item.title}</div>
            <div class="card-body">
                <p><strong>Genre:</strong> <span style="color:#fff;">${item.genre || 'N/A'}</span></p>
                <p style="margin-top:8px;"><strong>Topic:</strong> <span style="color:#fff;">${item.topic || 'N/A'}</span></p>
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

window.openMovieDetail = async function(id, title) {
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

        body.innerHTML = html;
    } catch (err) {
        body.innerHTML = `<p style="color:var(--danger);">Error: ${err.message}</p>`;
    }
};

document.getElementById('detail-close').addEventListener('click', () => {
    document.getElementById('detail-modal').classList.add('hidden');
});

window.openActorDetail = async function(id, name) {
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
        body.innerHTML = html;
    } catch (err) {
        body.innerHTML = `<p style="color:var(--danger);">Error: ${err.message}</p>`;
    }
};

window.openDirectorDetail = async function(id, name) {
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

window.openProducerDetail = async function(id, name) {
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

async function loadView(view) {
    const title = document.getElementById('view-title');
    const dynamicView = document.getElementById('dynamic-view');
    
    dynamicView.innerHTML = '<p style="color: var(--accent); font-family: monospace;" class="blink">> FETCHING DATA...</p>';

    try {
        if (view === 'movies') {
            title.innerText = 'MOVIES_DIRECTORY';
            const data = await window.api.getAllMovies();
            dynamicView.innerHTML = buildCardGrid(data, 'ALL_MOVIES', 'movies');
        } 
        else if (view === 'actors') {
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
            dynamicView.innerHTML = buildGenericTable(data, 'REGISTERED_CREW', 'crew');
        }
    } catch (err) {
        dynamicView.innerHTML = `<div style="background: rgba(255, 0, 85, 0.1); border: 1px solid var(--danger); color: var(--danger); padding: 20px; font-family: monospace;">
            <h4>> ERR_FETCH_DATA</h4>
            <p>${err.message}</p>
        </div>`;
    }
}
