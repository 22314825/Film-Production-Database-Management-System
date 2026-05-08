import { uniqueName, assert, test } from './helpers.js';
import { addProducer, removeProducer, getProducerById, addMovieProducer, removeMovieProducer } from '../controllers/producerController.js';
import { addMovie, removeMovie } from '../controllers/movieController.js';

export async function run() {
    console.log('\n── Producer Controller ──');

    let producerId, movieId;

    await test('addProducer returns the inserted row', async () => {
        const name = uniqueName('producer');
        const row = await addProducer(name, 1965, 'Female');
        assert(typeof row.id === 'number', 'id is a number');
        assert(row.name === name, 'name matches');
        assert(row.gender === 'Female', 'gender matches');
        producerId = row.id;
    });

    await test('getProducerById returns the correct producer', async () => {
        const row = await getProducerById(producerId);
        assert(row !== null, 'row is not null');
        assert(row.id === producerId, 'id matches');
    });

    await test('addMovieProducer links producer to movie', async () => {
        const movie = await addMovie(uniqueName('movie'), 'Comedy');
        movieId = movie.id;
        await addMovieProducer(movieId, producerId);
    });

    await test('removeMovieProducer unlinks producer from movie', async () => {
        await removeMovieProducer(movieId, producerId);
    });

    await test('removeProducer deletes the producer', async () => {
        await removeProducer(producerId);
        const row = await getProducerById(producerId);
        assert(row === null, 'producer no longer exists');
    });

    await removeMovie(movieId).catch(() => {});
}
