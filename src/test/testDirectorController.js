import { uniqueName, assert, test } from './helpers.js';
import { addDirector, removeDirector, getDirectorById, addMovieDirector, removeMovieDirector, getDirectorRoi } from '../controllers/directorController.js';
import { addMovie, removeMovie } from '../controllers/movieController.js';
import { addMovieFinance, removeMovieFinance } from '../controllers/financeController.js';

export async function run() {
    console.log('\n── Director Controller ──');

    let directorId, movieId;

    await test('addDirector returns the inserted row', async () => {
        const name = uniqueName('director');
        const row = await addDirector(name, 1970);
        assert(typeof row.id === 'number', 'id is a number');
        assert(row.name === name, 'name matches');
        assert(row.birth_year === 1970, 'birth_year matches');
        directorId = row.id;
    });

    await test('getDirectorById returns the correct director', async () => {
        const row = await getDirectorById(directorId);
        assert(row !== null, 'row is not null');
        assert(row.id === directorId, 'id matches');
    });

    await test('addMovieDirector links director to movie', async () => {
        const movie = await addMovie(uniqueName('movie'), 'Thriller');
        movieId = movie.id;
        await addMovieDirector(movieId, directorId);
    });

    await test('getDirectorRoi returns ROI data after finance is added', async () => {
        await addMovieFinance(movieId, 1000000, 800000, 100000, 2000000);
        const roi = await getDirectorRoi(directorId);
        assert(roi !== null, 'roi row is not null');
        assert(roi.director_id === directorId, 'director_id matches');
        assert(typeof roi.avg_roi_pct === 'string' || typeof roi.avg_roi_pct === 'number', 'avg_roi_pct present');
        await removeMovieFinance(movieId);
    });

    await test('removeMovieDirector unlinks director from movie', async () => {
        await removeMovieDirector(movieId, directorId);
    });

    await test('removeDirector deletes the director', async () => {
        await removeDirector(directorId);
        const row = await getDirectorById(directorId);
        assert(row === null, 'director no longer exists');
    });

    await removeMovie(movieId).catch(() => {});
}
