import React,
{ useEffect, useState }
    from "react";

import axios from "axios";

import "./Funds.css";


export default function TournamentInterestLog() {

    const [data, setData] = useState([]);

    const [isAdmin, setIsAdmin] = useState(false);

    const BACKEND_URL =
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

                    `${BACKEND_URL}/api/funds/tournament-interest`

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

                Tournament Interest Log

            </div>


            <table className="txTable">

                <thead>

                    <tr>

                        <th>Board</th>

                        <th>Tournament</th>

                        <th>Status</th>

                        <th>Date</th>

                    </tr>

                </thead>


                <tbody>

                    {data.map(x => (

                        <tr key={x.interest_id}>

                            <td>

                                {x.board_name}

                            </td>

                            <td>

                                {x.tournament_name}

                            </td>

                            <td>

                                <span className={
                                    x.interest_status === "NOT_INTERESTED"
                                        ? "declined"
                                        : "accepted"
                                }>

                                    {x.interest_status}

                                </span>

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