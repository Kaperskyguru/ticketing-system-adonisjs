import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Event from 'App/Models/Event'
import User from 'App/Models/User'
import Ticket from 'App/Models/Ticket'
import UserEvent from 'App/Models/UserEvent'
import { DateTime } from 'luxon'
const Keygen = require('keygen')

export default class EventsController {
  public async index({}: HttpContextContract) {
    const events = await Event.query().preload('user').preload('tickets')
    return events
  }
  public async show({ params }: HttpContextContract) {
    try {
      const event = await Event.find(params.id)
      if (event) {
        await event.preload('user')
        await event.preload('tickets')
        return event
      }
    } catch (error) {
      console.log(error)
    }
  }

  public async update({ request, params }: HttpContextContract) {
    const event = await Event.find(params.id)
    if (event) {
      event.title = request.input('title')
      event.description = request.input('description')
      event.date = request.input('date')
      event.ticket_price = request.input('ticket_date')
      if (await event.save()) {
        await event.preload('user')
        await event.preload('tickets')
        return event
      }
      return // 422
    }
    return // 401
  }

  public async store({ auth, request }: HttpContextContract) {
    const user = await auth.authenticate()
    const event = new Event()
    event.title = request.input('title')
    event.description = request.input('description')
    event.date = request.input('date')
    event.ticket_price = request.input('ticket_date')
    await user.related('events').save(event)
    return event
  }
  public async destroy({ response, auth, params }: HttpContextContract) {
    const user = await auth.authenticate()
    await Event.query().where('user_id', user.id).where('id', params.id).delete()
    return response.redirect('/dashboard')
  }

  public async join({ params, auth, response }: HttpContextContract) {
    // Check if user already join event
    const user = await auth.authenticate()
    const ticket = await Ticket.query()
      .where('user_id', user.id)
      .where('code', params.code)
      .where('event_id', params.id)
      .first()

    if (!ticket) {
      // Throw Ticket not found exception
      return response.json({ message: 'Ticket code not valid' })
    }

    if (ticket && ticket.is_used && ticket.used_date <= DateTime.now()) {
      // throw Used_ticket_Error
      return response.json({ message: 'Ticket already used' })
    }

    const joinEvent = new UserEvent()
    joinEvent.user_id = user.id
    joinEvent.event_id = params.id

    ticket.is_used = true
    ticket.used_date = DateTime.now()

    if (joinEvent.save() && ticket.save()) {
      // Send Success Response
      return response
        .status(200)
        .json({ message: "You've joined event with id: " + params.id + ' successfully' })
    }
    return response.status(500).json({ message: 'Internal Server Error, Please try again' })
  }

  public async buy({ request, params, response }: HttpContextContract) {
    // Find Event
    const event = await this.findEvent(params.id)
    if (event === null) {
      return response.status(404).json({ message: 'Event is not valid' })
    }

    // Check if price matches
    if (event.ticket_price !== request.input('amount')) {
      const message =
        'Ticket with id: ' +
        event.id +
        ' and amount: ' +
        event.ticket_price +
        ' does not equal to User amount: ' +
        request.input('amount')
      return response.status(422).json({ message })
    }

    const ticket = new Ticket()
    ticket.user_id = request.input('user_id')
    ticket.event_id = event.id
    ticket.amount = request.input('amount')
    ticket.code = Keygen.hex(5)

    if (ticket.save()) {
      // Send User Email, Send Code
      await User.find(request.input('user_id'))
      // user.notifyNow(new TicketNotification(ticket, event));
      return response
        .status(200)
        .json({ message: 'Payment for event with id: ' + event.id + ' was successful' })
    }

    return response.status(500).json({ message: 'Internal Server Error, Please try again' })
  }

  private async findEvent(id: number): Promise<Event | null> {
    try {
      const event = await Event.find(id)
      if (event) {
        await event.preload('user')
        await event.preload('tickets')
        return event
      }
    } catch (error) {
      console.log(error)
    }
    return null
  }
}
