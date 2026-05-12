import sql from '../services/neonClient.js';

export async function addDirector(name, birthYear = null) {
    const rows = await sql`SELECT * FROM add_director(${name}, ${birthYear})`;
    return rows[0];
}

export async function removeDirector(id) {
    await sql`SELECT remove_director(${id})`;
}

export async function getAllDirectors() {
    return sql`SELECT * FROM Director ORDER BY id`;
}

export async function getDirectorById(id) {
    const rows = await sql`SELECT * FROM Director WHERE id = ${id}`;
    return rows[0] ?? null;
}

export async function addMovieDirector(movieId, directorId) {
    await sql`SELECT add_movie_director(${movieId}, ${directorId})`;
}

export async function removeMovieDirector(movieId, directorId) {
    await sql`SELECT remove_movie_director(${movieId}, ${directorId})`;
}

export async function getDirectorRoi(directorId) {
    const rows = await sql`SELECT * FROM get_director_roi(${directorId})`;
    return rows[0] ?? null;
}

export async function getDirectorFilmography() {
    return sql`SELECT * FROM v_director_filmography ORDER BY movie_count DESC`;
}

export async function getMoviesByDirectorId(directorId) {
    return sql`
        SELECT m.id, m.title, m.release_year, m.genre
        FROM Movie m
        JOIN Movie_Director md ON m.id = md.movie_id
        WHERE md.director_id = ${directorId}
        ORDER BY m.release_year DESC NULLS LAST, m.title
    `;
}
