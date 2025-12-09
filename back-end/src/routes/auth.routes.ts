import express from 'express'

import { loginHandler, signupHandler } from '../controllers/auth.controller'
import { performJson } from '../adapters/expressAdapter'

const router = express.Router()

router.post('/login', performJson(loginHandler))
router.post('/signup', performJson(signupHandler))

export default router
