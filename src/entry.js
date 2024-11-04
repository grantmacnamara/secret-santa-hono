import { serve } from '@hono/node-server'
import { app } from './server/index.js'

const port = process.env.PORT || 3000

export default {
  port,
  fetch: app.fetch
}

if (process.env.NODE_ENV !== 'development') {
  serve({
    fetch: app.fetch,
    port
  }, () => {
    console.log(`Server is running on http://localhost:${port}`)
  })
} 