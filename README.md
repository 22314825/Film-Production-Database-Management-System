## Project details are in the "Report.pdf".

## GUI
 
The UI uses the controller layer to perform database operations.
Controllers connect to the SQL database through neonClient.js and execute the required SQL queries or procedures.
In this way, the GUI is separated from direct database access, and the database logic is handled by the controllers.
### actorController
```sql
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

export async function getMoviesByActorId(actorId) {
    return sql`
        SELECT m.id, m.title, m.release_year, m.genre, ma.role, ma.salary
        FROM Movie m
        JOIN Movie_Actor ma ON m.id = ma.movie_id
        WHERE ma.actor_id = ${actorId}
        ORDER BY m.release_year DESC NULLS LAST, m.title
    `;
}

export async function updateActor(id, name, birthYear = null, gender = null) {
    await sql`SELECT update_actor(${id}, ${name}, ${birthYear}, ${gender})`;
}

export async function updateMovieActor(movieId, actorId, role = null, salary = null) {
    await sql`SELECT update_movie_actor(${movieId}, ${actorId}, ${role}, ${salary})`;
}


```
---
### crewMemberController
```sql
import sql from '../services/neonClient.js';

export async function addCrewMember(name, birthYear = null, gender = null) {
    const rows = await sql`SELECT * FROM add_crew_member(${name}, ${birthYear}, ${gender})`;
    return rows[0];
}

export async function removeCrewMember(id) {
    await sql`SELECT remove_crew_member(${id})`;
}

export async function getAllCrewMembers() {
    return sql`SELECT * FROM CrewMember ORDER BY id`;
}

export async function getCrewMemberById(id) {
    const rows = await sql`SELECT * FROM CrewMember WHERE id = ${id}`;
    return rows[0] ?? null;
}

export async function addMovieCrewMember(movieId, crewMemberId, jobTitle = null, salary = null) {
    await sql`SELECT add_movie_crew_member(${movieId}, ${crewMemberId}, ${jobTitle}, ${salary})`;
}

export async function removeMovieCrewMember(movieId, crewMemberId) {
    await sql`SELECT remove_movie_crew_member(${movieId}, ${crewMemberId})`;
}

export async function getCrewRoster(movieId) {
    return sql`SELECT * FROM v_crew_roster WHERE movie_id = ${movieId}`;
}

export async function getMoviesByCrewMemberId(crewMemberId) {
    return sql`
        SELECT m.id, m.title, m.release_year, m.genre, mc.job_title, mc.salary
        FROM Movie m
        JOIN Movie_CrewMember mc ON m.id = mc.movie_id
        WHERE mc.crew_member_id = ${crewMemberId}
        ORDER BY m.release_year DESC NULLS LAST, m.title
    `;
}

export async function updateCrewMember(id, name, birthYear = null, gender = null) {
    await sql`SELECT update_crew_member(${id}, ${name}, ${birthYear}, ${gender})`;
}

export async function updateMovieCrewMember(movieId, crewMemberId, jobTitle = null, salary = null) {
    await sql`SELECT update_movie_crew_member(${movieId}, ${crewMemberId}, ${jobTitle}, ${salary})`;
}


```
---
### directorController
```sql
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

export async function updateDirector(id, name, birthYear = null) {
    await sql`SELECT update_director(${id}, ${name}, ${birthYear})`;
}


```
---
### financeController
```sql
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

```
---
### movieController
```sql
import sql from '../services/neonClient.js';

export async function addMovie(title, genre = null, topic = null, releaseYear = null) {
    const rows = await sql`SELECT * FROM add_movie(${title}, ${genre}, ${topic}, ${releaseYear})`;
    return rows[0];
}

export async function removeMovie(id) {
    await sql`SELECT remove_movie(${id})`;
}

export async function publishMovie(id, title, genre, topic, releaseYear) {
    const rows = await sql`SELECT * FROM publish_movie(${id}, ${title}, ${genre}, ${topic}, ${releaseYear})`;
    return rows[0];
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


```
---
### producerController
```sql
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

export async function addMovieProducer(movieId, producerId, investment) {
    await sql`SELECT add_movie_producer(${movieId}, ${producerId}, ${investment})`;
}

export async function removeMovieProducer(movieId, producerId) {
    await sql`SELECT remove_movie_producer(${movieId}, ${producerId})`;
}

export async function updateMovieProducerInvestment(movieId, producerId, investment) {
    await sql`SELECT update_movie_producer_investment(${movieId}, ${producerId}, ${investment})`;
}

export async function getMoviesByProducerId(producerId) {
    return sql`
        SELECT m.id, m.title, m.release_year, m.genre
        FROM Movie m
        JOIN Movie_Producer mp ON m.id = mp.movie_id
        WHERE mp.producer_id = ${producerId}
        ORDER BY m.release_year DESC NULLS LAST, m.title
    `;
}

export async function updateProducer(id, name, birthYear = null, gender = null) {
    await sql`SELECT update_producer(${id}, ${name}, ${birthYear}, ${gender})`;
}

export async function getMovieProducers(movieId) {
    return sql`
        SELECT p.id, p.name, mp.investment
        FROM Movie_Producer mp
        JOIN Producer p ON p.id = mp.producer_id
        WHERE mp.movie_id = ${movieId}
        ORDER BY p.name
    `;
}

```
---

### queryController
```sql
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


```
---

  ```

