import { execSync } from 'child_process';
import dotenv from 'dotenv';

import { addMovie }                                          from '../src/controllers/movieController.js';
import { addActor, addMovieActor }                          from '../src/controllers/actorController.js';
import { addDirector, addMovieDirector }                    from '../src/controllers/directorController.js';
import { addProducer, addMovieProducer }                    from '../src/controllers/producerController.js';
import { addCrewMember, addMovieCrewMember }                from '../src/controllers/crewMemberController.js';
import { addMovieFinance, addDirectorFinance, addProducerFinance } from '../src/controllers/financeController.js';

dotenv.config();

function runCommand(command, label) {
    console.log(`\n${label}...`);
    execSync(command, { stdio: 'inherit' });
}

async function seedDatabase() {
    console.log('\nSeeding database with realistic entities...');

    // ── Movies ────────────────────────────────────────────────────────────────
    const movie1 = await addMovie('Midnight Siege', 'Action',  'Cyber Heist',      2025);
    const movie2 = await addMovie('Glass Horizon',  'Drama',   'Family Legacy',    2024);
    const movie3 = await addMovie('Orbital Drift',  'Sci-Fi',  'Deep Space Rescue', 2026);

    // ── Directors ─────────────────────────────────────────────────────────────
    const director1 = await addDirector('Elena Ward',   1978);
    const director2 = await addDirector('Marcus Hall',  1969);

    // ── Producers ─────────────────────────────────────────────────────────────
    const producer1 = await addProducer('Priya Nair',     1982, 'Female');
    const producer2 = await addProducer('Daniel Brooks',  1975, 'Male');

    // ── Actors ────────────────────────────────────────────────────────────────
    const actor1 = await addActor('Sofia Reyes',   1991, 'Female');
    const actor2 = await addActor('Noah Carter',   1988, 'Male');
    const actor3 = await addActor('Liam Bennett',  1993, 'Male');

    // ── Crew Members ──────────────────────────────────────────────────────────
    const crew1 = await addCrewMember('Aisha Patel', 1986, 'Female');
    const crew2 = await addCrewMember('Ethan Cole',  1981, 'Male');

    // ── Movie → Director links ────────────────────────────────────────────────
    await addMovieDirector(movie1.id, director1.id);
    await addMovieDirector(movie2.id, director2.id);
    await addMovieDirector(movie3.id, director1.id);

    // ── Movie → Producer links ────────────────────────────────────────────────
    await addMovieProducer(movie1.id, producer1.id);
    await addMovieProducer(movie2.id, producer2.id);
    await addMovieProducer(movie3.id, producer1.id);

    // ── Movie → Actor links ───────────────────────────────────────────────────
    await addMovieActor(movie1.id, actor1.id, 'Lead',       900000);
    await addMovieActor(movie1.id, actor2.id, 'Antagonist', 700000);
    await addMovieActor(movie2.id, actor2.id, 'Lead',       600000);
    await addMovieActor(movie2.id, actor3.id, 'Supporting', 300000);
    await addMovieActor(movie3.id, actor1.id, 'Commander',  950000);
    await addMovieActor(movie3.id, actor3.id, 'Engineer',   450000);

    // ── Movie → Crew links ────────────────────────────────────────────────────
    await addMovieCrewMember(movie1.id, crew1.id, 'Cinematographer',    220000);
    await addMovieCrewMember(movie1.id, crew2.id, 'Production Designer', 180000);
    await addMovieCrewMember(movie2.id, crew1.id, 'Cinematographer',    200000);
    await addMovieCrewMember(movie2.id, crew2.id, 'Production Designer', 160000);
    await addMovieCrewMember(movie3.id, crew1.id, 'Cinematographer',    260000);
    await addMovieCrewMember(movie3.id, crew2.id, 'Production Designer', 190000);

    // ── Movie Finance ─────────────────────────────────────────────────────────
    await addMovieFinance(movie1.id, 75000000, 62000000, 12000000, 145000000);
    await addMovieFinance(movie2.id, 30000000, 25000000,  5000000,  52000000);
    await addMovieFinance(movie3.id, 90000000, 73000000, 15000000, 168000000);

    // ── Director Finance ──────────────────────────────────────────────────────
    await addDirectorFinance(director1.id, movie1.id, 1800000, 3.5, 'net',     'hybrid', 350000, 2600000);
    await addDirectorFinance(director2.id, movie2.id,  900000, 2.0, 'gross',   'flat',   120000, 1300000);
    await addDirectorFinance(director1.id, movie3.id, 2200000, 4.0, 'backend', 'hybrid', 400000, 3200000);

    // ── Producer Finance ──────────────────────────────────────────────────────
    await addProducerFinance(producer1.id, movie1.id, 1200000, 2.5, 'net',     'hybrid',     4.0, 71000000, 250000, 2600000);
    await addProducerFinance(producer2.id, movie2.id,  700000, 1.5, 'gross',   'flat',        2.5, 22000000, 100000, 1050000);
    await addProducerFinance(producer1.id, movie3.id, 1400000, 2.8, 'backend', 'percentage',  4.5, 80000000, 300000, 3300000);

    console.log('  ✓ Seeding complete');
    console.log('  Movies : Midnight Siege, Glass Horizon, Orbital Drift');
    console.log('  Directors : Elena Ward, Marcus Hall');
    console.log('  Producers : Priya Nair, Daniel Brooks');
    console.log('  Actors    : Sofia Reyes, Noah Carter, Liam Bennett');
    console.log('  Crew      : Aisha Patel, Ethan Cole');
}

async function setup() {
    try {
        runCommand('npm run reset',   'Resetting database');
        runCommand('npm run migrate', 'Applying migrations');
        await seedDatabase();
    } catch (err) {
        console.error('\nSetup failed:', err.message);
        process.exitCode = 1;
    }
}

setup();
