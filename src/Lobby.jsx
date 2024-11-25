import React, { useState } from 'react';

const Lobby = ({ onJoinGame, onCreateGame }) => {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');

  // Función para unirse a una partida existente
  const handleJoinGame = () => {
    if (username && roomCode) {
      onJoinGame(username, roomCode);
    } else {
      alert('Por favor, ingresa un nombre y un código de sala.');
    }
  };

  // Función para crear una nueva partida
  const handleCreateGame = () => {
    if (username) {
      onCreateGame(username);
    } else {
      alert('Por favor, ingresa un nombre.');
    }
  };

  return (
    <div>
      <h2>Sala de Entrada</h2>
      <input
        type="text"
        placeholder="Ingresa tu nombre"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <br />
      <input
        type="text"
        placeholder="Código de sala (para unirse)"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value)}
      />
      <br />
      <button onClick={handleJoinGame}>Unirse a la Partida</button>
      <button onClick={handleCreateGame}>Crear Nueva Partida</button>
    </div>
  );
};

export default Lobby;