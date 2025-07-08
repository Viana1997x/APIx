import HTMLParser from 'node-html-parser';
import { stripHtml } from 'string-strip-html';
import webReader from '../utils/web_reader.js';
import { Item } from '../db/models/item.js';

class itemJobs {
  static #itemsURL = 'https://deadbydaylight.fandom.com/wiki/Items';

  static async #scrapeItems() {
    const pageData = await webReader.readWebsite(this.#itemsURL);
    const parsedPage = HTMLParser.parse(pageData);

    const allItemsToSave = [];
    
    // Encontra todos os cabeçalhos de grupos de itens (ex: "Firecrackers", "Toolbox")
    const itemHeaders = parsedPage.querySelectorAll('h4');

    for (const h4 of itemHeaders) {
      const itemType = h4.querySelector('.mw-headline')?.innerText.trim();
      if (!itemType) continue;

      let nextElement = h4.nextElementSibling;
      const generalDescriptionNodes = [];
      
      // Itera para pegar a descrição geral nos parágrafos seguintes
      while(nextElement && nextElement.tagName === 'P') {
        generalDescriptionNodes.push(nextElement.innerText.trim());
        nextElement = nextElement.nextElementSibling;
      }
      const generalDescription = generalDescriptionNodes.join('\n\n');
      
      // O elemento atual (após os parágrafos) deve ser a tabela
      const itemTable = nextElement;

      if (itemTable && itemTable.tagName === 'TABLE' && itemTable.classList.contains('wikitable')) {
        const itemRows = itemTable.querySelectorAll('tbody > tr');
        
        itemRows.forEach((row, index) => {
          if (index === 0) return; // Pula o cabeçalho da tabela

          const cells = row.querySelectorAll('th, td');
          if (cells.length < 2) return;

          const iconCell = cells[0];
          const nameAndDescCell = cells[1];

          // CORREÇÃO FINAL: Extrai o nome do link, que pode estar ou não em negrito.
          const name = nameAndDescCell.querySelector('a')?.innerText.trim();
          if (!name) return;

          const iconURL = iconCell.querySelector('img')?.attributes['data-src'];
          const descriptionHTML = nameAndDescCell.innerHTML;
          const descriptionText = stripHtml(descriptionHTML).result.trim();
          
          const rarityDiv = iconCell.querySelector('div[class*="-item-element"]');
          const rarityClass = rarityDiv?.classList.values().find(c => c.includes('-item-element'));
          const rarity = rarityClass ? rarityClass.split('-')[0] : 'common';
          
          allItemsToSave.push({
            updateOne: {
              filter: { name: name },
              update: {
                name,
                itemType,
                rarity,
                description: descriptionHTML,
                descriptionText,
                generalDescription,
                iconURL
              },
              upsert: true
            }
          });
        });
      }
    }

    if (allItemsToSave.length > 0) {
      await Item.bulkWrite(allItemsToSave);
      console.log(`Successfully fetched ${allItemsToSave.length} item variations.`);
    } else {
      console.warn("Warning: No items were found to populate the database. This might be correct if there are no items to update, or it could indicate an issue with the scraping logic.");
    }
  }

  static updateItems() {
    console.log('Updating item database...');
    return this.#scrapeItems()
      .then(() => 'Successfully updated item database')
      .catch(error => {
        throw new Error('Item database update failed: ' + error.message);
      });
  }
}

export default itemJobs;