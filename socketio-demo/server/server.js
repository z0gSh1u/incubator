/**
 * Node.js backend for chet-rum.
 * by z0gSh1u @ 2020-04
 */

const path = require('path')
const express = require('express')
const app = express()
app.use(express.static(path.join(__dirname, '../view')))
const http = require('http').createServer(app)
const sio = require('socket.io')(http)

let userSockets = [] // { username, socket }[]
sio.on('connection', socket => {

  /**
   * Login process.
   */
  socket.on('newJoin', ({ username }) => {
    let found = false
    for (let i = 0; i < userSockets.length; i++) {
      if (userSockets[i].username == username) {
        userSockets[i].socket = socket
        found = true
        console.log('[newJoin] Old user: ' + username)
        break
      }
    }
    if (!found) {
      userSockets.push({ username, socket })
      console.log('[newJoin] New user: ' + username)
      // Tell other clients new user's name.
      socket.broadcast.emit('newUserJoin', username)
    }
    // Tell this client current users.
    let currentUsers = userSockets.map(v => v.username)
    socket.emit('initUserList', currentUsers)
  })

  /**
   * A new message from client is sent. Broadcast it.
   */
  socket.on('newMsg', ({ username, content }) => {
    sio.emit('broadcastMsg', { username, content })
    console.log('[newMsg] Broadcast.')
  })

})

/**
 * Server start.
 */
http.listen(3000, () => {
  console.log('Listening Port 3000.')
})