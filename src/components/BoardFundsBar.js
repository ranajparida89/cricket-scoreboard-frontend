import React, { useEffect, useState } from "react";

import "./Funds.css";
import { getBoardFunds } from "./FundsAPI";
import { useAuth } from "../services/auth";

export default function BoardFundsBar() {

    const { currentUser } = useAuth();

    const [wallet, setWallet] = useState(null);

    useEffect(() => {

        if (currentUser?.board_id) {

            load();

        }

    }, [currentUser]);

    const load = async () => {

        const boardId =
            currentUser?.board_id;

        if (!boardId) return;

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