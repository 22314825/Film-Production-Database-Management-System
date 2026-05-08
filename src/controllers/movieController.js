import sql from '../services/neonClient.js';

export async function addMovie(title, genre = null, topic = null, releaseYear = null) {
    const rows = await sql`SELECT * FROM add_movie(${title}, ${genre}, ${topic}, ${releaseYear})`;
    return rows[0];
}

export async function removeMovie(id) {
    await sql`SELECT remove_movie(${id})`;
}

export async function getAllMovies() {
    return sql`SELECT * FROM Movie ORDER BY id`;
}

export async function getMovieById(id) {
    const rows = await sql`SELECT * FROM Movie WHERE id = ${id}`;
    return rows[0] ?? null;
}

export async function getMovieFullRoster(movieId) {
    return sql`SELECT * FROM get_movie_full_roster(${movieId})`;
}

export async function getMovieTotalSpend(movieId) {
    const rows = await sql`SELECT * FROM get_movie_total_spend(${movieId})`;
    return rows[0] ?? null;
}

export async function flagOverBudgetMovies() {
    return sql`SELECT * FROM flag_over_budget_movies()`;
}
