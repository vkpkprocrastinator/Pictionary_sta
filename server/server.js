const io = require('socket.io')(3000, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const rooms = {}; // Estructura para almacenar jugadores, turnos, puntos y películas
const canvasHistory = {}; // Estructura para almacenar el historial de dibujo por sala

io.on('connection', (socket) => {
  console.log('Jugador conectado', socket.id);

  // Unirse a una sala específica
  socket.on('joinRoom', (roomCode, username) => {
    socket.join(roomCode);

    // Inicializar la sala si no existe
    if (!rooms[roomCode]) {
      rooms[roomCode] = { players: [], turn: 0, points: {}, currentMovie: null };
      canvasHistory[roomCode] = []; // Inicializar historial de dibujo para la nueva sala
    }

    // Añadir el jugador a la sala
    rooms[roomCode].players.push({ id: socket.id, username });
    rooms[roomCode].points[username] = 0; // Inicializar puntos del jugador
    console.log(`Jugador ${username} se unió a la sala ${roomCode}`);

    // Enviar el historial de dibujo al nuevo usuario si hay datos almacenados
    if (canvasHistory[roomCode].length > 0) {
      socket.emit('historialDibujo', canvasHistory[roomCode]);
    }

    if (rooms[roomCode].players.length >= 2) {
      // Notificar a los jugadores en la sala que pueden empezar a jugar
      const currentPlayer = rooms[roomCode].players[rooms[roomCode].turn];
      io.to(roomCode).emit('readyToPlay', currentPlayer.username);
    } else {
      socket.emit('waitingForPlayers');
    }

    // Enviar los puntos iniciales al jugador
    socket.emit('updatePoints', { points: rooms[roomCode].points });
  });

  // Manejar selección de película
  socket.on('startDrawing', ({ roomCode, movie }) => {
    const room = rooms[roomCode];
    if (room) {
      room.currentMovie = movie; // Guardar la película seleccionada
    }
  });

  // Enviar los datos de dibujo solo a la sala correspondiente
  socket.on('dibujar', (data) => {
    const { roomCode, x, y, color, lineWidth, newPath, username } = data;

    // Validar que sea el turno del jugador que está dibujando
    const currentTurnPlayer = rooms[roomCode].players[rooms[roomCode].turn];
    if (currentTurnPlayer && currentTurnPlayer.username === username) {
      // Añadir el nuevo trazo al historial de la sala
      canvasHistory[roomCode].push({ x, y, color, lineWidth, newPath });
      socket.to(roomCode).emit('actualizarDibujo', { x, y, color, lineWidth, newPath });
    }
  });

  // Manejar limpieza de la pizarra
  socket.on('limpiarPizarra', ({ roomCode }) => {
    if (canvasHistory[roomCode]) {
      canvasHistory[roomCode] = []; // Vaciar el historial de la sala
      io.in(roomCode).emit('limpiarPizarra'); // Notificar a todos los usuarios
    }
  });

  // Manejar envío de mensajes de chat
  socket.on('sendMessage', (data) => {
    const { roomCode, username, message } = data;
    const room = rooms[roomCode];

    if (room && room.currentMovie) {
      // Validar si el mensaje coincide con la película actual
      if (message.toLowerCase().trim() === room.currentMovie.Title.toLowerCase().trim()) {
        // Incrementar puntos del jugador
        room.points[username] = (room.points[username] || 0) + 1;

        // Notificar a todos los jugadores que alguien adivinó
        io.to(roomCode).emit('playerGuessed', {
          username,
          movie: room.currentMovie.Title,
          points: room.points,
        });

        // Cambiar turno al siguiente jugador
        room.turn = (room.turn + 1) % room.players.length;
        const nextPlayer = room.players[room.turn];
        room.currentMovie = null; // Reiniciar película
        io.to(roomCode).emit('readyToPlay', nextPlayer.username);
      } else {
        // Si no coincide, enviar el mensaje a todos los jugadores
        io.in(roomCode).emit('newMessage', { username, message });
      }
    } else {
      io.in(roomCode).emit('newMessage', { username, message });
    }
  });

  // Manejar desconexión de jugadores
  socket.on('disconnect', () => {
    console.log('Jugador desconectado', socket.id);
    Object.keys(rooms).forEach((roomCode) => {
      const room = rooms[roomCode];
      if (room) {
        const playerIndex = room.players.findIndex((p) => p.id === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          delete room.points[socket.id];
          if (room.players.length === 0) {
            delete rooms[roomCode];
            delete canvasHistory[roomCode];
          }
        }
      }
    });
  });
});

console.log('Servidor de Websockets iniciado en el puerto 3000');
