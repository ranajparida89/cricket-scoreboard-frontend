import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Funds.css";

export default function TournamentInterestLog() {

    const [data, setData] = useState([]);
    const [warningData, setWarningData] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [search, setSearch] = useState("");

    const BACKEND_URL =
        "https://cricket-scoreboard-backend.onrender.com";

    useEffect(() => {
        setIsAdmin(localStorage.getItem("isAdmin") === "true");
        load();
    }, []);

    const load = async () => {

        try {

            const res = await axios.get(
                `${BACKEND_URL}/api/funds/tournament-interest`
            );

            setData(res.data || []);

            const warningRes = await axios.get(
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

    const summary = useMemo(() => {

        return {
            totalBoards: warningData.length,
            participated: warningData.reduce(
                (sum, x) => sum + Number(x.participated_count || 0), 0
            ),
            declined: warningData.reduce(
                (sum, x) => sum + Number(x.declined_by_member_count || 0), 0
            ),
            noResponse: warningData.reduce(
                (sum, x) => sum + Number(x.auto_declined_count || 0), 0
            ),
            watch: warningData.filter(x => x.participation_status === "WATCH").length,
            warning: warningData.filter(x => x.participation_status === "WARNING").length,
            flagged: warningData.filter(x => x.participation_status === "FLAGGED").length
        };

    }, [warningData]);

    const filteredWarningData = warningData.filter(x =>
        String(x.board_name || "")
            .toLowerCase()
            .includes(search.toLowerCase())
    );

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

                                <td>{x.created_at?.substring(0, 10)}</td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

            <div className="sectionTitle">

                Board Participation Analytics

            </div>

            <div className="participationSummaryGrid">

                <div className="participationBox">
                    <span>Total Boards</span>
                    <strong>{summary.totalBoards}</strong>
                </div>

                <div className="participationBox greenBox">
                    <span>Total Participations</span>
                    <strong>{summary.participated}</strong>
                </div>

                <div className="participationBox redBox">
                    <span>Declined By Member</span>
                    <strong>{summary.declined}</strong>
                </div>

                <div className="participationBox orangeBox">
                    <span>No Response</span>
                    <strong>{summary.noResponse}</strong>
                </div>

                <div className="participationBox watchBox">
                    <span>Watch</span>
                    <strong>{summary.watch}</strong>
                </div>

                <div className="participationBox warningBoxMini">
                    <span>Warning</span>
                    <strong>{summary.warning}</strong>
                </div>

                <div className="participationBox flaggedBox">
                    <span>Flagged</span>
                    <strong>{summary.flagged}</strong>
                </div>

            </div>

            <div className="participationToolbar">

                <button
                    className="loanBtn"
                    onClick={() => setShowReport(!showReport)}
                >
                    {showReport ? "Hide Detailed Report" : "Show Detailed Report"}
                </button>

                {showReport && (

                    <input
                        className="participationSearch"
                        placeholder="Search board..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                )}

            </div>

            {showReport && (

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

                            {filteredWarningData.length === 0 && (

                                <tr>
                                    <td colSpan="5">
                                        No board found
                                    </td>
                                </tr>

                            )}

                            {filteredWarningData.map(x => (

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

            )}

        </div>

    );

}