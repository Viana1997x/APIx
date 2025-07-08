import { stripHtml } from 'string-strip-html'
import HTMLParser from 'node-html-parser'
import webReader from '../utils/web_reader.js'
import { survivorPerk, killerPerk } from '../db/models/perk.js'

class perkJobs {
  static #addURL = 'https://deadbydaylight.fandom.com'

  // Perks
  static #perksURL = 'https://deadbydaylight.fandom.com/wiki/Perks'
  static #survivorPerksSelector = "h3:has(span[id^='Survivor_Perks_'])+table>tbody"
  static #killerPerksSelector = "h3:has(span[id^='Killer_Perks_'])+table>tbody"

  static #retrievePerks (selector) {
    if (!selector) { return false }

    return new Promise((resolve, reject) => {
      webReader.readWebsite(this.#perksURL).then((data) => {
        const Perks = []
        const parsedHTML = HTMLParser.parse(data)

        const PerkTable = parsedHTML.querySelector(selector)

        if (!PerkTable) {
          reject(new Error('HTML table with perks not found.'))
          return
        }

        PerkTable.childNodes.forEach(tableRow => {
          if (tableRow.nodeType !== 1 || !tableRow.childNodes[1]) { return }

          const iconA = tableRow.querySelectorAll('th')[0].querySelector('a')
          const nameA = tableRow.querySelectorAll('th')[1].querySelector('a')

          if (!iconA || !nameA) { return }

          const contentA = tableRow.querySelectorAll('td')[0]

          if (!contentA) { return }

          const character = tableRow.querySelectorAll('th')[2].querySelectorAll('a')[0]

          const perkIcon = iconA.attributes.href
          const perkName = nameA.text
          const URIName = nameA.attributes.href.split('/').pop()

          contentA.querySelectorAll('a').forEach(link => {
            link.setAttribute('href', this.#addURL + link.attributes.href)
          })

          const content = contentA.innerHTML
          const perkData = { URIName, name: perkName, iconURL: perkIcon, content, contentText: stripHtml(content).result }

          if (character) {
            perkData.characterName = character.attributes.title
          }

          Perks.push(perkData)
        })

        if (Perks.length) { resolve(Perks) } else { reject(new Error('No perks found.')) }
      })
    })
  }

  static async retrieveSurvivorPerks () {
    try {
      const perks = await this.#retrievePerks(this.#survivorPerksSelector)
      const bulkOps = perks.map(perk => {
        return {
          updateOne: {
            filter: {
              name: perk.name
            },
            update: perk,
            upsert: true
          }
        }
      })

      await survivorPerk.bulkWrite(bulkOps)

      await survivorPerk.aggregate([
        {
          $match: {
            characterName: { $exists: true }
          }
        },
        {
          $lookup: {
            from: 'survivors',
            localField: 'characterName',
            foreignField: 'name',
            as: 'character'
          }
        },
        {
          $unwind: { path: '$character' }
        },
        {
          $set: { character: { $getField: { field: '_id', input: '$character' } } }
        },
        {
          $merge: {
            into: 'survivorperks',
            whenMatched: 'replace',
            whenNotMatched: 'insert'
          }
        }
      ])

      console.log('Successfully fetched Survivor perks.')
    } catch (error) {
      throw new Error('Failed fetching Survivor perks ' + error)
    }
  }

  static async retrieveKillerPerks () {
    try {
      const perks = await this.#retrievePerks(this.#killerPerksSelector)
      const bulkOps = perks.map(perk => {
        return {
          updateOne: {
            filter: {
              name: perk.name
            },
            update: perk,
            upsert: true
          }
        }
      })

      await killerPerk.bulkWrite(bulkOps)
      
      await killerPerk.aggregate([
        {
          $match: {
            characterName: { $exists: true }
          }
        },
        {
          $lookup: {
            from: 'killers',
            let: { perkCharName: '$characterName' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ['$name', '$$perkCharName'] },
                      { $regexMatch: { input: '$killerName', regex: `$$perkCharName` } }
                    ]
                  }
                }
              }
            ],
            as: 'character'
          }
        },
        {
          $unwind: { path: '$character' }
        },
        {
          $set: {
            characterName: { $getField: { field: 'killerName', input: '$character' } }
          }
        },
        {
          $set: {
            character: { $getField: { field: '_id', input: '$character' } }
          }
        },
        {
          $merge: {
            into: 'killerperks',
            whenMatched: 'replace',
            whenNotMatched: 'insert'
          }
        }
      ])

      console.log('Successfully fetched Killer perks.')
    } catch (error) {
      throw new Error('Failed fetching Killer perks ' + error)
    }
  }

  static updateKillerAndSurvivorPerks () {
    console.log('Updating perk database...')
    return new Promise((resolve, reject) => {
      try {
        Promise.all([this.retrieveSurvivorPerks(), this.retrieveKillerPerks()]).then(() => {
          resolve('Successfully updated perk database')
        })
      } catch (error) {
        reject(new Error('Perk database update failed'))
      }
    })
  }
}

export default perkJobs