import React,
{ useEffect, useState }
    from "react";

import axios from "axios";

import "./Funds.css";

export default function FundsAnalytics() {

    const [data, setData] = useState(null);

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

            <div className="sectionTitle">

                Funds Analytics

            </div>


            <div className="fundsGrid">

                <div className="analyticsCard">

                    <h4>Total Economy</h4>

                    CE$ {Number(
                        data.summary.total_balance
                    ).toLocaleString()}

                </div>


                <div className="analyticsCard">

                    <h4>Total Rewards Distributed</h4>

                    CE$ {Number(
                        data.summary.total_earned
                    ).toLocaleString()}

                </div>


                <div className="analyticsCard">

                    <h4>Total Tournament Spending</h4>

                    CE$ {Number(
                        data.summary.total_spent
                    ).toLocaleString()}

                </div>

            </div>


            <div className="sectionTitle">

                Top Earning Boards

            </div>

            <table className="txTable">

                <thead>

                    <tr>

                        <th>Board</th>

                        <th>Total Earned</th>

                    </tr>

                </thead>

                <tbody>

                    {data.topBoards.map((b, i) => (

                        <tr key={i}>

                            <td>

                                {b.board_name}

                            </td>

                            <td>

                                CE$ {Number(
                                    b.total_earned
                                ).toLocaleString()}

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>


            <div className="sectionTitle">

                Top Tournament Revenue

            </div>

            <table className="txTable">

                <thead>

                    <tr>

                        <th>Tournament</th>

                        <th>Collection</th>

                    </tr>

                </thead>

                <tbody>

                    {data.tournaments.map((t, i) => (

                        <tr key={i}>

                            <td>

                                {t.tournament_name}

                            </td>

                            <td>

                                CE$ {Number(
                                    t.total_collected
                                ).toLocaleString()}

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}