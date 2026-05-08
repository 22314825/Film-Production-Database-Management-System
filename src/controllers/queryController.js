import sql from '../services/neonClient.js';

export async function getProfitableMovies() {
    return sql`SELECT * FROM v_profitable_movies`;
}

export async function getMovieFullCast(movieId) {
    return sql`SELECT * FROM v_movie_full_cast WHERE movie_id = ${movieId}`;
}

export async function getDirectorFilmography() {
    return sql`SELECT * FROM v_director_filmography ORDER BY movie_count DESC`;
}

export async function getTopPaidActors(limit = 10) {
    return sql`SELECT * FROM v_top_paid_actors LIMIT ${limit}`;
}

export async function getGenrePerformance() {
    return sql`SELECT * FROM v_genre_performance`;
}

export async function getCrewRoster(movieId = null) {
    if (movieId !== null) {
        return sql`SELECT * FROM v_crew_roster WHERE movie_id = ${movieId}`;
    }
    return sql`SELECT * FROM v_crew_roster`;
}

export async function getMovieFinancialOverview(movieId = null) {
    if (movieId !== null) {
        return sql`SELECT * FROM v_movie_financial_overview WHERE movie_id = ${movieId}`;
    }
    return sql`SELECT * FROM v_movie_financial_overview ORDER BY roi_pct DESC NULLS LAST`;
}

export async function getMostProfitableGenre() {
    const rows = await sql`SELECT * FROM get_most_profitable_genre()`;
    return rows[0] ?? null;
}

export async function getMoviesByActor(actorName) {
    return sql`SELECT * FROM get_movies_by_actor(${actorName})`;
}

export async function getDirectorRoi(directorId) {
    const rows = await sql`SELECT * FROM get_director_roi(${directorId})`;
    return rows[0] ?? null;
}

export async function flagOverBudgetMovies() {
    return sql`SELECT * FROM flag_over_budget_movies()`;
}
