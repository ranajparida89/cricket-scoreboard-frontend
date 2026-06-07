import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Funds.css";

export default function BoardFundsBar() {

    const [topBoard, setTopBoard] = useState(null);

    useEffect(() => {

        loadTopBoard();

    }, []);

    const loadTopBoard = async () => {

        try {

            const res = await axios.get(
                "https://cricket-scoreboard-backend.onrender.com/api/funds/leaderboard"
            );

            const list = res.data || [];

            if (list.length > 0) {

                setTopBoard(list[0]);

            }

        } catch (err) {

            console.error(
                "Top board load failed",
                err
            );

        }

    };

    const balance =
        Number(topBoard?.balance || 0);

    let status = "Stable";

    if (balance > 300000)
        status = "Strong";

    if (balance < 150000)
        status = "Low";

    return (

        <div className="fundsHeader">

            <div className="boardName">

                {topBoard?.board_name || "Board"}

                <span className="rankBadge">

                    {status} Funds

                </span>

            </div>

            <div className="fundsAmount">

                CE$ {balance.toLocaleString()}

            </div>

        </div>

    );

}