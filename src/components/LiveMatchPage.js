import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./LiveMatchPage.css";

const API = "https://cricket-scoreboard-backend.onrender.com/api";

function LiveMatchPage() {

    const [match, setMatch] = useState(null);
    const [viewers, setViewers] = useState(0);
    const [chat, setChat] = useState([]);
    const [message, setMessage] = useState("");

    const [team1, setTeam1] = useState("");
    const [team2, setTeam2] = useState("");
    const [matchType, setMatchType] = useState("T20");
    const [streamURL, setStreamURL] = useState("");

    const playerRef = useRef(null);

    useEffect(() => {

        fetchLiveMatch();

        const interval = setInterval(() => {

            if (match) {
                fetchViewers();
                fetchChat();
            }

        }, 5000); // reduced server load

        return () => clearInterval(interval);

    }, [match]);



    /* JOIN VIEWER ONLY ONCE PER BROWSER */

    useEffect(() => {

        if (!match) return;

        const existingViewer = sessionStorage.getItem("viewer_id");

        if (!existingViewer) {

            const viewerId = Date.now().toString();

            sessionStorage.setItem("viewer_id", viewerId);

            axios.post(`${API}/live-match/viewer-join`, {
                match_id: match.id,
                viewer_id: viewerId
            });

        }

    }, [match]);



    /* AUTO SCROLL CHAT BOX ONLY */

    useEffect(() => {

        const chatBox = document.querySelector(".chat-box");

        if (chatBox) {
            chatBox.scrollTop = chatBox.scrollHeight;
        }

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

        const id = matchId || match?.id;
        if (!id) return;

        try {

            const res = await axios.get(`${API}/live-match/viewers/${id}`);
            setViewers(res.data.viewers);

        } catch (err) {
            console.error(err);
        }

    }



    async function fetchChat(matchId) {

        const id = matchId || match?.id;
        if (!id) return;

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
                message
            });

            setMessage("");

        } catch (err) {
            console.error(err);
        }

    }



    async function startLiveMatch() {

        if (!team1 || !team2 || !streamURL) {

            alert("Please fill all fields");
            return;

        }

        try {

            await axios.post(`${API}/live-match/start`, {
                team1,
                team2,
                match_type: matchType,
                embed_url: streamURL
            });

            alert("Live Match Started");

            fetchLiveMatch();

        } catch (err) {
            console.error(err);
        }

    }



    function goFullscreen() {

        if (playerRef.current) {
            playerRef.current.requestFullscreen();
        }

    }



    return (

        <div className="live-page">

            {/* START LIVE MATCH FORM */}

            <div className="start-live-container">

                <h2>Start Live Match</h2>

                <input
                    placeholder="Team 1"
                    value={team1}
                    onChange={(e) => setTeam1(e.target.value)}
                />

                <input
                    placeholder="Team 2"
                    value={team2}
                    onChange={(e) => setTeam2(e.target.value)}
                />

                <select
                    value={matchType}
                    onChange={(e) => setMatchType(e.target.value)}
                >
                    <option>T20</option>
                    <option>ODI</option>
                    <option>TEST</option>
                </select>

                <input
                    placeholder="YouTube / Twitch Embed URL"
                    value={streamURL}
                    onChange={(e) => setStreamURL(e.target.value)}
                />

                <button
                    className="start-btn"
                    onClick={startLiveMatch}
                >
                    Start Live Match
                </button>

            </div>



            {/* LIVE PLAYER */}

            {match && (

                <>

                    <div className="live-header">

                        <div className="live-title">

                            <span className="live-badge">LIVE</span>

                            <h2>{match.team1} vs {match.team2}</h2>

                        </div>

                        <div className="match-meta">

                            <span className="match-type">{match.match_type}</span>

                            <span className="viewer-count">
                                👁 {viewers} watching
                            </span>

                        </div>

                    </div>



                    <div className="delay-notice">
                        ⚠ Live stream may have a delay of 30-40 seconds compared to the actual match.
                    </div>



                    <div className="live-main">

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

                                        await axios.post(`${API}/live-match/end/${match.id}`);

                                        window.location.reload();

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
                                        <strong>{c.username}</strong>: {c.message}
                                    </div>

                                ))}

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

                </>

            )}

        </div>

    );

}

export default LiveMatchPage;