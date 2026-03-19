import React,
{ useEffect, useState }
    from "react";

import axios from "axios";

import "./Funds.css";

export default function RewardBankView() {

    const [banks, setBanks] = useState([]);

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

            setBanks(res.data);

        }
        catch (err) {

            console.log(
                "Reward bank load error",
                err
            );

        }

    };


    const getPercent = (collected, distributed) => {

        if (collected === 0) return 0;

        return Math.floor(
            (distributed / collected) * 100
        );

    };


    return (

        <div className="fundsPage">

            <div className="sectionTitle">

                Tournament Reward Pools

            </div>


            <table className="txTable">

                <thead>

                    <tr>

                        <th>Tournament</th>

                        <th>Type</th>

                        <th>Entry Fee</th>

                        <th>Collected</th>

                        <th>Distributed</th>

                        <th>Remaining</th>

                        <th>Status</th>

                    </tr>

                </thead>


                <tbody>

                    {banks.map((b, index) => (

                        <tr key={index}>

                            <td>

                                {b.tournament_name}

                            </td>

                            <td>

                                {b.tournament_type}

                            </td>

                            <td>

                                CE$ {b.entry_fee?.toLocaleString()}

                            </td>

                            <td>

                                CE$ {b.total_collected?.toLocaleString()}

                            </td>

                            <td>

                                CE$ {b.total_distributed?.toLocaleString()}

                            </td>

                            <td>

                                CE$ {b.remaining_balance?.toLocaleString()}

                            </td>

                            <td>

                                {b.tournament_status}

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}