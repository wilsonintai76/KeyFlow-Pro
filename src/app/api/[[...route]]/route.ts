import { handle } from 'hono/vercel'
import { GET as getHandler, POST as postHandler, PATCH as patchHandler, DELETE as deleteHandler, PUT as putHandler, OPTIONS as optionsHandler } from '@/server'

export const GET = getHandler
export const POST = postHandler
export const PATCH = patchHandler
export const DELETE = deleteHandler
export const PUT = putHandler
export const OPTIONS = optionsHandler
