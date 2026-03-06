import React, { useEffect, useState } from "react";
import axios from "axios";
import "./LiveMatchPage.css";

const API = "https://cricket-scoreboard-backend.onrender.com/api";

function LiveMatchPage() {

    const [match, setMatch] = useState(null);
    const [viewers, setViewers] = useState(0);
    const [chat, setChat] = useState([]);
    const [message, setMessage] = useState("");

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

    if (!match) return <div className="no-match">No Live Match</div>;

    return (

        <div className="live-match-container">

            <div className="live-header">
                <span className="live-badge">LIVE</span>
                <div className="match-header">

                    <span className="live-badge">LIVE</span>

                    <h2>{match.team1} vs {match.team2}</h2>

                    <span className="viewer-count">
                        👁 {viewers}
                    </span>

                </div>
                <span className="viewer-count">👁 {viewers}</span>
            </div>

            <div className="live-stream">

                <iframe
                    title="Live Stream"
                    src={match.embed_url}
                    allow="autoplay"
                    allowFullScreen
                    style={{
                        width: "100%",
                        maxWidth: "1000px",
                        height: "550px",
                        border: "none",
                        borderRadius: "10px"
                    }}
                />

                <div style={{
                    marginTop: "10px",
                    display: "flex",
                    gap: "10px"
                }}>

                    <button
                        onClick={() => {
                            const iframe = document.querySelector(".live-stream iframe");
                            if (iframe) {
                                iframe.requestFullscreen();
                            }
                        }}
                        style={{
                            padding: "8px 15px",
                            background: "#00bcd4",
                            border: "none",
                            color: "white",
                            borderRadius: "5px",
                            cursor: "pointer"
                        }}
                    >
                        Fullscreen
                    </button>

                    <button
                        onClick={async () => {

                            try {

                                await axios.post(`${API}/live-match/end/${match.id}`);

                                alert("Match Ended Successfully");

                                window.location.reload();

                            } catch (err) {
                                console.error(err);
                            }

                        }}
                        style={{
                            padding: "8px 15px",
                            background: "red",
                            border: "none",
                            color: "white",
                            borderRadius: "5px",
                            cursor: "pointer"
                        }}
                    >
                        End Match
                    </button>

                </div>

            </div>

            <div className="chat-section">

                <h3>Live Chat</h3>

                <div className="chat-box">

                    {chat.map((c, i) => (
                        <div key={i} className="chat-message">
                            <strong>{c.username}:</strong> {c.message}
                        </div>
                    ))}

                </div>

                <div className="chat-input">

                    <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type message"
                    />

                    <button onClick={sendMessage}>
                        Send
                    </button>

                </div>

            </div>

        </div>

    );

}

export default LiveMatchPage;