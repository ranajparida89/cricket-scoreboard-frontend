import React, { useEffect, useState } from "react";
import axios from "axios";
import "./HomeUpcomingMatches.css";
export default function HomeUpcomingMatches() {
    const [matches, setMatches] = useState([]);
    const [pending, setPending] = useState(0);
    useEffect(() => {
        axios.get(
            "https://cricket-scoreboard-backend.onrender.com/api/scheduler/excel/upcoming-home"
        )
            .then(res => {
                setMatches(res.data.matches || []);
                setPending(res.data.totalPending || 0);
            });
    }, []);
    return (
        <div className="homeUpcomingBox">
            <h2>
                Upcoming Matches
            </h2>
            {pending === 0 ? (

                <div className="noMatches">
                    No Matches Pending
                </div>
            ) : (
                <div className="upcomingSlider">
                    {matches.map((m, i) => {
                        const row = m.row_data;
                        return (
                            <div className="upcomingCard" key={i}>
                                <div className="upcomingBadge">
                                    UPCOMING
                                </div>
                                <div className="teamA">
                                    {row["Team 1"]}
                             </div>
                                <div className="vsText">
                                    VS
                                </div>
                                <div className="teamB">
                                    {row["Team 2"]}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}