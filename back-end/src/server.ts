import app from './app'
import globalConfig from './utils/global-config'
import Logger from './utils/logger'
import { ENodeEnvs } from './types/envs'

const logger = new Logger({ source: 'server' })

app.listen(globalConfig.restPort, () => {
	if (globalConfig.nodeEnv === ENodeEnvs.DEVELOPMENT) {
		logger.info(`Local server is running at http://localhost:${globalConfig.restPort}`)
	} else {
		logger.info(`Server is running at port ${globalConfig.restPort}`)
	}
})
