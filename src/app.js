import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

import { addMovie, removeMovie, getAllMovies, getMovieFullRoster, getMovieTotalSpend } from './controllers/movieController.js';
import { addActor, removeActor, getAllActors } from './controllers/actorController.js';
import { addDirector, removeDirector, getAllDirectors } from './controllers/directorController.js';
import { addProducer, removeProducer, getAllProducers } from './controllers/producerController.js';
import { addCrewMember, removeCrewMember, getAllCrewMembers } from './controllers/crewMemberController.js';
import { getMovieFinancialOverview, getTopPaidActors, getProfitableMovies, getGenrePerformance } from './controllers/queryController.js';

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

    // Finance & Queries
    ipcMain.handle('get-financial-overview', () => safeCall(getMovieFinancialOverview));
    ipcMain.handle('get-top-paid-actors', () => safeCall(getTopPaidActors));
    ipcMain.handle('get-profitable-movies', () => safeCall(getProfitableMovies));
    ipcMain.handle('get-genre-performance', () => safeCall(getGenrePerformance));

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
