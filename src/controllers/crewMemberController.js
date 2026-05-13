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
