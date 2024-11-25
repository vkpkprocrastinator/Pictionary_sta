const io = require('socket.io')(3000, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const rooms = {};  // Estructura para almacenar jugadores y turnos por sala
const canvasHistory = {};  // Estructura para almacenar el historial de dibujo por sala

io.on('connection', (socket) => {
  console.log('Jugador conectado', socket.id);

  // Unirse a una sala específica
  socket.on('joinRoom', (roomCode, username) => {
    socket.join(roomCode);
    
    // Inicializar la sala si no existe
    if (!rooms[roomCode]) {
      rooms[roomCode] = { players: [], turn: 0 };
      canvasHistory[roomCode] = [];  // Inicializar historial de dibujo para la nueva sala
    }

    // Añadir el jugador a la sala
    rooms[roomCode].players.push({ id: socket.id, username });
    console.log(`Jugador ${username} se unió a la sala ${roomCode}`);

    // Enviar el historial de dibujo al nuevo usuario si hay datos almacenados
    if (canvasHistory[roomCode].length > 0) {
      socket.emit('historialDibujo', canvasHistory[roomCode]);
    }

    if (rooms[roomCode].players.length >= 2) {
      // Notificar a los jugadores en la sala que pueden empezar a jugar
      io.to(roomCode).emit('readyToPlay', rooms[roomCode].players[rooms[roomCode].turn].username);
    } else {
      socket.emit('waitingForPlayers');
    }
  });

  // Enviar los datos de dibujo solo a la sala correspondiente y gestionar turnos
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

  // Manejar la limpieza de la pizarra por parte de un usuario
  socket.on('limpiarPizarra', ({ roomCode }) => {
    if (canvasHistory[roomCode]) {
      canvasHistory[roomCode] = [];  // Vaciar el historial de la sala
      io.in(roomCode).emit('limpiarPizarra');  // Notificar a todos los usuarios que limpien la pizarra
    }
  });

  // Manejar el envío de mensajes de chat
  socket.on('sendMessage', (data) => {
    const { roomCode, username, message } = data;
    io.in(roomCode).emit('newMessage', { username, message });  // Enviar el mensaje a todos los usuarios de la sala
  });
  
  socket.on('disconnect', () => {
    console.log('Jugador desconectado', socket.id);
  });
});

console.log('Servidor de Websockets iniciado en el puerto 3000');