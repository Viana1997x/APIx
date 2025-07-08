import HTMLParser from 'node-html-parser';
import { stripHtml } from 'string-strip-html';
import webReader from '../utils/web_reader.js';
import { Survivor, Killer } from '../db/models/character.js';
import { Addon } from '../db/models/addon.js';

class charJobs {
  static #addURL = 'https://deadbydaylight.fandom.com';

  static #charactersURL = 'https://deadbydaylight.fandom.com/wiki/Characters';
  static #survivorsSelector = "h2:has(span[id^='Survivors'])+dl+div";
  static #killersSelector = "h2:has(span[id^='Killers'])+dl+div";

  static async #scrapeCharacterPage(characterData, isKiller) {
    try {
      const pageData = await webReader.readWebsite(characterData.link);
      const parsedPage = HTMLParser.parse(pageData);

      const pageDetails = { characterData };

      const loreHeader = parsedPage.querySelector("h2:has(span#Lore)");
      const loreParagraphs = [];
      if (loreHeader) {
        let nextElement = loreHeader.nextElementSibling;
        while (nextElement && nextElement.tagName !== 'H2') {
          if (nextElement.tagName === 'P') {
            const pText = nextElement.innerText.trim();
            if (!pText.includes("The table below lists additional Lore")) {
              loreParagraphs.push(pText);
            }
          }
          nextElement = nextElement.nextElementSibling;
        }
      }
      if (loreParagraphs.length > 0) {
        pageDetails.characterData.lore = loreParagraphs.join('\n\n');
      }

      if (isKiller) {
        const pNodes = parsedPage.querySelectorAll('p');
        const difficultyNode = pNodes.find(p => p.rawText.includes('Difficulty Rating:'));
        if (difficultyNode) {
          const difficultyText = difficultyNode.querySelector('b')?.innerText.trim();
          if (difficultyText) {
            pageDetails.characterData.difficulty = difficultyText.split('(')[0].trim();
          }
        }

        const powerHeader = parsedPage.querySelector("h3:has(span.mw-headline[id^='Power'])");
        const powerHtmlParts = [];
        if (powerHeader) {
          let nextElement = powerHeader.nextElementSibling;
          while (nextElement && !['H2', 'H3', 'H4'].includes(nextElement.tagName)) {
            if (['P', 'UL'].includes(nextElement.tagName)) {
              powerHtmlParts.push(nextElement.outerHTML);
            }
            nextElement = nextElement.nextElementSibling;
          }
        }
        if (powerHtmlParts.length > 0) {
          const combinedHtml = powerHtmlParts.join('');
          pageDetails.characterData.power = stripHtml(combinedHtml).result.trim();
        }

        const addonsData = [];
        const addonTable = parsedPage.querySelector('h3:has(span[id^="Add-ons_for"]) + table.wikitable');
        if (addonTable) {
          const addonRows = addonTable.querySelectorAll('tbody > tr');
          addonRows.forEach((row, index) => {
            if (index === 0) return;

            // CORREÇÃO: Seleciona tanto <th> quanto <td>
            const cells = row.querySelectorAll('th, td');
            if (cells.length < 3) return;

            const iconCell = cells[0];
            const nameCell = cells[1];
            const descriptionCell = cells[2];

            const nameLink = nameCell.querySelector('a');
            const iconLink = iconCell.querySelector('a');
            const rarityDiv = iconCell.querySelector('div[class*="-item-element"]');
            
            if (!nameLink || !iconLink || !rarityDiv) return;

            const name = nameLink.innerText.trim();
            const URIName = nameLink.attributes.href.split('/').pop();
            const iconURL = iconLink.querySelector('img')?.attributes['data-src'] || iconLink.attributes.href;
            const description = descriptionCell.innerHTML;
            const descriptionText = stripHtml(description).result.trim();
            
            const rarityClass = rarityDiv.classList.values().find(c => c.includes('-item-element'));
            const rarity = rarityClass ? rarityClass.split('-')[0] : 'common';
            
            addonsData.push({ name, URIName, iconURL, description, descriptionText, rarity });
          });
        }
        pageDetails.addonsData = addonsData;
      }

      return pageDetails;
    } catch (error) {
      console.error(`Falha ao processar a página para ${characterData.name}:`, error);
      return { characterData };
    }
  }

  static #retrieveCharacters(selector) {
    return new Promise((resolve, reject) => {
      webReader.readWebsite(this.#charactersURL).then(async (data) => {
        const initialCharacters = [];
        const parsedHTML = HTMLParser.parse(data);
        const CharTable = parsedHTML.querySelector(selector);
        const isKiller = selector === this.#killersSelector;

        if (!CharTable) { reject(new Error('HTML table with characters not found.')); return; }

        CharTable.childNodes.forEach(charDiv => {
          if (charDiv.nodeType !== 1 || !charDiv.childNodes?.length >= 2) { return; }
          const charA = charDiv.querySelectorAll('a')[0];
          const characterName = charA.innerText;
          let killerName;
          if (isKiller) {
            const killerNameRaw = charDiv.innerText.replace(characterName, '').trim();
            killerName = killerNameRaw.split('\n')[0];
          }
          const URIName = charA.attributes.href.split('/').pop();
          const characterLink = this.#addURL + charA.attributes.href;
          const imgA = charDiv.querySelectorAll('img')[0];
          const characterImage = imgA.attributes['data-src'];
          const characterData = { name: characterName, killerName, URIName, iconURL: characterImage, link: characterLink };
          initialCharacters.push(characterData);
        });

        if (initialCharacters.length === 0) { reject(new Error('No characters found.')); return; }

        console.log(`Buscando detalhes para ${initialCharacters.length} personagens...`);
        const detailedData = await Promise.all(
          initialCharacters.map(char => this.#scrapeCharacterPage(char, isKiller))
        );

        resolve(detailedData);
      }).catch(reject);
    });
  }

  static async retrieveSurvivors() {
    try {
      const survivorsDetails = await this.#retrieveCharacters(this.#survivorsSelector);
      const bulkOps = survivorsDetails.map(detail => ({
        updateOne: {
          filter: { name: detail.characterData.name },
          update: detail.characterData,
          upsert: true
        }
      }));
      await Survivor.bulkWrite(bulkOps);
      console.log('Successfully fetched Survivors.');
    } catch (error) {
      throw new Error('Failed fetching Survivors: ' + error.message);
    }
  }

  static async retrieveKillers() {
    try {
      const killersDetails = await this.#retrieveCharacters(this.#killersSelector);

      const killerOps = killersDetails.map(detail => ({
        updateOne: {
          filter: { name: detail.characterData.name },
          update: detail.characterData,
          upsert: true
        }
      }));
      await Killer.bulkWrite(killerOps);
      console.log('Successfully fetched Killers.');

      const savedKillers = await Killer.find({}, 'name _id');
      const killerIdMap = new Map(savedKillers.map(k => [k.name, k._id]));
      
      const allAddons = [];
      killersDetails.forEach(detail => {
        const killerId = killerIdMap.get(detail.characterData.name);
        if (killerId && detail.addonsData) {
          detail.addonsData.forEach(addon => {
            addon.killer = killerId;
            allAddons.push({
              updateOne: {
                filter: { URIName: addon.URIName },
                update: addon,
                upsert: true
              }
            });
          });
        }
      });
      
      if (allAddons.length > 0) {
        await Addon.bulkWrite(allAddons);
        console.log(`Successfully fetched and linked ${allAddons.length} add-ons.`);
      }

    } catch (error) {
      throw new Error('Failed fetching Killers or their Add-ons: ' + error.message);
    }
  }

  static updateKillersAndSurvivors() {
    console.log('Updating character database...');
    return new Promise((resolve, reject) => {
      Promise.all([this.retrieveSurvivors(), this.retrieveKillers()])
        .then(() => resolve('Successfully updated character database'))
        .catch(error => reject(new Error('Character database update failed: ' + error.message)));
    });
  }
}

export default charJobs;