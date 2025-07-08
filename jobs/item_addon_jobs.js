import HTMLParser from 'node-html-parser';
import { stripHtml } from 'string-strip-html';
import webReader from '../utils/web_reader.js';
import { ItemAddon } from '../db/models/item_addon.js';

class itemAddonJobs {
  static #addonsURL = 'https://deadbydaylight.fandom.com/wiki/Add-ons';

  static async #scrapeItemAddons() {
    const pageData = await webReader.readWebsite(this.#addonsURL);
    const parsedPage = HTMLParser.parse(pageData);

    const allAddonsToSave = [];
    
    // Encontra o cabeçalho principal para focar apenas nos addons de sobrevivente
    const mainHeader = parsedPage.querySelector("h2:has(span#Survivor_Item_Add-ons)");

    if (!mainHeader) {
      console.warn("Warning: Could not find the 'Survivor Item Add-ons' section header. No add-ons will be updated.");
      return;
    }

    // Cria uma "sandbox" pegando todos os elementos entre o H2 dos sobreviventes e o próximo H2
    let currentNode = mainHeader.nextElementSibling;
    const survivorSectionHTML = [];
    while (currentNode && currentNode.tagName !== 'H2') {
      survivorSectionHTML.push(currentNode.outerHTML);
      currentNode = currentNode.nextElementSibling;
    }
    
    // Analisa apenas o HTML da seção de sobreviventes
    const survivorScope = HTMLParser.parse(survivorSectionHTML.join(''));
    const addonTables = survivorScope.querySelectorAll('.wikitable');

    for (const table of addonTables) {
      // Para encontrar o tipo de item, procuramos o H3 anterior à tabela dentro do escopo
      let prevElement = table.previousElementSibling;
      while(prevElement && prevElement.tagName !== 'H3') {
        prevElement = prevElement.previousElementSibling;
      }
      const itemType = prevElement?.querySelector('.mw-headline')?.innerText.trim() || 'Unknown';
      
      const addonRows = table.querySelectorAll('tbody > tr');
      addonRows.forEach((row, index) => {
        if (index === 0) return; // Pula o cabeçalho

        const cells = row.querySelectorAll('th, td');
        if (cells.length < 3) return;

        const name = cells[1].querySelector('a')?.innerText.trim();
        if (!name) return;

        const iconURL = cells[0].querySelector('img')?.attributes['data-src'];
        const descriptionHTML = cells[2].innerHTML;
        const descriptionText = stripHtml(descriptionHTML).result.trim();
        const rarityDiv = cells[0].querySelector('div[class*="-item-element"]');
        const rarityClass = rarityDiv?.classList.values().find(c => c.includes('-item-element'));
        const rarity = rarityClass ? rarityClass.split('-')[0] : 'common';
        
        allAddonsToSave.push({
          updateOne: {
            filter: { name },
            update: { name, itemType, rarity, description: descriptionHTML, descriptionText, iconURL },
            upsert: true
          }
        });
      });
    }

    if (allAddonsToSave.length > 0) {
      await ItemAddon.bulkWrite(allAddonsToSave);
      console.log(`Successfully fetched ${allAddonsToSave.length} item add-ons.`);
    } else {
      console.warn("Warning: No item add-ons were found to populate the database. Please check the scraping logic and the source page structure.");
    }
  }

  static updateItemAddons() {
    console.log('Updating item add-on database...');
    return this.#scrapeItemAddons()
      .then(() => 'Successfully updated item add-on database')
      .catch(error => {
        throw new Error('Item add-on database update failed: ' + error.message);
      });
  }
}

export default itemAddonJobs;