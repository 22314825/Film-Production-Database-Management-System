import sql from '../services/neonClient.js';

export async function addActor(name, birthYear = null, gender = null) {
    const rows = await sql`SELECT * FROM add_actor(${name}, ${birthYear}, ${gender})`;
    return rows[0];
}

export async function removeActor(id) {
    await sql`SELECT remove_actor(${id})`;
}

export async function getAllActors() {
    return sql`SELECT * FROM Actor ORDER BY id`;
}

export async function getActorById(id) {
    const rows = await sql`SELECT * FROM Actor WHERE id = ${id}`;
    return rows[0] ?? null;
}

export async function addMovieActor(movieId, actorId, role = null, salary = null) {
    await sql`SELECT add_movie_actor(${movieId}, ${actorId}, ${role}, ${salary})`;
}

export async function removeMovieActor(movieId, actorId) {
    await sql`SELECT remove_movie_actor(${movieId}, ${actorId})`;
}

export async function getMoviesByActor(actorName) {
    return sql`SELECT * FROM get_movies_by_actor(${actorName})`;
}
