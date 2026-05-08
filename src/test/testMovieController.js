import { uniqueName, assert, test } from './helpers.js';
import { addMovie, removeMovie, getMovieById, getMovieFullRoster, getMovieTotalSpend } from '../controllers/movieController.js';
import { addActor, removeActor, addMovieActor, removeMovieActor } from '../controllers/actorController.js';

export async function run() {
    console.log('\n── Movie Controller ──');

    let movieId;

    await test('addMovie returns the inserted row', async () => {
        const name = uniqueName('movie');
        const row = await addMovie(name, 'Action', 'War', 2024);
        assert(typeof row.id === 'number', 'id is a number');
        assert(row.title === name, 'title matches');
        assert(row.genre === 'Action', 'genre matches');
        movieId = row.id;
    });

    await test('getMovieById returns the correct movie', async () => {
        const row = await getMovieById(movieId);
        assert(row !== null, 'row is not null');
        assert(row.id === movieId, 'id matches');
    });

    await test('getMovieFullRoster returns an array', async () => {
        const rows = await getMovieFullRoster(movieId);
        assert(Array.isArray(rows), 'result is an array');
    });

    await test('getMovieTotalSpend returns spend breakdown', async () => {
        // No finance data yet — expect zeros or null
        const row = await getMovieTotalSpend(movieId);
        assert(row !== null, 'spend row is not null');
        assert(row.movie_id === movieId, 'movie_id matches');
    });

    await test('removeMovie deletes the movie', async () => {
        await removeMovie(movieId);
        const row = await getMovieById(movieId);
        assert(row === null, 'movie no longer exists');
    });

    await test('addMovie with minimal params (only title)', async () => {
        const name = uniqueName('minimal');
        const row = await addMovie(name);
        assert(row.genre === null, 'genre is null');
        await removeMovie(row.id);
    });
}
