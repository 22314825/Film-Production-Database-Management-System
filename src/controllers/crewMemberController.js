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
