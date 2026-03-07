import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./LiveMatchPage.css";

const API = "https://cricket-scoreboard-backend.onrender.com/api";

function LiveMatchPage() {

    const [match, setMatch] = useState(null);
    const [viewers, setViewers] = useState(0);
    const [chat, setChat] = useState([]);
    const [message, setMessage] = useState("");

    const playerRef = useRef(null);
    const chatEndRef = useRef(null);

    useEffect(() => {

        fetchLiveMatch();

        const interval = setInterval(() => {
            fetchViewers();
            fetchChat();
        }, 2000);

        return () => clearInterval(interval);

    }, []);

    useEffect(() => {

        if (match) {

            axios.post(`${API}/live-match/viewer-join`, {
                match_id: match.id,
                viewer_id: Date.now().toString()
            });

        }

    }, [match]);

    useEffect(() => {

        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

    }, [chat]);

    async function fetchLiveMatch() {

        try {

            const res = await axios.get(`${API}/live-match/live`);

            if (res.data.length > 0) {

                setMatch(res.data[0]);

                fetchViewers(res.data[0].id);
                fetchChat(res.data[0].id);

            }

        } catch (err) {
            console.error(err);
        }

    }

    async function fetchViewers(matchId) {

        if (!matchId && !match) return;

        const id = matchId || match.id;

        try {

            const res = await axios.get(`${API}/live-match/viewers/${id}`);
            setViewers(res.data.viewers);

        } catch (err) {
            console.error(err);
        }

    }

    async function fetchChat(matchId) {

        if (!matchId && !match) return;

        const id = matchId || match.id;

        try {

            const res = await axios.get(`${API}/live-match/chat/${id}`);
            setChat(res.data);

        } catch (err) {
            console.error(err);
        }

    }

    async function sendMessage() {

        if (!message.trim()) return;

        try {

            await axios.post(`${API}/live-match/chat`, {
                match_id: match.id,
                username: "Guest",
                message: message
            });

            setMessage("");

        } catch (err) {
            console.error(err);
        }

    }

    function goFullscreen() {

        if (playerRef.current) {

            if (playerRef.current.requestFullscreen) {
                playerRef.current.requestFullscreen();
            }

        }

    }

    if (!match) return <div className="no-match">No Live Match Currently Running</div>;

    return (

        <div className="live-page">

            {/* HEADER */}

            <div className="live-header">

                <div className="live-title">

                    <span className="live-badge">LIVE</span>

                    <h2>
                        {match.team1} vs {match.team2}
                    </h2>

                </div>

                <div className="match-meta">

                    <span className="match-type">
                        {match.match_type || "T20"} Match
                    </span>

                    <span className="viewer-count">
                        👁 {viewers} watching
                    </span>

                </div>

            </div>


            {/* DELAY NOTICE */}

            <div className="delay-notice">
                ⚠ Live stream may have a delay of 30-40 seconds compared to the actual match.
            </div>


            {/* MAIN CONTENT */}

            <div className="live-main">

                {/* STREAM */}

                <div className="player-section">

                    <div className="video-container" ref={playerRef}>

                        <iframe
                            title="Live Stream"
                            src={match.embed_url}
                            allow="autoplay"
                            allowFullScreen
                        />

                    </div>

                    <div className="player-controls">

                        <button
                            className="btn fullscreen"
                            onClick={goFullscreen}
                        >
                            Fullscreen
                        </button>

                        <button
                            className="btn end-match"
                            onClick={async () => {

                                try {

                                    await axios.post(`${API}/live-match/end/${match.id}`);

                                    alert("Match Ended Successfully");

                                    window.location.reload();

                                } catch (err) {
                                    console.error(err);
                                }

                            }}
                        >
                            End Match
                        </button>

                    </div>


                    {/* MATCH INFO */}

                    <div className="match-info">

                        <h3>Match Information</h3>

                        <div className="info-row">
                            <span>Teams</span>
                            <span>{match.team1} vs {match.team2}</span>
                        </div>

                        <div className="info-row">
                            <span>Match Type</span>
                            <span>{match.match_type || "T20"}</span>
                        </div>

                        <div className="info-row">
                            <span>Status</span>
                            <span className="live-status">Live</span>
                        </div>

                    </div>

                </div>


                {/* CHAT */}

                <div className="chat-section">

                    <h3>Live Chat</h3>

                    <div className="chat-box">

                        {chat.map((c, i) => (

                            <div key={i} className="chat-message">
                                <strong>{c.username}</strong>: {c.message}
                            </div>

                        ))}

                        <div ref={chatEndRef}></div>

                    </div>

                    <div className="chat-input">

                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type message..."
                        />

                        <button onClick={sendMessage}>
                            Send
                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default LiveMatchPage;