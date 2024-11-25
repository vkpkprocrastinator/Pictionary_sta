import React, { useState, useEffect } from 'react';
import CanvasComponent from './CanvasComponent';
import ChatComponent from './ChatComponent'; // Importa el componente de chat
import io from 'socket.io-client';
import Lobby from './Lobby';

const socket = io('http://localhost:3000');

// Función para generar un código de sala
function generateRoomCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

const API_KEY = '5d1759b5'; // Sustituye 'tu_api_key' con tu clave real de la API OMDb.

function App() {
  const [dibujo, setDibujo] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [isInGame, setIsInGame] = useState(false);
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [waitingForPlayers, setWaitingForPlayers] = useState(true);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [movies, setMovies] = useState([]); // Películas obtenidas
  const [selectedMovie, setSelectedMovie] = useState(null); // Película seleccionada
  const [loadingMovies, setLoadingMovies] = useState(false); // Estado de carga de películas
  const [error, setError] = useState(''); // Estado de errores
  const [points, setPoints] = useState({}); // Puntos de los jugadores

  useEffect(() => {
    socket.on('actualizarDibujo', (data) => {
      setDibujo((prevDibujo) => [...prevDibujo, data]);
    });

    socket.on('historialDibujo', (historialRecibido) => {
      setHistorial(historialRecibido);
      setDibujo(historialRecibido);
    });

    socket.on('readyToPlay', (firstPlayer) => {
      setWaitingForPlayers(false);
      setCurrentTurn(firstPlayer);
    });

    socket.on('waitingForPlayers', () => {
      setWaitingForPlayers(true);
    });

    socket.on('limpiarPizarra', () => {
      setHistorial([]);
      setDibujo([]);
    });

    socket.on('updatePoints', ({ points }) => {
      setPoints(points);
    });

    return () => {
      socket.off('actualizarDibujo');
      socket.off('historialDibujo');
      socket.off('readyToPlay');
      socket.off('waitingForPlayers');
      socket.off('limpiarPizarra');
      socket.off('updatePoints');
    };
  }, []);

  useEffect(() => {
    socket.on('playerGuessed', ({ username, movie, points }) => {
      alert(`${username} adivinó correctamente la película: ${movie}`);
      setPoints(points);
    });

    return () => {
      socket.off('playerGuessed');
    };
  }, []);

  const handleDibujo = (data) => {
    if (data.limpiar) {
      socket.emit('limpiarPizarra', { roomCode });
    } else {
      socket.emit('dibujar', { ...data, roomCode, username });
    }
  };

  const joinGame = (username, roomCode) => {
    setUsername(username);
    setRoomCode(roomCode);
    setIsInGame(true);
    socket.emit('joinRoom', roomCode, username);
  };

  const createGame = async (username) => {
    const newRoomCode = generateRoomCode();
    setUsername(username);
    setRoomCode(newRoomCode);
    setIsInGame(true);
    socket.emit('joinRoom', newRoomCode, username);
    await fetchMovies();
  };

  const fetchMovies = async () => {
    setLoadingMovies(true);
    setError('');
    const keywords = ['love', 'adventure', 'mystery', 'thriller', 'space', 'comedy', 'fantasy', 'hero'];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    const apiUrl = `https://www.omdbapi.com/?apikey=${API_KEY}&s=${randomKeyword}&type=movie`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.Search && data.Search.length >= 3) {
        const randomMovies = data.Search.sort(() => 0.5 - Math.random()).slice(0, 3);
        setMovies(randomMovies);
      } else {
        setError('No se encontraron suficientes películas.');
        setMovies([]);
      }
    } catch (error) {
      console.error('Error al obtener películas:', error);
      setError('Ocurrió un error al cargar películas. Inténtalo de nuevo.');
      setMovies([]);
    } finally {
      setLoadingMovies(false);
    }
  };

  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie);
    socket.emit('startDrawing', { roomCode, movie });
  };

  const leaveGame = () => {
    setIsInGame(false);
    setRoomCode('');
    setDibujo([]);
    setHistorial([]);
    setMovies([]);
    setSelectedMovie(null);
    setWaitingForPlayers(true);
    setCurrentTurn(null);
    socket.emit('leaveRoom', roomCode);
  };

  return (
    <div>
      {isInGame ? (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <div style={{ flex: 2 }}>
            <h1>Partida en Sala: {roomCode}</h1>
            <h2>Puntajes:</h2>
            <ul>
              {Object.entries(points).map(([player, score]) => (
                <li key={player}>
                  {player}: {score} puntos
                </li>
              ))}
            </ul>
            {waitingForPlayers ? (
              <div>Esperando a más jugadores...</div>
            ) : (
              <div>
                <h2>Turno de: {currentTurn}</h2>
                {currentTurn === username && !selectedMovie ? (
                  <div>
                    <h2>Selecciona una película para dibujar:</h2>
                    {loadingMovies ? (
                      <p>Cargando películas...</p>
                    ) : error ? (
                      <p style={{ color: 'red' }}>{error}</p>
                    ) : (
                      <div>
                        <ul>
                          {movies.map((movie, index) => (
                            <li
                              key={index}
                              onClick={() => handleSelectMovie(movie)}
                              style={{
                                cursor: 'pointer',
                                fontWeight: selectedMovie?.Title === movie.Title ? 'bold' : 'normal',
                                color: selectedMovie?.Title === movie.Title ? 'blue' : 'black',
                              }}
                            >
                              {movie.Title} ({movie.Year})
                            </li>
                          ))}
                        </ul>
                        <button onClick={fetchMovies} style={{ marginTop: '10px' }}>
                          Refrescar películas
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {selectedMovie && (
                      <h3>
                        Estás dibujando: {selectedMovie.Title} ({selectedMovie.Year})
                      </h3>
                    )}
                    <CanvasComponent
                      onDibujo={currentTurn === username ? handleDibujo : null}
                      dibujosExternos={dibujo}
                      historial={historial}
                      username={username}
                      isTurnActive={currentTurn === username}
                    />
                  </>
                )}
              </div>
            )}
          </div>
          {!waitingForPlayers && (
            <div style={{ flex: 1, marginLeft: '20px' }}>
              <ChatComponent
                socket={socket}
                roomCode={roomCode}
                username={username}
                isTurn={currentTurn === username}
              />
              <button onClick={leaveGame} style={{ marginTop: '20px' }}>
                Salir de la sala
              </button>
            </div>
          )}
        </div>
      ) : (
        <Lobby onJoinGame={joinGame} onCreateGame={createGame} />
      )}
    </div>
  );
}

export default App;
