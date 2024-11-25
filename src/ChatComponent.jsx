import React, { useState, useEffect } from 'react';

const ChatComponent = ({ socket, roomCode, username, isTurn }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Escuchar los mensajes recibidos
    socket.on('newMessage', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      socket.off('newMessage');
    };
  }, [socket]);

  // Manejar el envío de mensajes
  const handleSendMessage = () => {
    if (message.trim() !== '' && !isTurn) {
      const data = {
        roomCode,
        username,
        message,
      };
      socket.emit('sendMessage', data);
      setMessage('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Mostrar mensajes */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#f0f0f0',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '10px',
        }}
      >
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.username}:</strong> {msg.message}
          </div>
        ))}
      </div>

      {/* Input para escribir mensajes */}
      {!isTurn && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Escribe un mensaje..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              marginRight: '10px',
            }}
          />
          <button onClick={handleSendMessage} style={{ padding: '10px' }}>
            Enviar
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatComponent;