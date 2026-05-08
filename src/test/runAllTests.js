/**
 * Runs all controller test suites sequentially and reports results.
 * Execute with: npm test
 */

import { run as runMovie }      from './testMovieController.js';
import { run as runActor }      from './testActorController.js';
import { run as runDirector }   from './testDirectorController.js';
import { run as runProducer }   from './testProducerController.js';
import { run as runCrew }       from './testCrewMemberController.js';
import { run as runFinance }    from './testFinanceController.js';
import { run as runQuery }      from './testQueryController.js';

const suites = [
    { name: 'Movie',      fn: runMovie      },
    { name: 'Actor',      fn: runActor      },
    { name: 'Director',   fn: runDirector   },
    { name: 'Producer',   fn: runProducer   },
    { name: 'CrewMember', fn: runCrew       },
    { name: 'Finance',    fn: runFinance    },
    { name: 'Query',      fn: runQuery      },
];

let passed = 0;
let failed = 0;

for (const suite of suites) {
    try {
        await suite.fn();
        passed++;
    } catch (err) {
        console.error(`\n[SUITE ERROR] ${suite.name}: ${err.message}`);
        failed++;
        process.exitCode = 1;
    }
}

console.log(`\n${'═'.repeat(40)}`);
console.log(`Suites: ${passed} passed, ${failed} failed`);

if (process.exitCode === 1) {
    console.log('Some tests failed — see output above.');
} else {
    console.log('All tests passed ✓');
}
