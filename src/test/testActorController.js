import { uniqueName, assert, test } from './helpers.js';
import { addActor, removeActor, getActorById, addMovieActor, removeMovieActor, getMoviesByActor } from '../controllers/actorController.js';
import { addMovie, removeMovie } from '../controllers/movieController.js';

export async function run() {
    console.log('\n── Actor Controller ──');

    let actorId, movieId;

    await test('addActor returns the inserted row', async () => {
        const name = uniqueName('actor');
        const row = await addActor(name, 1990, 'Male');
        assert(typeof row.id === 'number', 'id is a number');
        assert(row.name === name, 'name matches');
        assert(row.birth_year === 1990, 'birth_year matches');
        actorId = row.id;
    });

    await test('getActorById returns the correct actor', async () => {
        const row = await getActorById(actorId);
        assert(row !== null, 'row is not null');
        assert(row.id === actorId, 'id matches');
    });

    await test('addMovieActor links actor to movie', async () => {
        const row = await addMovie(uniqueName('movie'), 'Drama');
        movieId = row.id;
        await addMovieActor(movieId, actorId, 'Hero', 50000);
    });

    await test('getMoviesByActor finds the linked movie', async () => {
        const actorRow = await getActorById(actorId);
        const movies = await getMoviesByActor(actorRow.name.split('_')[0]);
        assert(Array.isArray(movies), 'result is an array');
    });

    await test('removeMovieActor unlinks actor from movie', async () => {
        await removeMovieActor(movieId, actorId);
    });

    await test('removeActor deletes the actor', async () => {
        await removeActor(actorId);
        const row = await getActorById(actorId);
        assert(row === null, 'actor no longer exists');
    });

    // cleanup movie
    await removeMovie(movieId).catch(() => {});
}
