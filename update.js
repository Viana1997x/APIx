import perkJobs from './jobs/perk_jobs.js';
import charJobs from './jobs/char_jobs.js';
import realmJobs from './jobs/realm_jobs.js';
import itemJobs from './jobs/item_jobs.js';
import itemAddonJobs from './jobs/item_addon_jobs.js'; // <-- ADICIONE
import DBI from './db/db.js';

DBI.initConnection();

console.log('Starting database update...');

Promise.all([
  charJobs.updateKillersAndSurvivors().then(res => {
    console.log(res);
    return perkJobs.updateKillerAndSurvivorPerks();
  }),
  realmJobs.updateRealmsAndMaps(),
  itemJobs.updateItems(),
  itemAddonJobs.updateItemAddons() // <-- ADICIONE
]).then(results => {
  results.flat().forEach(res => res && console.log(res));
  console.log('Database update finished successfully.');
  process.exit(0);
}).catch(error => {
  console.error('An error occurred during the update process:', error);
  process.exit(1);
});