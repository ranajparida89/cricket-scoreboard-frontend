import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Funds.css";

export default function RewardBankView() {

    const [banks, setBanks] = useState([]);
    const [showInfo, setShowInfo] = useState(false);

    const BACKEND_URL =
        "https://cricket-scoreboard-backend.onrender.com";

    useEffect(() => {

        loadBanks();

    }, []);

    const loadBanks = async () => {

        try {

            const res =
                await axios.get(
                    `${BACKEND_URL}/api/funds/reward-banks`
                );

            setBanks(res.data || []);

        }
        catch (err) {

            console.log(err);

        }

    };

    const getHealthColor = (health) => {

        if (health === "HEALTHY")
            return "#35d07f";

        if (health === "MODERATE")
            return "#ffd166";

        if (health === "LOW")
            return "#ff8c42";

        return "#ff4d4d";

    };

    return (

        <div className="fundsPage">

            <div className="walletHeader">

                <div>

                    <div className="sectionTitle">

                        CrickEdge Reward Pools

                    </div>

                    <div className="walletSubtitle">

                        Financial pools created from tournament entry fees.
                        Rewards are distributed from these pools.

                    </div>

                </div>

                <button
                    className="infoBtn"
                    onClick={() => setShowInfo(true)}
                >
                    i
                </button>

            </div>

            {/* POOL CARDS */}

            <div className="rewardGrid">

                {banks.map(b => (

                    <div
                        className="rewardCard"
                        key={b.reward_bank_id}
                    >

                        <div className="rewardHeader">

                            <div>

                                <div className="rewardTitle">

                                    {b.tournament_name}

                                </div>

                                <div className="rewardId">

                                    Pool ID : RB-{b.reward_bank_id}

                                </div>

                            </div>

                            <div
                                className="healthBadge"
                                style={{
                                    background: getHealthColor(b.pool_health)
                                }}
                            >

                                {b.pool_health}

                            </div>

                        </div>

                        <div className="rewardStats">

                            <div>

                                Total Pool

                                <div className="rewardValue">

                                    CE$ {b.total_collected.toLocaleString()}

                                </div>

                            </div>

                            <div>

                                Distributed

                                <div className="rewardValue">

                                    CE$ {b.total_distributed.toLocaleString()}

                                </div>

                            </div>

                            <div>

                                Remaining

                                <div className="rewardValue">

                                    CE$ {b.remaining_balance.toLocaleString()}

                                </div>

                            </div>

                        </div>

                        {/* PROGRESS */}

                        <div className="progressBar">

                            <div
                                className="progressFill"
                                style={{
                                    width: b.distribution_percent + "%"
                                }}
                            >

                            </div>

                        </div>

                        <div className="progressText">

                            Distribution Progress :
                            {b.distribution_percent}%

                        </div>

                        <div className="rewardFooter">

                            <div>

                                Type : {b.tournament_type}

                            </div>

                            <div>

                                Status : {b.tournament_status}

                            </div>

                        </div>

                    </div>

                ))}

            </div>

            {/* TABLE */}

            <div className="sectionTitle">

                Detailed Pool Breakdown

            </div>

            {/* ✅ RESPONSIVE TABLE FIX */}

            <div className="tableContainer">

                <table className="txTable">

                    <thead>

                        <tr>

                            <th>Pool ID</th>
                            <th>Tournament</th>
                            <th>Collected</th>
                            <th>Distributed</th>
                            <th>Remaining</th>
                            <th>Health</th>

                        </tr>

                    </thead>

                    <tbody>

                        {banks.map(b => (

                            <tr key={b.reward_bank_id}>

                                <td>

                                    RB-{b.reward_bank_id}

                                </td>

                                <td>

                                    {b.tournament_name}

                                </td>

                                <td>

                                    CE$ {b.total_collected}

                                </td>

                                <td>

                                    CE$ {b.total_distributed}

                                </td>

                                <td>

                                    CE$ {b.remaining_balance}

                                </td>

                                <td>

                                    <span
                                        style={{
                                            color: getHealthColor(b.pool_health)
                                        }}
                                    >

                                        {b.pool_health}

                                    </span>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

            {/* INFO POPUP */}

            {showInfo && (

                <div className="infoOverlay">

                    <div className="infoBox">

                        <h3>Reward Pool Explained</h3>

                        <p>

                            Each tournament creates a financial reward pool.

                        </p>

                        <p>

                            <b>Total Pool</b><br />

                            Total CE$ collected from entry fees.

                        </p>

                        <p>

                            <b>Distributed</b><br />

                            Prize money already paid.

                        </p>

                        <p>

                            <b>Remaining</b><br />

                            Funds still available.

                        </p>

                        <p>

                            <b>Pool Health</b>

                        </p>

                        <p>

                            Healthy → Plenty funds<br />
                            Moderate → Medium balance<br />
                            Low → Nearly distributed<br />
                            Empty → Fully distributed

                        </p>

                        <p>

                            <b>How money flows:</b>

                        </p>

                        <p>

                            Boards pay entry fee → Pool fills<br />
                            Winners receive rewards → Pool reduces

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