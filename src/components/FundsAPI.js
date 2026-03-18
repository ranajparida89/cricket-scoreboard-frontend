import axios from "axios";

const BASE =
    "https://cricket-scoreboard-backend.onrender.com/api/funds";

export const getBoardFunds = (boardId) =>
    axios.get(`${BASE}/wallet/${boardId}`);

export const getFundsLedger = (boardId) =>
    axios.get(`${BASE}/transactions/${boardId}`);