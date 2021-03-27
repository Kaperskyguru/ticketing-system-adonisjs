import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Ticket from 'App/Models/Ticket'
const Keygen = require('keygen')

export default class TicketsController {
  public async index({}: HttpContextContract) {
    const tickets = await Ticket.query().preload('user').preload('event')
    return tickets
  }
  public async show({ params }: HttpContextContract) {
    try {
      const ticket = await Ticket.find(params.id)
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
    const ticket = await Ticket.find(params.id)
    if (ticket) {
      ticket.amount = request.input('amount')
      if (await ticket.save()) {
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
    return ticket
  }
  public async destroy({ response, auth, params }: HttpContextContract) {
    const user = await auth.authenticate()
    await Ticket.query().where('user_id', user.id).where('id', params.id).delete()
    return response.redirect('/dashboard')
  }
}
