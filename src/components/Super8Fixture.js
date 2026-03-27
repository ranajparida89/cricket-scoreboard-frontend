import React, { useState } from "react";
import "./Super8Fixture.css";

export default function Super8Fixture() {
    const isAdminUser =
        localStorage.getItem("isAdmin") === "true";

    const [teams, setTeams] = useState(Array(8).fill(""));
    const [fixtures, setFixtures] = useState([]);
    const [drawCount, setDrawCount] = useState(0);
    const [drawing, setDrawing] = useState(false);
    const [revealed, setRevealed] = useState([]);

    const normalize = (name) => {
        return name.toLowerCase().trim();
    };

    const isDC = (name) => {

        const n = normalize(name);

        return (
            n === "dc" ||
            n === "fawas"
        );

    };

    const isTVK = (name) => {

        const n = normalize(name);

        return (
            n === "tvk" ||
            n === "ashok"
        );

    };

    const shuffle = (arr) => {

        let a = [...arr];

        for (let i = a.length - 1; i > 0; i--) {

            let j = Math.floor(Math.random() * (i + 1));

            [a[i], a[j]] = [a[j], a[i]];
        }

        return a;

    };

    const buildFixtures = (list, controlled) => {

        let matches = [];

        if (controlled) {

            let dc = list.find(isDC);

            let tvk = list.find(isTVK);

            if (dc && tvk) {

                let remaining = list.filter(
                    t => t !== dc && t !== tvk
                );

                remaining = shuffle(remaining);

                matches.push([dc, tvk]);

                for (let i = 0; i < remaining.length; i += 2) {

                    matches.push([
                        remaining[i],
                        remaining[i + 1]
                    ]);

                }

                return shuffle(matches);

            }

        }

        let shuffled = shuffle(list);

        for (let i = 0; i < 8; i += 2) {

            matches.push([
                shuffled[i],
                shuffled[i + 1]
            ]);

        }

        return matches;

    };

    const randomize = async () => {

        let filled = teams.filter(t => t.trim() != "");

        if (filled.length !== 8) {

            alert("Please provide all 8 teams");

            return;

        }

        setDrawing(true);

        setFixtures([]);
        setRevealed([]);

        let newCount = drawCount + 1;

        let controlled = newCount % 2 === 1;

        let result = buildFixtures(filled, controlled);

        setFixtures(result);

        setDrawCount(newCount);

        for (let i = 0; i < result.length; i++) {

            await new Promise(r => setTimeout(r, 800));

            setRevealed(prev => [...prev, i]);

        }

        setDrawing(false);

    };

    return (

        <div className="s8Wrapper">

            <div className="header">

                <h2>SUPER 8 FIXTURE DRAW</h2>

                <div className="mode">

                    NEXT DRAW :

                    <span className={
                        (drawCount + 1) % 2 === 1 ?
                            "oddMode" :
                            "evenMode"
                    }>

                        {
                            (drawCount + 1) % 2 === 1 ?
                                "ODD (Controlled Random)" :
                                "EVEN (Pure Random)"
                        }

                    </span>

                </div>

            </div>

            <div className="teamGrid">

                {
                    teams.map((t, i) => (
                        <input
                            key={i}

                            value={t}

                            placeholder={"Team / Player " + (i + 1)}

                            onChange={(e) => {

                                let copy = [...teams];

                                copy[i] = e.target.value;

                                setTeams(copy);

                            }}

                            className="teamField"
                        />
                    ))
                }

            </div>

            <button
                onClick={randomize}
                className="drawButton"
                disabled={drawing || !isAdminUser}
            >

                {drawing ? "Drawing..." : "S8 Randomizer"}

            </button>
            {
                !isAdminUser && (

                    <div
                        style={{
                            textAlign: "center",
                            marginTop: "15px",
                            color: "#ff4d4d",
                            fontWeight: "bold"
                        }}
                    >

                        Only Admin can run Randomizer

                    </div>

                )
            }

            <div className="fixtureArea">

                {
                    fixtures.map((match, i) => (

                        <div
                            key={i}

                            className={
                                revealed.includes(i) ?
                                    "matchCard show" :
                                    "matchCard hide"
                            }

                        >

                            <div className="teamName">

                                {match[0]}

                            </div>

                            <div className="vs">

                                VS

                            </div>

                            <div className="teamName">

                                {match[1]}

                            </div>

                        </div>

                    ))
                }

            </div>

        </div>

    );

}