import app from './app'
import { Envs } from './utils/validations/Envs.validator'

const envs = new Envs()

app.listen(envs.restPort, () => {
  if (envs.nodeEnv === 'development') console.log(`Local server is running at http://localhost:${envs.restPort}`)
  if (envs.nodeEnv === 'production') console.log(`Server is running at port ${envs.restPort}`)
})
