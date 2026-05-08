import { uniqueName, assert, test } from './helpers.js';
import { addCrewMember, removeCrewMember, getCrewMemberById, addMovieCrewMember, removeMovieCrewMember, getCrewRoster } from '../controllers/crewMemberController.js';
import { addMovie, removeMovie } from '../controllers/movieController.js';

export async function run() {
    console.log('\n── CrewMember Controller ──');

    let crewId, movieId;

    await test('addCrewMember returns the inserted row', async () => {
        const name = uniqueName('crew');
        const row = await addCrewMember(name, 1985, 'Male');
        assert(typeof row.id === 'number', 'id is a number');
        assert(row.name === name, 'name matches');
        crewId = row.id;
    });

    await test('getCrewMemberById returns the correct crew member', async () => {
        const row = await getCrewMemberById(crewId);
        assert(row !== null, 'row is not null');
        assert(row.id === crewId, 'id matches');
    });

    await test('addMovieCrewMember links crew member to movie', async () => {
        const movie = await addMovie(uniqueName('movie'), 'Sci-Fi');
        movieId = movie.id;
        await addMovieCrewMember(movieId, crewId, 'Cinematographer', 75000);
    });

    await test('getCrewRoster returns linked crew member', async () => {
        const roster = await getCrewRoster(movieId);
        assert(Array.isArray(roster), 'result is an array');
        const entry = roster.find(r => r.crew_member_id === crewId);
        assert(entry !== undefined, 'crew member appears in roster');
        assert(entry.job_title === 'Cinematographer', 'job_title matches');
    });

    await test('removeMovieCrewMember unlinks crew member from movie', async () => {
        await removeMovieCrewMember(movieId, crewId);
        const roster = await getCrewRoster(movieId);
        const entry = roster.find(r => r.crew_member_id === crewId);
        assert(entry === undefined, 'crew member no longer in roster');
    });

    await test('removeCrewMember deletes the crew member', async () => {
        await removeCrewMember(crewId);
        const row = await getCrewMemberById(crewId);
        assert(row === null, 'crew member no longer exists');
    });

    await removeMovie(movieId).catch(() => {});
}
