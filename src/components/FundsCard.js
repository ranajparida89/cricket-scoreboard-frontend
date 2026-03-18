import "../common/Funds.css";

export default function FundsCard({

    title,
    value,
    color

}) {

    return (

        <div className="fundsCard">

            <div className="cardTitle">

                {title}

            </div>

            <div
                className="cardValue"
                style={{ color }}
            >

                {value}

            </div>

        </div>

    );

}