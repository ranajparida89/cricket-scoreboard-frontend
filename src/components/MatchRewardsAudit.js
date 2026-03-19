import React,
{ useEffect, useState }
    from "react";

import axios from "axios";

import "./Funds.css";

export default function MatchRewardsAudit() {

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

                    `${BACKEND}/api/funds/transactions/all-match-rewards`

                );

            setData(res.data);

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

                Match Reward Audit

            </div>


            <table className="txTable">

                <thead>

                    <tr>

                        <th>Board</th>
                        <th>Match Ref</th>
                        <th>Reward</th>
                        <th>Balance Before</th>
                        <th>Balance After</th>
                        <th>Date</th>

                    </tr>

                </thead>

                <tbody>

                    {data.map(x => (

                        <tr key={x.transaction_id}>

                            <td>

                                {x.board_name}

                            </td>

                            <td>

                                {x.reference_id}

                            </td>

                            <td className="creditText">

                                CE$ {Number(
                                    x.amount
                                ).toLocaleString()}

                            </td>

                            <td>

                                CE$ {Number(
                                    x.balance_before
                                ).toLocaleString()}

                            </td>

                            <td>

                                CE$ {Number(
                                    x.balance_after
                                ).toLocaleString()}

                            </td>

                            <td>

                                {x.created_at?.substring(0, 10)}

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}