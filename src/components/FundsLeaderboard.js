import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence, useSpring, useMotionValue, animate } from "framer-motion";
import "./Funds.css";

/* ─── Animated Counter Hook ─── */
function useCountUp(target, duration = 1.4, start = false) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        if (!start || !target) return;
        const controls = animate(0, Number(target), {
            duration,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (v) => setDisplay(Math.floor(v)),
        });
        return controls.stop;
    }, [target, start]);
    return display;
}

/* ─── Single animated stat cell ─── */
function AnimatedStat({ label, value, className = "", animate: shouldAnimate }) {
    const count = useCountUp(value, 1.3, shouldAnimate);
    return (
        <div className="statCell">
            <div className="statLabel">{label}</div>
            <div className={`statValue ${className}`}>
                CE$ {shouldAnimate ? count.toLocaleString() : Number(value).toLocaleString()}
            </div>
        </div>
    );
}

/* ─── Floating Coin Particle (physics-aware) ─── */
const COIN_EMOJIS = ["💰", "🪙", "💵", "💎"];
const isMobile = () => window.innerWidth < 768;

function FloatingCoin({ index }) {
    const x     = useRef(Math.random() * 100).current;   // vw %
    const delay  = index * 0.45;
    const dur    = isMobile() ? 9 + Math.random() * 5 : 12 + Math.random() * 7;
    const size   = isMobile() ? 12 + Math.random() * 8 : 14 + Math.random() * 10;
    const emoji  = COIN_EMOJIS[index % COIN_EMOJIS.length];
    const drift  = (Math.random() - 0.5) * 120;   // horizontal sway

    return (
        <motion.span
            className="floatingCoin"
            style={{ left: `${x}%`, fontSize: size }}
            initial={{ y: "108vh", x: 0, rotate: 0, opacity: 0 }}
            animate={{
                y: [null, "60vh", "-12vh"],
                x: [0, drift * 0.5, drift],
                rotate: [0, 180 + Math.random() * 180],
                opacity: [0, 0.55, 0.55, 0],
            }}
            transition={{
                duration: dur,
                repeat: Infinity,
                repeatDelay: 0.2,
                delay,
                ease: "linear",
                opacity: { times: [0, 0.08, 0.85, 1] },
            }}
        >
            {emoji}
        </motion.span>
    );
}

/* ─── Gold-burst confetti for Rank-1 card ─── */
function GoldBurst() {
    const count = isMobile() ? 8 : 14;
    return (
        <div className="goldBurstWrap" aria-hidden>
            {[...Array(count)].map((_, i) => {
                const angle = (360 / count) * i;
                const dist  = 55 + Math.random() * 35;
                const tx    = Math.cos((angle * Math.PI) / 180) * dist;
                const ty    = Math.sin((angle * Math.PI) / 180) * dist;
                return (
                    <motion.span
                        key={i}
                        className="burstDot"
                        initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                        animate={{
                            x:       [0, tx * 0.6, tx],
                            y:       [0, ty * 0.6, ty],
                            scale:   [0, 1.4, 0],
                            opacity: [1, 0.9, 0],
                        }}
                        transition={{
                            duration: 1.6,
                            repeat: Infinity,
                            repeatDelay: 3.5,
                            delay: i * 0.06,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    />
                );
            })}
        </div>
    );
}

/* ─── Rank Badge ─── */
function RankBadge({ index }) {
    if (index === 0) return (
        <motion.div
            className="rankBox rank1Badge"
            animate={{ scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
            👑
        </motion.div>
    );
    if (index === 1) return <div className="rankBox">🥈 2</div>;
    if (index === 2) return <div className="rankBox">🥉 3</div>;
    return <div className="rankBox rankNum">{index + 1}</div>;
}

/* ─── Leaderboard Card ─── */
function LeaderboardCard({ b, index, isTop }) {
    const [visible, setVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setVisible(true); },
            { threshold: 0.15 }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    return (
        <motion.div
            ref={ref}
            className={`leaderboardCard ${isTop ? "topCard" : ""}`}
            initial={{ opacity: 0, y: 35, scale: 0.97 }}
            animate={visible ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ delay: index * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -5, boxShadow: isTop
                ? "0 20px 50px rgba(255,215,0,0.22)"
                : "0 16px 40px rgba(0,0,0,0.7)"
            }}
            whileTap={{ scale: 0.98 }}
        >
            {isTop && <GoldBurst />}

            {/* shimmer line */}
            <motion.div
                className="cardShimmer"
                animate={{ x: ["-100%", "220%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
            />

            <div className="cardLeft">
                <RankBadge index={index} />
                <div className="boardName">
                    {isTop && (
                        <motion.span
                            className="eliteCrown"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            👑
                        </motion.span>
                    )}
                    {b.board_name}
                </div>
            </div>

            <div className="cardStats">
                <AnimatedStat label="Balance" value={b.balance}      className="green animatedBalance" animate={visible} />
                <AnimatedStat label="Earned"  value={b.total_earned} animate={visible} />
                <AnimatedStat label="Spent"   value={b.total_spent}  animate={visible} />
            </div>
        </motion.div>
    );
}

/* ─── Main Component ─── */
export default function FundsLeaderboard() {
    const [participated,    setParticipated]    = useState([]);
    const [notParticipated, setNotParticipated] = useState([]);
    const [loading, setLoading] = useState(true);

    const BACKEND_URL = "https://cricket-scoreboard-backend.onrender.com";
    const COIN_COUNT  = isMobile() ? 10 : 18;

    useEffect(() => { loadLeaderboard(); }, []);

    const loadLeaderboard = async () => {
        try {
            const res  = await axios.get(`${BACKEND_URL}/api/funds/leaderboard`);
            const data = res.data || [];
            const played    = data.filter(b => Number(b.total_spent) > 0).sort((a, b) => b.balance - a.balance);
            const notPlayed = data.filter(b => Number(b.total_spent) === 0);
            setParticipated(played);
            setNotParticipated(notPlayed);
        } catch (err) {
            console.log("Leaderboard load error", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fundsPage">

            {/* ── Background Layer ── */}
            <div className="bgNoise" aria-hidden />
            <div className="bgGlow"  aria-hidden />

            {/* ── Floating Coins ── */}
            <div className="floatingCoins" aria-hidden>
                {[...Array(COIN_COUNT)].map((_, i) => <FloatingCoin key={i} index={i} />)}
            </div>

            {/* ── Page Title ── */}
            <motion.div
                className="sectionTitle"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                💰 Funds Leaderboard
            </motion.div>

            {/* ── Loading skeleton ── */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        className="skeletonWrap"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="skeletonCard" style={{ animationDelay: `${i * 0.12}s` }} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Participated Boards ── */}
            {!loading && (
                <div className="leaderboardCards">
                    {participated.map((b, i) => (
                        <LeaderboardCard key={i} b={b} index={i} isTop={i === 0} />
                    ))}
                </div>
            )}

            {/* ── Not Participated ── */}
            <AnimatePresence>
                {!loading && notParticipated.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="notPlayedHeader">❌ Not Participated Boards</div>

                        <div className="leaderboardCards">
                            {notParticipated.map((b, i) => (
                                <motion.div
                                    key={i}
                                    className="leaderboardCard notPlayedCard"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                                    whileHover={{ x: 4 }}
                                >
                                    <div className="cardLeft">
                                        <div className="rankBox rankDash">—</div>
                                        <div className="boardName">{b.board_name}</div>
                                    </div>
                                    <div className="cardStats">
                                        <div className="statValue red">No Tournament Activity</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}