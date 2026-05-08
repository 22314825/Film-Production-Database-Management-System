import { uniqueName, assert, test } from './helpers.js';
import { getProfitableMovies, getMovieFullCast, getDirectorFilmography, getTopPaidActors, getGenrePerformance, getCrewRoster, getMovieFinancialOverview, getMostProfitableGenre, getMoviesByActor, flagOverBudgetMovies } from '../controllers/queryController.js';
import { addMovie, removeMovie } from '../controllers/movieController.js';
import { addActor, removeActor, addMovieActor, removeMovieActor } from '../controllers/actorController.js';
import { addMovieFinance, removeMovieFinance } from '../controllers/financeController.js';

export async function run() {
    console.log('\n── Query Controller (Views & PL/pgSQL) ──');

    // Create test data so views return meaningful rows
    const movie = await addMovie(uniqueName('movie'), 'Action', 'Heist', 2023);
    const actor = await addActor(uniqueName('actor'), 1988, 'Female');
    await addMovieActor(movie.id, actor.id, 'Lead', 120000);
    await addMovieFinance(movie.id, 2000000, 1500000, 200000, 4000000);

    await test('getProfitableMovies returns an array', async () => {
        const rows = await getProfitableMovies();
        assert(Array.isArray(rows), 'result is an array');
    });

    await test('getProfitableMovies contains our test movie', async () => {
        const rows = await getProfitableMovies();
        const found = rows.find(r => r.movie_id === movie.id);
        assert(found !== undefined, 'test movie appears in profitable movies');
        assert(Number(found.net_profit) === 2300000, 'net_profit is correct (4M - 1.5M - 0.2M)');
    });

    await test('getMovieFinancialOverview returns our movie', async () => {
        const rows = await getMovieFinancialOverview(movie.id);
        assert(Array.isArray(rows) && rows.length > 0, 'overview row returned');
        assert(rows[0].movie_id === movie.id, 'movie_id matches');
    });

    await test('getMovieFullCast contains our actor', async () => {
        const rows = await getMovieFullCast(movie.id);
        assert(Array.isArray(rows), 'result is an array');
        const entry = rows.find(r => r.actor_id === actor.id);
        assert(entry !== undefined, 'actor appears in cast');
        assert(entry.role === 'Lead', 'role matches');
    });

    await test('getTopPaidActors returns an array', async () => {
        const rows = await getTopPaidActors(5);
        assert(Array.isArray(rows), 'result is an array');
    });

    await test('getGenrePerformance returns an array', async () => {
        const rows = await getGenrePerformance();
        assert(Array.isArray(rows), 'result is an array');
        const action = rows.find(r => r.genre === 'Action');
        assert(action !== undefined, 'Action genre appears in performance stats');
    });

    await test('getDirectorFilmography returns an array', async () => {
        const rows = await getDirectorFilmography();
        assert(Array.isArray(rows), 'result is an array');
    });

    await test('getCrewRoster returns an array', async () => {
        const rows = await getCrewRoster();
        assert(Array.isArray(rows), 'result is an array');
    });

    await test('getMostProfitableGenre returns a row or null', async () => {
        const row = await getMostProfitableGenre();
        // Just verify the shape when data exists
        if (row !== null) {
            assert(typeof row.genre === 'string', 'genre is a string');
        }
    });

    await test('getMoviesByActor finds our actor', async () => {
        const actorRow = await (await import('../controllers/actorController.js')).getActorById(actor.id);
        const movies = await getMoviesByActor(actorRow.name);
        assert(Array.isArray(movies), 'result is an array');
        assert(movies.some(r => r.movie_id === movie.id), 'our movie is returned');
    });

    await test('flagOverBudgetMovies returns an array', async () => {
        const rows = await flagOverBudgetMovies();
        assert(Array.isArray(rows), 'result is an array');
    });

    // Cleanup
    await removeMovieActor(movie.id, actor.id).catch(() => {});
    await removeMovieFinance(movie.id).catch(() => {});
    await removeActor(actor.id).catch(() => {});
    await removeMovie(movie.id).catch(() => {});
}
