import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.routes'
import { verifyJwtTokenHandler } from './utils/jwt'
import { performJson } from './adapters/expressAdapter'

const app = express()

// for preventing cors errors when fetching any route
app.options('*', cors())
app.use(cors())

// to parse incoming JSON data from requests
app.use(express.json())

// login route with returns a token which needs to be used in all the next routes below the login one
app.use('/auth', authRoutes)

// all the requests below needs a JWT 'authorization' headers key
// example: { headers: { authorization: secret_example } }
app.use(performJson(verifyJwtTokenHandler))

export default app
