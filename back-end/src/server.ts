import app from './app'
import globalConfig from './utils/global-config'
import Logger from './utils/logger'
import { NodeEnv } from './types/envs'

const logger = new Logger({ source: 'SERVER' })

app.listen(globalConfig.restPort, () => {
	if (globalConfig.nodeEnv === NodeEnv.DEVELOPMENT) {
		logger.info(`Local server is running at http://localhost:${globalConfig.restPort}`)
	} else {
		logger.info(`Server is running at port ${globalConfig.restPort}`)
	}
})
