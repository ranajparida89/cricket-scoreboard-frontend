// MatchStory.js
import React, { useEffect, useState } from "react";
import "./MatchStory.css"; 
import { FaRegNewspaper } from "react-icons/fa";

const MatchStory = () => {
  const [matchStories, setMatchStories] = useState([]);

useEffect(() => {
  const fetchStories = async () => {
    try {
      const response = await fetch("https://cricket-scoreboard-backend.onrender.com/api/match-stories");
      const data = await response.json();
      setMatchStories(data);
    } catch (error) {
      console.error("Failed to fetch match stories:", error);
    }
  };

  fetchStories();
}, []);


  return (
    <div className="match-story-container">
      <h2 className="match-story-heading">
        <FaRegNewspaper className="me-2" /> Match Story Generator 📝
      </h2>

      <div className="match-story-list">
        {matchStories.map((story) => (
          <div key={story.id} className="match-story-card">
            <div className="match-story-date">
              📅 {new Date(story.date).toLocaleDateString()}
            </div>
            <div className="match-story-type">📌 {story.type} Match</div>
            <div className="match-story-title">⚔️ {story.title}</div>
            <div className="match-story-text">{story.story}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchStory;
