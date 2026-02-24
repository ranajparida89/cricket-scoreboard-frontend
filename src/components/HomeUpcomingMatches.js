import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./HomeUpcomingMatches.css";
export default function HomeUpcomingMatches() {
    const [matches, setMatches] = useState([]);
    const [title, setTitle] = useState("");
    const sliderRef = useRef(null);
    useEffect(() => {
        axios.get(
            "https://cricket-scoreboard-backend.onrender.com/api/scheduler/excel/upcoming-home"
        )
            .then(res => {

                setMatches(res.data.matches || []);
                setTitle(res.data.seasonTitle || "Upcoming Matches");

            });
    }, []);
    /* AUTO SLIDE */
    useEffect(() => {
    const slider = sliderRef.current;
        if (!slider) return;
        let interval;
        const startSlide = () => {
            interval = setInterval(() => {
                slider.scrollLeft += 1;
                if (
                    slider.scrollLeft +
                    slider.clientWidth >=
                    slider.scrollWidth
                ) {

                 slider.scrollLeft = 0;
                }
            }, 30);
        };
        const stopSlide = () => clearInterval(interval);
        startSlide();
        slider.addEventListener("mouseenter", stopSlide);
        slider.addEventListener("mouseleave", startSlide);
        slider.addEventListener("touchstart", stopSlide);
        slider.addEventListener("touchend", startSlide);
        return () => stopSlide();
    }, [matches]);
    if (matches.length === 0) {
        return (
            <div className="seasonUpcomingBox">
                <h2>No Matches Pending</h2>
            </div>
        );
    }

    return (
        <div className="seasonUpcomingBox">
            <h2>
                {title}
            </h2>
            <div
                className="seasonSlider"
                ref={sliderRef}
            >
                {matches.map((m, i) => {
                const row = m.row_data;
                    return (
                        <div
                            className="seasonCard"
                            key={i}
                        >
                            <div className="badgeUpcoming">
                                UPCOMING
                            </div>
                            <div className="teamA">
                                {row["Team 1"]}
                            </div>
                            <div className="vs">
                                vs
                            </div>
                            <div className="teamB">
                                {row["Team 2"]}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}