import IRepositories from '../../interfaces/repository'

export default abstract class BaseService {
	constructor(protected readonly repository: IRepositories) {}
}
