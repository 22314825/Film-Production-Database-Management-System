import sql from '../services/neonClient.js';

// ── MovieFinance ────────────────────────────────────────────────────────────

export async function addMovieFinance(
    movieId,
    productionCost = null,
    marketingCost = null,
    boxOfficeRevenue = null
) {
    const rows = await sql`SELECT * FROM add_movie_finance(
        ${movieId}, ${productionCost}, ${marketingCost}, ${boxOfficeRevenue}
    )`;
    return rows[0];
}

export async function upsertMovieFinance(
    movieId,
    productionCost = null,
    marketingCost = null,
    boxOfficeRevenue = null
) {
    const rows = await sql`
        WITH p AS (SELECT COALESCE(SUM(investment), 0) as budget FROM Movie_Producer WHERE movie_id = ${movieId})
        INSERT INTO MovieFinance (movie_id, budget, production_cost, marketing_cost, box_office_revenue)
        SELECT ${movieId}, p.budget, ${productionCost}, ${marketingCost}, ${boxOfficeRevenue} FROM p
        ON CONFLICT (movie_id) 
        DO UPDATE SET 
            production_cost = EXCLUDED.production_cost,
            marketing_cost = EXCLUDED.marketing_cost,
            box_office_revenue = EXCLUDED.box_office_revenue
        RETURNING *;
    `;
    return rows[0];
}

export async function removeMovieFinance(movieId) {
    await sql`SELECT remove_movie_finance(${movieId})`;
}

export async function getMovieFinance(movieId) {
    const rows = await sql`SELECT * FROM MovieFinance WHERE movie_id = ${movieId}`;
    return rows[0] ?? null;
}

// ── DirectorFinance ─────────────────────────────────────────────────────────

export async function addDirectorFinance(
    directorId,
    movieId,
    baseFee = null,
    commissionRate = null,
    commissionType = null,
    contractType = null,
    bonus = null,
    totalPayout = null
) {
    const rows = await sql`SELECT * FROM add_director_finance(
        ${directorId}, ${movieId}, ${baseFee}, ${commissionRate},
        ${commissionType}, ${contractType}, ${bonus}, ${totalPayout}
    )`;
    return rows[0];
}

export async function removeDirectorFinance(directorId, movieId) {
    await sql`SELECT remove_director_finance(${directorId}, ${movieId})`;
}

export async function getDirectorFinance(directorId, movieId) {
    const rows = await sql`
        SELECT * FROM DirectorFinance
        WHERE director_id = ${directorId} AND movie_id = ${movieId}
    `;
    return rows[0] ?? null;
}

// ── ProducerFinance ─────────────────────────────────────────────────────────

export async function addProducerFinance(
    producerId,
    movieId,
    baseFee = null,
    commissionRate = null,
    commissionType = null,
    contractType = null,
    profitShareRate = null,
    movieNetProfit = null,
    bonus = null,
    totalPayout = null
) {
    const rows = await sql`SELECT * FROM add_producer_finance(
        ${producerId}, ${movieId}, ${baseFee}, ${commissionRate}, ${commissionType},
        ${contractType}, ${profitShareRate}, ${movieNetProfit}, ${bonus}, ${totalPayout}
    )`;
    return rows[0];
}

export async function removeProducerFinance(producerId, movieId) {
    await sql`SELECT remove_producer_finance(${producerId}, ${movieId})`;
}

export async function getProducerFinance(producerId, movieId) {
    const rows = await sql`
        SELECT * FROM ProducerFinance
        WHERE producer_id = ${producerId} AND movie_id = ${movieId}
    `;
    return rows[0] ?? null;
}
