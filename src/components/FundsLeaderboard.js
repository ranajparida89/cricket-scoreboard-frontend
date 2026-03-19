import React,
{ useEffect, useState }
    from "react";

import axios from "axios";

import "./Funds.css";


export default function FundsLeaderboard() {

    const [boards, setBoards] = useState([]);

    const BACKEND_URL =
        "https://cricket-scoreboard-backend.onrender.com";


    useEffect(() => {

        loadLeaderboard();

    }, []);


    const loadLeaderboard = async () => {

        try {

            const res =
                await axios.get(

                    `${BACKEND_URL}/api/funds/leaderboard`

                );

            setBoards(res.data);

        }
        catch (err) {

            console.log(
                "Leaderboard load error",
                err
            );

        }

    };


    const getRankClass = (index) => {

        if (index === 0) return "rank1";

        if (index === 1) return "rank2";

        if (index === 2) return "rank3";

        return "";

    };


    const getStrength = (balance) => {

        if (balance > 300000)
            return "Strong";

        if (balance >= 150000)
            return "Stable";

        return "Weak";

    };


    return (

        <div className="fundsPage">

            <div className="sectionTitle">

                Funds Leaderboard

            </div>


            <table className="txTable">

                <thead>

                    <tr>

                        <th>Rank</th>

                        <th>Board</th>

                        <th>Balance</th>

                        <th>Total Earned</th>

                        <th>Total Spent</th>

                        <th>Status</th>

                    </tr>

                </thead>


                <tbody>

                    {boards.map((b, index) => (

                        <tr
                            key={index}
                            className={
                                getRankClass(index)
                            }
                        >

                            <td>

                                {index + 1}

                            </td>


                            <td>

                                {b.board_name}

                            </td>


                            <td>

                                CE$ {b.balance?.toLocaleString()}

                            </td>


                            <td>

                                CE$ {b.total_earned?.toLocaleString()}

                            </td>


                            <td>

                                CE$ {b.total_spent?.toLocaleString()}

                            </td>


                            <td>

                                <span className={
                                    "status " +
                                    getStrength(b.balance)
                                }>

                                    {getStrength(b.balance)}

                                </span>

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}