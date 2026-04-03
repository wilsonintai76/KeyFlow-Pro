import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

import { createClient } from '@/lib/supabase/server'

const app = new Hono().basePath('/api')

// Example Route with HonoRPC and Zod Validation
const routes = app
  .get('/hello', (c) => {
    return c.json({
      message: 'Hello from Hono!',
    })
  })
  .get('/profile', async (c) => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      
    if (error && error.code !== 'PGRST116') {
      return c.json({ error: error.message }, 500)
    }
    
    return c.json(profile || null)
  })
  .post('/profile',
    zValidator('json', z.object({
      fullName: z.string(),
      email: z.string(),
      role: z.string(),
    })),
    async (c) => {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return c.json({ error: 'Unauthorized' }, 401)
      
      const body = c.req.valid('json')
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({ id: user.id, ...body, updatedAt: new Date().toISOString() })
        .select()
        .single()
        
      if (error) return c.json({ error: error.message }, 500)
      return c.json(data)
    }
  )
  .patch('/profile',
    zValidator('json', z.object({
      fullName: z.string().optional(),
      phoneNumber: z.string().optional(),
      registrationNumber: z.string().nullable().optional(),
      studentClass: z.string().nullable().optional(),
      staffId: z.string().nullable().optional(),
    })),
    async (c) => {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return c.json({ error: 'Unauthorized' }, 401)
      
      const body = c.req.valid('json')
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ ...body, updatedAt: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single()
        
      if (error) return c.json({ error: error.message }, 500)
      return c.json(data)
    }
  )
  .get('/keys', async (c) => {
    const supabase = await createClient()
    const { data: keys, error } = await supabase
      .from('keys')
      .select('*')
      .order('keyIdentifier', { ascending: true })
      
    if (error) return c.json({ error: error.message }, 500)
    return c.json(keys || [])
  })
  .post('/keys',
    zValidator('json', z.object({
      keyIdentifier: z.string(),
      description: z.string(),
      location: z.string(),
      status: z.enum(['available', 'checked_out', 'overdue']).default('available'),
      pegIndex: z.number().nullable().optional(),
    })),
    async (c) => {
      const supabase = await createClient()
      const body = c.req.valid('json')
      
      const { data, error } = await supabase
        .from('keys')
        .insert({ ...body, createdAt: new Date().toISOString() })
        .select()
        .single()
        
      if (error) return c.json({ error: error.message }, 500)
      return c.json(data)
    }
  )
  .patch('/keys/:id',
    zValidator('json', z.object({
      name: z.string().optional(), // Adding 'name' as well for compatibility
      keyIdentifier: z.string().optional(),
      description: z.string().optional(),
      location: z.string().optional(),
      status: z.enum(['available', 'checked_out', 'overdue']).optional(),
      pegIndex: z.number().optional(),
    })),
    async (c) => {
      const id = c.req.param('id')
      const body = c.req.valid('json')
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('keys')
        .update({ ...body })
        .eq('id', id)
        .select()
        .single()
        
      if (error) return c.json({ error: error.message }, 500)
      return c.json(data)
    }
  )
  .delete('/keys/:id', async (c) => {
    const id = c.req.param('id')
    const supabase = await createClient()
    const { error } = await supabase
      .from('keys')
      .delete()
      .eq('id', id)
      
    if (error) return c.json({ error: error.message }, 500)
    return c.json({ success: true })
  })
  .get('/complaints/pending', async (c) => {
    const supabase = await createClient()
    const { data: complaints, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('status', 'pending')
      .limit(10)
      
    if (error) return c.json({ error: error.message }, 500)
    return c.json(complaints || [])
  })
  .get('/users', async (c) => {
    const supabase = await createClient()
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('email', { ascending: true })
      
    if (error) return c.json({ error: error.message }, 500)
    return c.json(users || [])
  })
  .get('/users/:id', async (c) => {
    const id = c.req.param('id')
    const supabase = await createClient()
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single()
      
    if (error && error.code !== 'PGRST116') return c.json({ error: error.message }, 500)
    return c.json(user || null)
  })
  .patch('/users/:id',
    zValidator('json', z.object({
      fullName: z.string().optional(),
      email: z.string().optional(),
      phoneNumber: z.string().nullable().optional(),
      role: z.enum(['guest', 'student', 'staff', 'admin']).optional(),
      registrationNumber: z.string().nullable().optional(),
      studentClass: z.string().nullable().optional(),
      staffId: z.string().nullable().optional(),
    })),
    async (c) => {
      const id = c.req.param('id')
      const body = c.req.valid('json')
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ ...body, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
        
      if (error) return c.json({ error: error.message }, 500)
      return c.json(data)
    }
  )
  .delete('/users/:id', async (c) => {
    const id = c.req.param('id')
    const supabase = await createClient()
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id)
      
    if (error) return c.json({ error: error.message }, 500)
    return c.json({ success: true })
  })
  .get('/complaints', async (c) => {
    const supabase = await createClient()
    const { data: complaints, error } = await supabase
      .from('complaints')
      .select('*')
      .order('timestamp', { ascending: false })
      
    if (error) return c.json({ error: error.message }, 500)
    return c.json(complaints || [])
  })
  .post('/complaints',
    zValidator('json', z.object({
      description: z.string(),
      userId: z.string(),
      userName: z.string(),
      userEmail: z.string(),
    })),
    async (c) => {
      const supabase = await createClient()
      const body = c.req.valid('json')
      
      const { data, error } = await supabase
        .from('complaints')
        .insert({ 
          ...body, 
          status: 'pending', 
          timestamp: new Date().toISOString() 
        })
        .select()
        .single()
        
      if (error) return c.json({ error: error.message }, 500)
      return c.json(data)
    }
  )
  .patch('/complaints/:id',
    zValidator('json', z.object({
      status: z.enum(['pending', 'resolved']),
    })),
    async (c) => {
      const id = c.req.param('id')
      const body = c.req.valid('json')
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('complaints')
        .update({ ...body })
        .eq('id', id)
        .select()
        .single()
        
      if (error) return c.json({ error: error.message }, 500)
      return c.json(data)
    }
  )
  .post('/logs',
    zValidator('json', z.object({
      type: z.string(),
      message: z.string(),
      userId: z.string(),
      userName: z.string(),
    })),
    async (c) => {
      const supabase = await createClient()
      const body = c.req.valid('json')
      
      const { error } = await supabase
        .from('system_logs')
        .insert({ ...body, timestamp: new Date().toISOString() })
        
      if (error) return c.json({ error: error.message }, 500)
      return c.json({ success: true })
    }
  )
  .get('/logs', async (c) => {
    const supabase = await createClient()
    const { data: logs, error } = await supabase
      .from('system_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100)
      
    if (error) return c.json({ error: error.message }, 500)
    return c.json(logs || [])
  })
  .post('/ota',
    zValidator('json', z.object({
      otaUrl: z.string().url(),
    })),
    async (c) => {
      const { otaUrl } = c.req.valid('json')
      const supabase = await createClient()
      
      const { error } = await supabase
        .from('hardware_commands')
        .upsert({ 
          id: 'cabinet', 
          otaUrl, 
          timestamp: new Date().toISOString() 
        })
        
      if (error) return c.json({ error: error.message }, 500)
      return c.json({ success: true })
    }
  )
  .post(
    '/unlock',
    zValidator(
      'json',
      z.object({
        userId: z.string(),
        userName: z.string(),
      })
    ),
    async (c) => {
      const supabase = await createClient()
      const { userId, userName } = c.req.valid('json')
      
      const { error } = await supabase
        .from('hardware_triggers')
        .insert({
          action: 'UNLOCK_CABINET',
          userId,
          userName,
          status: 'pending',
          timestamp: new Date().toISOString()
        })
        
      if (error) return c.json({ error: error.message }, 500)
      
      return c.json({
        success: true,
        message: `Unlock request received for ${userName}`,
      })
    }
  )
  .post('/setup/admin', async (c) => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role: 'admin', updatedAt: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()
      
    if (error) return c.json({ error: error.message }, 500)
    return c.json({ success: true, user: data })
  })

export type AppType = typeof routes
export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
export const PUT = handle(app)
export const OPTIONS = handle(app)
