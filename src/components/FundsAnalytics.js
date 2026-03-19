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

                <div className="sectionTitle">

                    Funds Analytics Dashboard

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

                        <h3>Funds Analytics Explanation</h3>

                        <p>

                            <b>Current Total Funds:</b>
                            Total CE$ currently available across all boards.

                        </p>

                        <p>

                            <b>Total Funds Added:</b>
                            Includes initial board funding + rewards + refunds.

                        </p>

                        <p>

                            <b>Total Rewards Distributed:</b>
                            Only tournament and match rewards.

                        </p>

                        <p>

                            <b>Total Tournament Entry Fees:</b>
                            Total CE$ spent by boards to enter tournaments.

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