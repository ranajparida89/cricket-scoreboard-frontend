// MatchStory.js
import React, { useEffect, useState } from "react";
// import "./MatchStory.css"; // We’ll create this next
import { FaRegNewspaper } from "react-icons/fa";

const MatchStory = () => {
  const [matchStories, setMatchStories] = useState([]);

  // Placeholder: We'll fetch real data from backend later
  useEffect(() => {
    const dummyData = [
      {
        id: 1,
        title: "India vs Pakistan",
        type: "ODI",
        story: "India defeated Pakistan by 45 runs in a high-voltage ODI clash. Batting first, India posted 287/6, led by Rohit Sharma’s 102. In response, Pakistan fell short despite Babar Azam’s valiant 89.",
        date: "2025-05-12",
      },
      {
        id: 2,
        title: "Australia vs England",
        type: "T20",
        story: "England chased down 192 with 2 balls to spare. Jos Buttler scored a fiery 74 off 38 balls. Earlier, Australia had set a strong total thanks to Warner’s 60.",
        date: "2025-05-10",
      },
    ];
    setMatchStories(dummyData);
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
