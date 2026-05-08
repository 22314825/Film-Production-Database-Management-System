import sql from '../services/neonClient.js';

export async function addProducer(name, birthYear = null, gender = null) {
    const rows = await sql`SELECT * FROM add_producer(${name}, ${birthYear}, ${gender})`;
    return rows[0];
}

export async function removeProducer(id) {
    await sql`SELECT remove_producer(${id})`;
}

export async function getAllProducers() {
    return sql`SELECT * FROM Producer ORDER BY id`;
}

export async function getProducerById(id) {
    const rows = await sql`SELECT * FROM Producer WHERE id = ${id}`;
    return rows[0] ?? null;
}

export async function addMovieProducer(movieId, producerId) {
    await sql`SELECT add_movie_producer(${movieId}, ${producerId})`;
}

export async function removeMovieProducer(movieId, producerId) {
    await sql`SELECT remove_movie_producer(${movieId}, ${producerId})`;
}
