import { hc } from 'hono/client'
import { AppType } from '@/server'

const client = hc<AppType>(
  typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
)

export const api = client.api
