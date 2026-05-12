import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

import { addMovie, removeMovie, getAllMovies, getMovieFullRoster, getMovieTotalSpend } from './controllers/movieController.js';
import { addActor, removeActor, getAllActors, getMoviesByActorId, addMovieActor } from './controllers/actorController.js';
import { addDirector, removeDirector, getAllDirectors, getMoviesByDirectorId } from './controllers/directorController.js';
import { addProducer, removeProducer, getAllProducers, getMoviesByProducerId, addMovieProducer } from './controllers/producerController.js';
import { addCrewMember, removeCrewMember, getAllCrewMembers, addMovieCrewMember, getMoviesByCrewMemberId } from './controllers/crewMemberController.js';
import { getMovieFinancialOverview, getTopPaidActors, getProfitableMovies, getGenrePerformance, getDirectorRoi } from './controllers/queryController.js';
import { upsertMovieFinance } from './controllers/financeController.js';

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
            // data = { movieId, producerId, producerName, budget, productionCost, marketingCost, boxOfficeRevenue }
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

            // Upsert MovieFinance
            await upsertMovieFinance(data.movieId, data.budget, data.productionCost, data.marketingCost, data.boxOfficeRevenue);
            
            if (finalProducerId) {
                // Delete existing producer links to replace them, since only one main producer might be intended,
                // but let's just insert it and handle potential uniqueness. 
                // Wait, if we use addMovieProducer, it will just insert. There might be multiple producers, which is fine.
                await addMovieProducer(data.movieId, finalProducerId);
            }
            return { success: true };
        } catch(err) {
            console.error('Update Finance Error:', err);
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
