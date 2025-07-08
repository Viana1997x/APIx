import express from 'express'

import KillerPerksRouter from './V1/killer_perks.js'
import SurvivorPerksRouter from './V1/survivor_perks.js'

import KillersRouter from './V1/killers.js'
import SurvivorsRouter from './V1/survivors.js'
import AddonsRouter from './V1/addons.js' 
import RealmsRouter from './V1/realms.js'; 
import MapsRouter from './V1/maps.js';
import ItemsRouter from './V1/items.js';
import ItemAddonsRouter from './V1/item_addons.js';
import SearchRouter from './V1/search.js';

const V1 = '/API/V1'

// Create new router
const router = express.Router()

router.use(V1, KillerPerksRouter)
router.use(V1, SurvivorPerksRouter)

router.use(V1, KillersRouter)
router.use(V1, SurvivorsRouter)
router.use(V1, AddonsRouter) 
router.use(V1, RealmsRouter); 
router.use(V1, MapsRouter);   
router.use(V1, ItemsRouter);
router.use(V1, ItemAddonsRouter);
router.use(V1, SearchRouter);

// Return router for Express to use as Middleware
export default router