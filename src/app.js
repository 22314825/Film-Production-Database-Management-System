import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

import { addMovie, removeMovie, getAllMovies, getMovieFullRoster, getMovieTotalSpend, publishMovie } from './controllers/movieController.js';
import { addActor, removeActor, getAllActors, getMoviesByActorId, addMovieActor, removeMovieActor, updateActor, updateMovieActor, getActorById } from './controllers/actorController.js';
import { addDirector, removeDirector, getAllDirectors, getMoviesByDirectorId, addMovieDirector, removeMovieDirector, updateDirector, getDirectorById } from './controllers/directorController.js';
import { addProducer, removeProducer, getAllProducers, getMoviesByProducerId, addMovieProducer, removeMovieProducer, updateMovieProducerInvestment, updateProducer, getMovieProducers, getProducerById } from './controllers/producerController.js';
import { addCrewMember, removeCrewMember, getAllCrewMembers, addMovieCrewMember, removeMovieCrewMember, getMoviesByCrewMemberId, updateCrewMember, updateMovieCrewMember, getCrewMemberById } from './controllers/crewMemberController.js';
import { getMovieFinancialOverview, getTopPaidActors, getProfitableMovies, getGenrePerformance, getDirectorRoi } from './controllers/queryController.js';
import { upsertMovieFinance, getMovieFinance } from './controllers/financeController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#0a0a0a',
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
    const safeCall = async (fn, ...args) => {
        try { return await fn(...args); } catch (e) { console.error(e); return null; }
    };

    // Movies
    ipcMain.handle('get-all-movies', () => safeCall(getAllMovies));
    ipcMain.handle('get-movie-full-roster', (_, id) => safeCall(getMovieFullRoster, id));
    ipcMain.handle('get-movie-total-spend', (_, id) => safeCall(getMovieTotalSpend, id));

    // People
    ipcMain.handle('get-all-actors', () => safeCall(getAllActors));
    ipcMain.handle('get-all-directors', () => safeCall(getAllDirectors));
    ipcMain.handle('get-all-producers', () => safeCall(getAllProducers));
    ipcMain.handle('get-all-crew', () => safeCall(getAllCrewMembers));
    ipcMain.handle('get-movies-by-actor-id', (_, id) => safeCall(getMoviesByActorId, id));
    ipcMain.handle('get-movies-by-director-id', (_, id) => safeCall(getMoviesByDirectorId, id));
    ipcMain.handle('get-movies-by-producer-id', (_, id) => safeCall(getMoviesByProducerId, id));
    ipcMain.handle('get-movies-by-crew-member-id', (_, id) => safeCall(getMoviesByCrewMemberId, id));
    ipcMain.handle('get-director-roi', (_, id) => safeCall(getDirectorRoi, id));

    // Finance & Queries
    ipcMain.handle('get-financial-overview', () => safeCall(getMovieFinancialOverview));
    ipcMain.handle('get-top-paid-actors', () => safeCall(getTopPaidActors));
    ipcMain.handle('get-profitable-movies', () => safeCall(getProfitableMovies));
    ipcMain.handle('get-genre-performance', () => safeCall(getGenrePerformance));

    // Advanced Workflows
    ipcMain.handle('update-movie-finance', async (_, data) => {
        try {
            // data = { movieId, producerId, producerName, investment, productionCost, marketingCost, boxOfficeRevenue }
            let finalProducerId = data.producerId;
            // Create producer if 'new' is selected
            if (data.producerId === 'new' && data.producerName) {
                const newProducer = await addProducer(data.producerName);
                if (newProducer && newProducer.id) {
                    finalProducerId = newProducer.id;
                } else {
                    throw new Error("Failed to create new producer.");
                }
            }

            if (finalProducerId && data.investment != null) {
                try {
                    await addMovieProducer(data.movieId, finalProducerId, data.investment);
                } catch (e) {
                    await updateMovieProducerInvestment(data.movieId, finalProducerId, data.investment);
                }
            }

            // Preserve existing revenue when not provided (e.g. draft movies)
            let boxOfficeRevenue = data.boxOfficeRevenue;
            if (boxOfficeRevenue === undefined) {
                const existing = await getMovieFinance(data.movieId);
                boxOfficeRevenue = existing?.box_office_revenue ?? null;
            }

            await upsertMovieFinance(data.movieId, data.productionCost, data.marketingCost, boxOfficeRevenue);
            
            return { success: true };
        } catch(err) {
            console.error('Update Finance Error:', err);
            return { success: false, error: err.message };
        }
    });

    // --- Get by ID ---
    ipcMain.handle('get-actor-by-id', (_, id) => safeCall(getActorById, id));
    ipcMain.handle('get-director-by-id', (_, id) => safeCall(getDirectorById, id));
    ipcMain.handle('get-producer-by-id', (_, id) => safeCall(getProducerById, id));
    ipcMain.handle('get-crew-member-by-id', (_, id) => safeCall(getCrewMemberById, id));
    ipcMain.handle('get-movie-finance', (_, id) => safeCall(getMovieFinance, id));
    ipcMain.handle('get-movie-producers', (_, id) => safeCall(getMovieProducers, id));

    // --- Assign director ---
    ipcMain.handle('assign-movie-director', async (_, data) => {
        try {
            await addMovieDirector(data.movieId, data.directorId);
            return { success: true };
        } catch(err) {
            console.error('Assign Director Error:', err);
            return { success: false, error: err.message };
        }
    });

    // --- Unassign ---
    ipcMain.handle('unassign-movie-actor', async (_, data) => {
        try {
            await removeMovieActor(data.movieId, data.actorId);
            return { success: true };
        } catch(err) {
            console.error('Unassign Actor Error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('unassign-movie-director', async (_, data) => {
        try {
            await removeMovieDirector(data.movieId, data.directorId);
            return { success: true };
        } catch(err) {
            console.error('Unassign Director Error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('unassign-movie-crew', async (_, data) => {
        try {
            await removeMovieCrewMember(data.movieId, data.crewId);
            return { success: true };
        } catch(err) {
            console.error('Unassign Crew Error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('unassign-movie-producer', async (_, data) => {
        try {
            await removeMovieProducer(data.movieId, data.producerId);
            return { success: true };
        } catch(err) {
            console.error('Unassign Producer Error:', err);
            return { success: false, error: err.message };
        }
    });

    // --- Re-assign (update role/salary) ---
    ipcMain.handle('update-movie-actor', async (_, data) => {
        try {
            await updateMovieActor(data.movieId, data.actorId, data.role, data.salary);
            return { success: true };
        } catch(err) {
            console.error('Update Movie Actor Error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('update-movie-crew', async (_, data) => {
        try {
            await updateMovieCrewMember(data.movieId, data.crewId, data.jobTitle, data.salary);
            return { success: true };
        } catch(err) {
            console.error('Update Movie Crew Error:', err);
            return { success: false, error: err.message };
        }
    });

    // --- Update person info ---
    ipcMain.handle('update-actor', async (_, data) => {
        try {
            await updateActor(data.id, data.name, data.birthYear, data.gender);
            return { success: true };
        } catch(err) {
            console.error('Update Actor Error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('update-director', async (_, data) => {
        try {
            await updateDirector(data.id, data.name, data.birthYear);
            return { success: true };
        } catch(err) {
            console.error('Update Director Error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('update-producer', async (_, data) => {
        try {
            await updateProducer(data.id, data.name, data.birthYear, data.gender);
            return { success: true };
        } catch(err) {
            console.error('Update Producer Error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('update-crew-member', async (_, data) => {
        try {
            await updateCrewMember(data.id, data.name, data.birthYear, data.gender);
            return { success: true };
        } catch(err) {
            console.error('Update Crew Member Error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('assign-movie-actor', async (_, data) => {
        try {
            await addMovieActor(data.movieId, data.actorId, data.role, data.salary);
            return { success: true };
        } catch(err) {
            console.error('Assign Actor Error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('assign-movie-crew', async (_, data) => {
        try {
            await addMovieCrewMember(data.movieId, data.crewId, data.jobTitle, data.salary);
            return { success: true };
        } catch(err) {
            console.error('Assign Crew Error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('publish-movie', async (_, data) => {
        try {
            const res = await publishMovie(data.id, data.title, data.genre, data.topic, data.release_year);
            return { success: true, data: res };
        } catch(err) {
            console.error('Publish Movie Error:', err);
            return { success: false, error: err.message };
        }
    });

    // Admin credentials
    ipcMain.handle('get-admin-credentials', () => ({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD
    }));

    // Mutations (Add / Delete)
    ipcMain.handle('delete-entity', async (_, type, id) => {
        try {
            if (type === 'movies') await removeMovie(id);
            else if (type === 'actors') await removeActor(id);
            else if (type === 'directors') await removeDirector(id);
            else if (type === 'producers') await removeProducer(id);
            else if (type === 'crew') await removeCrewMember(id);
            else throw new Error("Unknown entity type");
            return { success: true };
        } catch(err) {
            console.error('Delete Error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('add-entity', async (_, type, data) => {
        try {
            let result;
            if (type === 'movies') result = await addMovie(data.title, data.genre, data.topic, data.release_year);
            else if (type === 'actors') result = await addActor(data.name, data.birth_year, data.gender);
            else if (type === 'directors') result = await addDirector(data.name, data.birth_year);
            else if (type === 'producers') result = await addProducer(data.name, data.birth_year, data.gender);
            else if (type === 'crew') result = await addCrewMember(data.name, data.birth_year, data.gender);
            else throw new Error("Unknown entity type");
            return { success: true, data: result };
        } catch(err) {
            console.error('Add Error:', err);
            return { success: false, error: err.message };
        }
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
