import React, { useEffect, useState } from 'react';

const API_KEY = '5d1759b5';

const RandomMovies = ({ onSelectMovie }: { onSelectMovie: (movie: any) => void }) => {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  console.log('Componente RandomMovies cargado');


  useEffect(() => {
    const fetchMovies = async () => {
      const keywords = ['love', 'adventure', 'space', 'fantasy', 'mystery', 'hero', 'comedy', 'thriller'];
      const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
      const apiUrl = `https://www.omdbapi.com/?apikey=${API_KEY}&s=${randomKeyword}&type=movie`;

      console.log('URL generada:', apiUrl);


      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        console.log('Datos obtenidos:', data);

        
      } catch (error) {
        console.error('Error al obtener películas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading) {
    return <div>Cargando películas...</div>;
  }

  if (movies.length === 0) {
    return (
      <div>
        <div>No se encontraron películas. Intenta nuevamente.</div>
        <button onClick={() => window.location.reload()}>Buscar de nuevo</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Selecciona una película para dibujar:</h2>
      <ul>
        {movies.map((movie, index) => (
          <li key={index} onClick={() => onSelectMovie(movie)}>
            {movie.Title} ({movie.Year})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RandomMovies;
