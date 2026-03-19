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


    /* RANK STYLE */

    const getRankClass = (index) => {

        if (index === 0) return "rank1";

        if (index === 1) return "rank2";

        if (index === 2) return "rank3";

        return "";

    };


    /* FINANCIAL STRENGTH */

    const getStrength = (balance) => {

        if (balance > 300000)
            return "Strong";

        if (balance >= 150000)
            return "Stable";

        return "Weak";

    };


    /* CSS STATUS */

    const getStrengthClass = (balance) => {

        if (balance > 300000)
            return "strong";

        if (balance >= 150000)
            return "stable";

        return "weak";

    };


    /* RANK DISPLAY */

    const getRankDisplay = (index) => {

        if (index === 0) return "👑 1";

        if (index === 1) return "🥈 2";

        if (index === 2) return "🥉 3";

        return index + 1;

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

                        <th>Financial Strength</th>

                    </tr>

                </thead>


                <tbody>

                    {boards.map((b, index) => (

                        <tr
                            key={index}
                            className={getRankClass(index)}
                        >

                            <td>

                                {getRankDisplay(index)}

                            </td>


                            <td className="boardNameCell">

                                {index === 0 && (

                                    <span className="crownIcon">

                                        🏆

                                    </span>

                                )}

                                {b.board_name}

                            </td>


                            <td className="balanceCell">

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

                                <span className={
                                    "status " +
                                    getStrengthClass(b.balance)
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