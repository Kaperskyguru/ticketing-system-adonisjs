/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes/index.ts` as follows
|
| import './cart'
| import './customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.group(() => {
    Route.post('register', 'AuthController.register')
    Route.post('login', 'AuthController.login')
  }).prefix('auth')

  Route.get('events', 'EventsController.index')
  Route.group(() => {
    Route.get('tickets/nocache', 'TicketsController.indexWithoutCache')
    Route.resource('events', 'EventsController').apiOnly().except(['index'])
    Route.resource('tickets', 'TicketsController').apiOnly()
    Route.get('users/:id/events', 'EventsController.userevents')
    Route.post('events/buy/:id', 'EventsController.buy')
    Route.post('events/join/:id', 'EventsController.join')
  }) //.middleware('auth:api')
}).prefix('api/v1')
