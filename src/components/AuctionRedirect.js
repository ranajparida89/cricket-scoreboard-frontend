import React, { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "https://cricket-scoreboard-backend.onrender.com";

export default function AuctionRedirect() {

    const navigate = useNavigate();

    useEffect(() => {
        fetchLatestAuction();
    }, []);

    const fetchLatestAuction = async () => {
        try {
            const res = await axios.get(
                `${API}/api/player-auction/latest`
            );

            if (res.data.success) {
                navigate(`/player-auction/${res.data.id}`);
            }

        } catch (error) {
            console.error("Failed to load latest auction", error);
        }
    };

    return (
        <div style={{ padding: "40px", textAlign: "center" }}>
            <h3>Loading Auction...</h3>
        </div>
    );
}
