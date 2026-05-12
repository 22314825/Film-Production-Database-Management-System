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

async function loadView(view) {
    const title = document.getElementById('view-title');
    const dynamicView = document.getElementById('dynamic-view');
    
    dynamicView.innerHTML = '<p style="color: var(--accent); font-family: monospace;" class="blink">> FETCHING DATA...</p>';

    try {
        if (view === 'movies') {
            title.innerText = 'MOVIES_DIRECTORY';
            const data = await window.api.getAllMovies();
            dynamicView.innerHTML = buildGenericTable(data, 'ALL_MOVIES', 'movies');
        } 
        else if (view === 'actors') {
            title.innerText = 'ACTORS_DIRECTORY';
            const data = await window.api.getAllActors();
            dynamicView.innerHTML = buildGenericTable(data, 'REGISTERED_ACTORS', 'actors');
        }
        else if (view === 'directors') {
            title.innerText = 'DIRECTORS_DIRECTORY';
            const data = await window.api.getAllDirectors();
            dynamicView.innerHTML = buildGenericTable(data, 'REGISTERED_DIRECTORS', 'directors');
        }
        else if (view === 'producers') {
            title.innerText = 'PRODUCERS_DIRECTORY';
            const data = await window.api.getAllProducers();
            dynamicView.innerHTML = buildGenericTable(data, 'REGISTERED_PRODUCERS', 'producers');
        }
        else if (view === 'crew') {
            title.innerText = 'CREW_DIRECTORY';
            const data = await window.api.getAllCrew();
            dynamicView.innerHTML = buildGenericTable(data, 'REGISTERED_CREW', 'crew');
        }
        else if (view === 'finance') {
            title.innerText = 'FINANCIAL_OVERVIEW';
            const data = await window.api.getFinancialOverview();
            dynamicView.innerHTML = buildGenericTable(data, 'MOVIE_FINANCIAL_PERFORMANCE');
        }
        else if (view === 'queries') {
            title.innerText = 'SYSTEM_ANALYTICS';
            const [topActors, genrePerf, profitableMovies] = await Promise.all([
                window.api.getTopPaidActors(),
                window.api.getGenrePerformance(),
                window.api.getProfitableMovies()
            ]);
            
            dynamicView.innerHTML = `
                ${buildGenericTable(topActors, 'TOP_PAID_ACTORS')}
                ${buildGenericTable(genrePerf, 'GENRE_PERFORMANCE')}
                ${buildGenericTable(profitableMovies, 'MOST_PROFITABLE_MOVIES')}
            `;
        }
    } catch (err) {
        dynamicView.innerHTML = `<div style="background: rgba(255, 0, 85, 0.1); border: 1px solid var(--danger); color: var(--danger); padding: 20px; font-family: monospace;">
            <h4>> ERR_FETCH_DATA</h4>
            <p>${err.message}</p>
        </div>`;
    }
}
