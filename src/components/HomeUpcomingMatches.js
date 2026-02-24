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
            <div className="homeUpcomingWrapper">
                <div className="noMatches">
                    No Matches Pending
                </div>
            </div>
        );
    }

    return (
        <div className="homeUpcomingWrapper">
            <h2 className="upcomingSeasonTitle">
                {title}
            </h2>
            <div
                className="upcomingScroll"
                ref={sliderRef}
            >
                {matches.map((m, i) => {
                    const row = m.row_data;
                    return (
                        <div
                            className="upcomingCard"
                            key={i}
                        >
                            <div className="upcomingBadge">
                                UPCOMING
                            </div>
                            <div className="teamA">
                                {row["Team 1"]}
                                <div className="boardName">
                                    ({row["Board 1"]})
                                </div>
                            </div>
                            <div className="vsText">
                                VS
                            </div>
                            <div className="teamB">
                                {row["Team 2"]}
                                <div className="boardName">
                                    ({row["Board 2"]})
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}