// Block here to get username.
if (!sessionStorage.getItem('chet-rum-username')) {
  let username
  while ((username = prompt('Input your username...')).trim() === '');
  sessionStorage.setItem('chet-rum-username', username)
}

// WebSocket link.
const SERVER_URL = 'http://localhost:3000'
const sio = io(SERVER_URL)
sio.on('connect', () => {
  // Login.
  sio.emit('newJoin', { username: sessionStorage.getItem('chet-rum-username') })
  document.getElementById('msgSendBtn').onclick = function () {
    let content = document.getElementById('msgInput').value
    if (content.trim() !== '') {
      sio.emit('newMsg', { username: sessionStorage.getItem('chet-rum-username'), content })
    }
  }
  // Update DOM when new message comes.
  sio.on('broadcastMsg', ({ username, content }) => {
    let newLi = document.createElement('li')
    // Avoid XSS.
    newLi.innerText = `[${username}]: ${content}`
    document.getElementById('msgList').appendChild(newLi)
  })
  // Update DOM for initial user list.
  sio.on('initUserList', users => {
    users.forEach(user => {
      let newLi = document.createElement('li')
      newLi.innerText = `${user}`
      document.getElementById('userList').appendChild(newLi)
    })
  })
  // Update DOM for other user's join.
  sio.on('newUserJoin', username => {
    let newLi = document.createElement('li')
    newLi.innerText = `${username}`
    document.getElementById('userList').appendChild(newLi)
  })
})