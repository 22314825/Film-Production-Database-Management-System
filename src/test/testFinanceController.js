import { uniqueName, assert, test } from './helpers.js';
import { addMovieFinance, removeMovieFinance, getMovieFinance, addDirectorFinance, removeDirectorFinance, getDirectorFinance, addProducerFinance, removeProducerFinance, getProducerFinance } from '../controllers/financeController.js';
import { addMovie, removeMovie } from '../controllers/movieController.js';
import { addDirector, removeDirector } from '../controllers/directorController.js';
import { addProducer, removeProducer } from '../controllers/producerController.js';

export async function run() {
    console.log('\n── Finance Controller ──');

    let movieId, directorId, producerId;

    // Setup shared entities
    const movie = await addMovie(uniqueName('movie'), 'Drama');
    movieId = movie.id;
    const director = await addDirector(uniqueName('director'));
    directorId = director.id;
    const producer = await addProducer(uniqueName('producer'));
    producerId = producer.id;

    // ── MovieFinance ─────────────────────────────────────────────────────────

    await test('addMovieFinance returns the inserted row', async () => {
        const row = await addMovieFinance(movieId, 5000000, 4000000, 500000, 10000000);
        assert(row.movie_id === movieId, 'movie_id matches');
        assert(Number(row.budget) === 5000000, 'budget matches');
        // net_profit is auto-computed: 10M - 4M - 500k = 5.5M
        assert(Number(row.net_profit) === 5500000, 'net_profit is computed correctly');
    });

    await test('getMovieFinance returns existing finance row', async () => {
        const row = await getMovieFinance(movieId);
        assert(row !== null, 'row is not null');
        assert(row.movie_id === movieId, 'movie_id matches');
    });

    // ── DirectorFinance ──────────────────────────────────────────────────────

    await test('addDirectorFinance returns the inserted row', async () => {
        const row = await addDirectorFinance(directorId, movieId, 200000, 5.0, 'net', 'hybrid', 50000, 300000);
        assert(row.director_id === directorId, 'director_id matches');
        assert(row.movie_id === movieId, 'movie_id matches');
    });

    await test('getDirectorFinance returns existing finance row', async () => {
        const row = await getDirectorFinance(directorId, movieId);
        assert(row !== null, 'row is not null');
        assert(Number(row.base_fee) === 200000, 'base_fee matches');
    });

    await test('removeDirectorFinance removes the row', async () => {
        await removeDirectorFinance(directorId, movieId);
        const row = await getDirectorFinance(directorId, movieId);
        assert(row === null, 'director finance no longer exists');
    });

    // ── ProducerFinance ──────────────────────────────────────────────────────

    await test('addProducerFinance returns the inserted row', async () => {
        const row = await addProducerFinance(producerId, movieId, 150000, 3.0, 'gross', 'flat', 10.0, 5500000, 20000, 200000);
        assert(row.producer_id === producerId, 'producer_id matches');
        assert(row.movie_id === movieId, 'movie_id matches');
        // executive_profit_share = 5500000 * 10 / 100 = 550000
        assert(Number(row.executive_profit_share) === 550000, 'profit share computed correctly');
    });

    await test('getProducerFinance returns existing finance row', async () => {
        const row = await getProducerFinance(producerId, movieId);
        assert(row !== null, 'row is not null');
    });

    await test('removeProducerFinance removes the row', async () => {
        await removeProducerFinance(producerId, movieId);
        const row = await getProducerFinance(producerId, movieId);
        assert(row === null, 'producer finance no longer exists');
    });

    await test('removeMovieFinance removes the row', async () => {
        await removeMovieFinance(movieId);
        const row = await getMovieFinance(movieId);
        assert(row === null, 'movie finance no longer exists');
    });

    // Cleanup
    await removeDirector(directorId).catch(() => {});
    await removeProducer(producerId).catch(() => {});
    await removeMovie(movieId).catch(() => {});
}
