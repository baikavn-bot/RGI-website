import config from '@payload-config'
import { getPayload } from 'payload'

import { seed } from './index'

const payload = await getPayload({ config })
const res = await seed(payload)
payload.logger.info(`Seed xong: ${JSON.stringify(res)}`)
process.exit(0)
