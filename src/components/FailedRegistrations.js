import React,
{ useEffect, useState }
    from "react";

import axios from "axios";

import "./Funds.css";


export default function FailedRegistrations() {

    const [data, setData] = useState([]);

    const [isAdmin, setIsAdmin] = useState(false);

    const BACKEND_URL =
        "https://cricket-scoreboard-backend.onrender.com";


    useEffect(() => {

        setIsAdmin(
            localStorage.getItem("isAdmin") === "true"
        );

        loadData();

    }, []);


    const loadData = async () => {

        try {

            const res =
                await axios.get(

                    `${BACKEND_URL}/api/funds/failed-transactions`

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

                Admin access only.

            </div>

        );

    }


    return (

        <div className="fundsPage">

            <div className="sectionTitle">

                Failed Tournament Registrations

            </div>


            <table className="txTable">

                <thead>

                    <tr>

                        <th>Board</th>

                        <th>Tournament</th>

                        <th>Required</th>

                        <th>Available</th>

                        <th>Status</th>

                        <th>Date</th>

                    </tr>

                </thead>


                <tbody>

                    {data.map(x => (

                        <tr key={x.failed_id}>

                            <td>

                                {x.board_name}

                            </td>

                            <td>

                                {x.tournament_name}

                            </td>

                            <td>

                                CE$ {x.required_amount}

                            </td>

                            <td>

                                CE$ {x.available_balance}

                            </td>

                            <td>

                                <span className="failedStatus">

                                    INSUFFICIENT FUNDS

                                </span>

                            </td>

                            <td>

                                {x.created_at?.substring(0, 10)}

                            </td>

                        </tr>

                    ))}


                    {data.length === 0 && (

                        <tr>

                            <td colSpan="6"
                                style={{ textAlign: "center" }}
                            >

                                No failed registrations

                            </td>

                        </tr>

                    )}

                </tbody>

            </table>

        </div>

    );

}