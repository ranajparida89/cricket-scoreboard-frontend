import React, { useEffect, useState } from "react";

import { getBoardFunds }
    from "../common/FundsAPI";

import "../common/Funds.css";

export default function BoardFundsBar() {

    const [wallet, setWallet] = useState(null);

    useEffect(() => {

        load();

    }, []);

    const load = async () => {

        const boardId =
            localStorage.getItem("board_id");

        const res =
            await getBoardFunds(boardId);

        setWallet(res.data);

    };

    const balance =
        wallet?.balance || 0;

    let status = "Stable";

    if (balance > 300000)
        status = "Strong";

    if (balance < 150000)
        status = "Low";

    return (

        <div className="fundsHeader">

            <div className="boardName">

                {wallet?.board_name || "Board"}

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