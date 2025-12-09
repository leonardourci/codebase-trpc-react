import express from 'express'

import { loginHandler, signupHandler } from '../controllers/AuthController'
import { performJson } from '../adapters/ExpressAdapter'

const router = express.Router()

router.post('/login', performJson(loginHandler))
router.post('/signup', performJson(signupHandler))

export default router
