import "./Funds.css";

export default function FundsCard({

    title,
    value,
    subtitle,
    color

}) {

    return (

        <div className="analyticsCard">

            <div className="analyticsTitle">

                {title}

            </div>

            <div
                className="analyticsValue"
                style={{ color: color }}
            >

                {value}

            </div>

            <div className="cardSubtitle">

                {subtitle}

            </div>

        </div>

    );

}