import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Funds.css";

export default function TournamentInterestLog() {

    const [data, setData] = useState([]);
    const [warningData, setWarningData] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);

    const BACKEND_URL =
        "https://cricket-scoreboard-backend.onrender.com";

    useEffect(() => {

        setIsAdmin(
            localStorage.getItem("isAdmin") === "true"
        );

        load();

    }, []);

    const load = async () => {

        try {

            const res =
                await axios.get(
                    `${BACKEND_URL}/api/funds/tournament-interest`
                );

            setData(res.data || []);

            const warningRes =
                await axios.get(
                    `${BACKEND_URL}/api/funds/participation-warning`
                );

            setWarningData(warningRes.data || []);

        } catch (err) {

            console.log(err);

        }

    };

    const getStatusLabel = (status) => {

        if (status === "INTERESTED")
            return "✅ Participating";

        if (status === "NOT_INTERESTED")
            return "❌ Declined By Member";

        if (status === "AUTO_NOT_INTERESTED")
            return "⏰ No Response (Auto Declined)";

        return status;

    };

    const getWarningClass = (status) => {

        if (status === "FLAGGED")
            return "declined";

        if (status === "WARNING")
            return "declined";

        if (status === "WATCH")
            return "pending";

        return "accepted";

    };

    if (!isAdmin) {

        return (

            <div className="fundsPage">

                Admin access only

            </div>

        );

    }

    return (

        <div className="fundsPage">

            <div className="sectionTitle">

                Tournament Interest Log

            </div>

            <div className="tableContainer">

                <table className="txTable">

                    <thead>

                        <tr>
                            <th>Board</th>
                            <th>Tournament</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>

                    </thead>

                    <tbody>

                        {data.map(x => (

                            <tr key={x.interest_id}>

                                <td>{x.board_name}</td>

                                <td>{x.tournament_name}</td>

                                <td>

                                    <span
                                        className={
                                            x.interest_status === "INTERESTED"
                                                ? "accepted"
                                                : "declined"
                                        }
                                    >
                                        {getStatusLabel(x.interest_status)}
                                    </span>

                                </td>

                                <td>
                                    {x.created_at?.substring(0, 10)}
                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

            <div className="sectionTitle">

                Board Participation Warning Report

            </div>

            <div className="tableContainer">

                <table className="txTable">

                    <thead>

                        <tr>
                            <th>Board</th>
                            <th>Participated</th>
                            <th>Declined By Member</th>
                            <th>No Response</th>
                            <th>Status</th>
                        </tr>

                    </thead>

                    <tbody>

                        {warningData.length === 0 && (

                            <tr>
                                <td colSpan="5">
                                    No participation warning data found
                                </td>
                            </tr>

                        )}

                        {warningData.map(x => (

                            <tr key={x.board_id}>

                                <td>{x.board_name}</td>

                                <td>{x.participated_count}</td>

                                <td>{x.declined_by_member_count}</td>

                                <td>{x.auto_declined_count}</td>

                                <td>

                                    <span
                                        className={getWarningClass(
                                            x.participation_status
                                        )}
                                    >
                                        {x.participation_status === "FLAGGED"
                                            ? "🚩 FLAGGED"
                                            : x.participation_status === "WARNING"
                                                ? "⚠ WARNING"
                                                : x.participation_status === "WATCH"
                                                    ? "👀 WATCH"
                                                    : "✅ ACTIVE"}
                                    </span>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>

    );

}