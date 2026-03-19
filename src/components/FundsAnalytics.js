import React,
{ useEffect, useState }
    from "react";

import axios from "axios";

import "./Funds.css";

export default function FundsAnalytics() {

    const [data, setData] = useState(null);

    const [showInfo, setShowInfo] = useState(false);

    const BACKEND_URL =
        "https://cricket-scoreboard-backend.onrender.com";


    useEffect(() => {

        loadAnalytics();

    }, []);


    const loadAnalytics = async () => {

        try {

            const res =
                await axios.get(

                    `${BACKEND_URL}/api/funds/analytics`

                );

            setData(res.data);

        }
        catch (err) {

            console.log(err);

        }

    };


    if (!data) {

        return (

            <div className="fundsPage">

                Loading analytics...

            </div>

        );

    }


    return (

        <div className="fundsPage">

            {/* HEADER */}

            <div className="analyticsHeader">

                <div className="analyticsHeader">

                    <div>

                        <div className="sectionTitle">
                            CrickEdge Funds – System Economy
                        </div>

                        <div className="analyticsSubtitle">

                            System-wide CE$ financial overview across all registered boards.

                        </div>

                    </div>

                    <button
                        className="infoBtn"
                        onClick={() => setShowInfo(true)}
                    >
                        i
                    </button>

                </div>

                <button

                    className="infoBtn"

                    onClick={() => setShowInfo(true)}

                >

                    i

                </button>

            </div>


            {/* SUMMARY CARDS */}

            <div className="fundsGrid">

                <div className="analyticsCard">

                    <div className="analyticsTitle">

                        Current Total Funds

                    </div>

                    <div className="analyticsValue">

                        CE$ {Number(
                            data.summary.current_total_funds
                        ).toLocaleString()}

                    </div>

                </div>


                <div className="analyticsCard">

                    <div className="analyticsTitle">

                        Total Funds Added (Lifetime)

                    </div>

                    <div className="analyticsValue">

                        CE$ {Number(
                            data.summary.lifetime_funds_added
                        ).toLocaleString()}

                    </div>

                </div>


                <div className="analyticsCard">

                    <div className="analyticsTitle">

                        Total Rewards Distributed

                    </div>

                    <div className="analyticsValue rewardColor">

                        CE$ {Number(
                            data.summary.total_rewards_distributed
                        ).toLocaleString()}

                    </div>

                </div>


                <div className="analyticsCard">

                    <div className="analyticsTitle">

                        Total Tournament Entry Fees

                    </div>

                    <div className="analyticsValue spentColor">

                        CE$ {Number(
                            data.summary.total_entry_fees
                        ).toLocaleString()}

                    </div>

                </div>

            </div>


            {/* TOP BOARDS */}

            <div className="sectionTitle">

                Top Earning Boards

            </div>

            <table className="txTable">

                <thead>

                    <tr>

                        <th>Rank</th>

                        <th>Board</th>

                        <th>Total Funds Added</th>

                    </tr>

                </thead>

                <tbody>

                    {data.topBoards.map((b, i) => (

                        <tr key={i}>

                            <td>{i + 1}</td>

                            <td>{b.board_name}</td>

                            <td>

                                CE$ {Number(
                                    b.total_earned
                                ).toLocaleString()}

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>


            {/* TOURNAMENT REVENUE */}

            <div className="sectionTitle">

                Top Tournament Revenue

            </div>

            <table className="txTable">

                <thead>

                    <tr>

                        <th>Tournament</th>

                        <th>Total Collection</th>

                    </tr>

                </thead>

                <tbody>

                    {data.tournaments.map((t, i) => (

                        <tr key={i}>

                            <td>{t.tournament_name}</td>

                            <td>

                                CE$ {Number(
                                    t.total_collected
                                ).toLocaleString()}

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>


            {/* INFO POPUP */}

            {showInfo && (

                <div className="infoOverlay">

                    <div className="infoBox">

                        <h3>CrickEdge Economy Explanation</h3>

                        <p>

                            These values represent the <b>entire CrickEdge financial ecosystem</b>,
                            not an individual board wallet.

                        </p>

                        <p>

                            <b>Total Funds Across All Boards:</b><br />

                            Combined CE$ currently held by all registered cricket boards.

                        </p>

                        <p>

                            <b>Lifetime Funds Added Across Boards:</b><br />

                            Total CE$ ever credited including initial board funding,
                            tournament rewards, match rewards and refunds.

                        </p>

                        <p>

                            <b>Total Rewards Distributed:</b><br />

                            Actual prize money distributed from tournaments
                            and match victories.

                        </p>

                        <p>

                            <b>Total Tournament Entry Fees:</b><br />

                            Total CE$ spent by boards to participate in tournaments.

                        </p>

                        <p style={{ marginTop: "10px", color: "#94a3b8" }}>

                            💡 For your personal finances please visit:
                            <b> CrickEdge Funds Wallet</b>

                        </p>

                        <button

                            className="closeInfo"

                            onClick={() => setShowInfo(false)}

                        >

                            Close

                        </button>

                    </div>

                </div>

            )}

        </div>

    );

}