import crypto from 'node:crypto'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

import { knexConnection } from '../database.js'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists.js'

export async function transactionsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request: FastifyRequest) => {
      const { sessionId } = request.cookies

      const transactions = await knexConnection('transactions')
        .where('session_id', sessionId)
        .select()

      return { transactions }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getTransactionParamsSchema.parse(request.params)
      const { sessionId } = request.cookies

      const transaction = await knexConnection('transactions')
        .where({
          session_id: sessionId,
          id,
        })
        .first()

      if (!transaction) {
        return reply.status(404).send({ error: 'Transaction not found' })
      }

      return reply.status(200).send({ transaction })
    },
  )

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request: FastifyRequest) => {
      const { sessionId } = request.cookies

      const summary = await knexConnection('transactions')
        .where('session_id', sessionId)
        .sum('amount', { as: 'amount' })
        .first()

      return { summary }
    },
  )

  app.post('/', async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = crypto.randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      })
    }

    await knexConnection('transactions').insert({
      id: crypto.randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      created_at: new Date(),
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
