import React,
{ useEffect, useState }
    from "react";

import axios from "axios";

import "./Funds.css";

export default function FundsAlerts() {

    const [data, setData] = useState([]);

    const [isAdmin, setIsAdmin] = useState(false);

    const BACKEND =
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

                    `${BACKEND}/api/funds/leaderboard`

                );

            const weakBoards =
                res.data.filter(

                    b => b.balance < 150000

                );

            setData(weakBoards);

        }
        catch (err) {

            console.log(err);

        }

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

                Funds Risk Alerts

            </div>


            {data.length === 0 && (

                <div className="analyticsCard">

                    No boards currently at risk

                </div>

            )}


            {data.length > 0 && (

                <table className="txTable">

                    <thead>

                        <tr>

                            <th>Board</th>
                            <th>Balance</th>
                            <th>Total Earned</th>
                            <th>Total Spent</th>
                            <th>Risk Level</th>

                        </tr>

                    </thead>

                    <tbody>

                        {data.map(b => (

                            <tr key={b.board_name}
                                className="riskRow">

                                <td>

                                    {b.board_name}

                                </td>

                                <td className="dangerText">

                                    CE$ {Number(
                                        b.balance
                                    ).toLocaleString()}

                                </td>

                                <td>

                                    CE$ {Number(
                                        b.total_earned
                                    ).toLocaleString()}

                                </td>

                                <td>

                                    CE$ {Number(
                                        b.total_spent
                                    ).toLocaleString()}

                                </td>

                                <td>

                                    <span className="riskBadge">

                                        LOW FUNDS

                                    </span>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            )}

        </div>

    );

}