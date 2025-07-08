import express from 'express';
import { Killer, Survivor } from '../../../db/models/character.js';
import { killerPerk, survivorPerk } from '../../../db/models/perk.js';
import { Addon } from '../../../db/models/addon.js';
import { Item } from '../../../db/models/item.js';
import { ItemAddon } from '../../../db/models/item_addon.js';
import Prettify from '../../../utils/prettify.js';

const router = express.Router();

router.get('/search', async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;
        if (!q) {
            return res.status(400).send(Prettify._JSON({ error: 'Parâmetro de busca "q" é obrigatório.' }));
        }
        const textQuery = { $text: { $search: q } };
        const score = { score: { $meta: "textScore" } };
        const [
            killers, survivors, killerPerks, survivorPerks, killerAddons, items, itemAddons
        ] = await Promise.all([
            Killer.find(textQuery, score).sort(score).limit(parseInt(limit)),
            Survivor.find(textQuery, score).sort(score).limit(parseInt(limit)),
            killerPerk.find(textQuery, score).populate('character').sort(score).limit(parseInt(limit)),
            survivorPerk.find(textQuery, score).populate('character').sort(score).limit(parseInt(limit)),
            Addon.find(textQuery, score).populate('killer').sort(score).limit(parseInt(limit)),
            Item.find(textQuery, score).sort(score).limit(parseInt(limit)),
            ItemAddon.find(textQuery, score).sort(score).limit(parseInt(limit))
        ]);
        
        res.status(200).send(Prettify._JSON({
            query: q,
            results: { killers, survivors, killerPerks, survivorPerks, killerAddons, items, itemAddons }
        }));
    } catch (error) {
        res.status(500).send(Prettify._JSON({ error: error.message }));
    }
});

export default router;