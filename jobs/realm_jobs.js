import HTMLParser from 'node-html-parser';
import webReader from '../utils/web_reader.js';
import { Realm } from '../db/models/realm.js';
import { Map } from '../db/models/map.js';

class realmJobs {
  static #realmsURL = 'https://deadbydaylight.fandom.com/wiki/Realms';

  static async #scrapeRealmsAndMaps() {
    const pageData = await webReader.readWebsite(this.#realmsURL);
    const parsedPage = HTMLParser.parse(pageData);

    const realmTables = parsedPage.querySelectorAll('h3 + .wikitable');
    const allMapsToSave = [];

    for (const table of realmTables) {
      const realmName = table.previousElementSibling.querySelector('.mw-headline')?.innerText.trim();
      if (!realmName) continue;

      const realmDoc = await Realm.findOneAndUpdate(
        { name: realmName },
        { name: realmName },
        { upsert: true, new: true }
      );

      const mapGroupRows = table.querySelectorAll('tbody > tr');
      
      for (const row of mapGroupRows) {
        const variationCells = row.querySelectorAll('td');
        let mapGroupName = '';

        for (const [index, cell] of variationCells.entries()) {
          const mapLink = cell.querySelector('a');
          const mapVariationName = mapLink?.attributes.title?.trim();

          if (!mapVariationName) continue;

          // Assume que o nome do primeiro mapa da linha é o nome do "grupo"
          if (index === 0) {
            mapGroupName = mapVariationName;
          }

          const imageNodes = cell.querySelectorAll('img');
          const imageURLs = imageNodes.map(img => img.attributes['data-src']).filter(Boolean);

          allMapsToSave.push({
            updateOne: {
              filter: { name: mapVariationName },
              update: {
                name: mapVariationName,
                mapGroupName: mapGroupName, // Salva o nome do grupo
                imageURLs: imageURLs,
                realm: realmDoc._id
              },
              upsert: true
            }
          });
        }
      }
    }

    if (allMapsToSave.length > 0) {
      await Map.bulkWrite(allMapsToSave);
      console.log(`Successfully fetched and linked ${allMapsToSave.length} map variations.`);
    }
  }

  static updateRealmsAndMaps() {
    console.log('Updating realm and map database...');
    return this.#scrapeRealmsAndMaps()
      .then(() => 'Successfully updated realm and map database')
      .catch(error => {
        throw new Error('Realm and map database update failed: ' + error.message);
      });
  }
}

export default realmJobs;