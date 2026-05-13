import { uniqueName, assert, test } from './helpers.js';
import { addMovie, removeMovie, getMovieById, getMovieFullRoster, getMovieTotalSpend, publishMovie } from '../controllers/movieController.js';
import { addActor, removeActor, addMovieActor, removeMovieActor } from '../controllers/actorController.js';
import { addProducer, removeProducer, addMovieProducer } from '../controllers/producerController.js';
import { upsertMovieFinance } from '../controllers/financeController.js';

export async function run() {
    console.log('\n── Movie Controller ──');

    let movieId;

    await test('addMovie returns the inserted row as draft', async () => {
        const name = uniqueName('movie');
        const row = await addMovie(name);
        assert(typeof row.id === 'number', 'id is a number');
        assert(row.title === name, 'title matches');
        assert(row.status === 'draft', 'status is draft');
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

    let producerId;
    await test('publishMovie requires finance', async () => {
        try {
            await publishMovie(movieId, 'Final Title', 'Action', 'War', 2024);
            assert(false, 'should have thrown exception for missing finance');
        } catch (err) {
            assert(err.message.includes('Cannot publish movie'), 'exception thrown');
        }

        // Add producer and finance to satisfy requirements
        const producerRow = await addProducer(uniqueName('Producer'), 1980, 'Male');
        producerId = producerRow.id;
        await addMovieProducer(movieId, producerId, 50000000);
        await upsertMovieFinance(movieId, 10000000, 5000000, 0);

        const published = await publishMovie(movieId, 'Final Title', 'Action', 'War', 2024);
        assert(published.status === 'published', 'status changed to published');
        assert(published.title === 'Final Title', 'title updated');
        assert(published.genre === 'Action', 'genre updated');
    });

    await test('removeMovie deletes the movie', async () => {
        await removeMovie(movieId);
        const row = await getMovieById(movieId);
        assert(row === null, 'movie no longer exists');
        if (producerId) await removeProducer(producerId);
    });
}
