import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Ticket from 'App/Models/Ticket'
const Keygen = require('keygen')
import Cache from '@ioc:Kaperskyguru/Adonis-Cache'

export default class TicketsController {
  public async index({}: HttpContextContract) {
    // await Cache.flush()
    const tickets = await Cache.remember('tickets', 1, async function () {
      return await Ticket.query().preload('user').preload('event')
    })

    return tickets
  }

  public async indexWithoutCache({}: HttpContextContract) {
    await Cache.flush()
    return await Ticket.query().preload('user').preload('event')
  }

  public async show({ params }: HttpContextContract) {
    try {
      const ticket = await Cache.remember('ticket_id_' + params.id, 60, async function () {
        return await Ticket.find(params.id)
      })

      if (ticket) {
        await ticket.preload('user')
        await ticket.preload('event')
        return ticket
      }
    } catch (error) {
      console.log(error)
    }
  }

  public async update({ request, params }: HttpContextContract) {
    const ticket = await Cache.remember('ticket_id_' + params.id, 60, async function () {
      return await Ticket.find(params.id)
    })
    if (ticket) {
      ticket.amount = request.input('amount')
      if (await ticket.save()) {
        await Cache.update('ticket_id_' + params.id, ticket, 60)

        await ticket.preload('user')
        await ticket.preload('event')
        return ticket
      }
      return // 422
    }
    return // 401
  }

  public async store({ auth, request }: HttpContextContract) {
    const user = await auth.authenticate()
    const ticket = new Ticket()
    ticket.code = Keygen.hex(5)
    ticket.eventId = request.input('event_id')
    ticket.amount = request.input('amount')
    await user.related('tickets').save(ticket)

    await Cache.set('ticket_id_' + ticket.id, ticket, 60)
    return ticket
  }

  public async destroy({ response, auth, params }: HttpContextContract) {
    const user = await auth.authenticate()
    await Ticket.query().where('user_id', user.id).where('id', params.id).delete()
    return response.redirect('/dashboard')
  }
}

/**
 * 
 * 
  private async set(key: string, data: any, minutes: number){
        const isData = await Cache.find(key)
        if(!isData){
            await Cache.set(key, data, minutes)
            // Database Server is called from the Cache Server.
            await Database.create(data)
            return data
        }
        const updateData = await Cache.update(key, data, minutes)
        return updateData;
  }
 * 
 */
