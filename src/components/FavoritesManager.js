// src/components/FavoritesManager.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FavoritesManager = ({ userId }) => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    // Fetch players, teams, and user's favorites
    const fetchData = async () => {
      try {
        const [playersRes, teamsRes, favoritesRes] = await Promise.all([
          axios.get('/api/players'),
          axios.get('/api/teams'),
          axios.get(`/api/favorites?userId=${userId}`)
        ]);

        setPlayers(playersRes.data);
        setTeams(teamsRes.data);
        setFavorites(favoritesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [userId]);

  const isFavorited = (itemId, itemType) => {
    return favorites.some(
      (fav) => fav.itemId === itemId && fav.itemType === itemType
    );
  };

  const handleFavoriteToggle = async (itemId, itemType) => {
    try {
      if (isFavorited(itemId, itemType)) {
        // Remove from favorites
        await axios.delete('/api/favorites', {
          data: { userId, itemId, itemType }
        });
        setFavorites((prev) =>
          prev.filter(
            (fav) => !(fav.itemId === itemId && fav.itemType === itemType)
          )
        );
      } else {
        // Add to favorites
        await axios.post('/api/favorites', { userId, itemId, itemType });
        setFavorites((prev) => [...prev, { itemId, itemType }]);
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  return (
    <div>
      <h2>Teams</h2>
      <ul>
        {teams.map((team) => (
          <li key={team.id}>
            {team.name}
            <button
              onClick={() => handleFavoriteToggle(team.id, 'team')}
            >
              {isFavorited(team.id, 'team') ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>
          </li>
        ))}
      </ul>

      <h2>Players</h2>
      <ul>
        {players.map((player) => (
          <li key={player.id}>
            {player.name}
            <button
              onClick={() => handleFavoriteToggle(player.id, 'player')}
            >
              {isFavorited(player.id, 'player') ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FavoritesManager;
