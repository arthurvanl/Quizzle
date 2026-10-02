import "./styles.sass";
import {motion} from "framer-motion";
import {getCharacterEmoji} from "@/common/data/characters";

const ORDER = [1, 0, 2];
const HEIGHTS = {0: "22rem", 1: "16rem", 2: "12rem"};
const MEDAL_COLORS = {
    0: {fill: "#FFC83F", stroke: "#E0A400", text: "#4a2f00"},
    1: {fill: "#CDD3DC", stroke: "#9AA2AF", text: "#2a2f3a"},
    2: {fill: "#E38A4E", stroke: "#B66A30", text: "#3a1f08"}
};

const PentagonMedal = ({rank, colors}) => (
    <svg className="podium-pentagon" viewBox="0 0 100 100">
        <polygon
            points="50,6 94,38 77,92 23,92 6,38"
            fill={colors.fill}
            stroke={colors.stroke}
            strokeWidth="5"
            strokeLinejoin="round"
        />
        <text
            x="50"
            y="65"
            textAnchor="middle"
            fontSize="48"
            fontWeight="900"
            fill={colors.text}
            fontFamily="inherit"
        >
            {rank}
        </text>
    </svg>
);

export const Podium = ({scoreboard, analytics, totalQuestions}) => {
    const sorted = [...scoreboard].sort((a, b) => b.points - a.points).slice(0, 3);

    const findAnalytics = (player) => {
        if (!analytics || !analytics.studentAnalytics) return null;
        return analytics.studentAnalytics.find(s => s.name === player.name) || null;
    };

    return (
        <div className="podium">
            {ORDER.map((rankIndex) => {
                const player = sorted[rankIndex];
                if (!player) return <div key={`empty-${rankIndex}`} className="podium-slot podium-empty"/>;
                const stats = findAnalytics(player);
                const rank = rankIndex + 1;
                const colors = MEDAL_COLORS[rankIndex];
                const delay = 0.4 + (3 - rank) * 1.2;

                return (
                    <div key={player.name} className={`podium-slot podium-rank-${rank}`}>
                        <motion.div
                            className="podium-nameplate"
                            initial={{opacity: 0, y: -20, scale: 0.8}}
                            animate={{opacity: 1, y: 0, scale: 1}}
                            transition={{duration: 0.55, delay: delay + 0.1, type: "spring", stiffness: 180, damping: 18}}
                        >
                            <span className="podium-character">{getCharacterEmoji(player.character)}</span>
                            <h2>{player.name}</h2>
                        </motion.div>

                        <motion.div
                            className="podium-pillar"
                            style={{height: HEIGHTS[rankIndex]}}
                            initial={{height: 0}}
                            animate={{height: HEIGHTS[rankIndex]}}
                            transition={{duration: 1.0, delay, ease: [0.22, 1, 0.36, 1]}}
                        >
                            <motion.div
                                className="podium-medal-wrap"
                                initial={{scale: 0, rotate: -180, opacity: 0}}
                                animate={{scale: 1, rotate: 0, opacity: 1}}
                                transition={{duration: 0.8, delay: delay + 0.8, type: "spring", stiffness: 140, damping: 14}}
                            >
                                <PentagonMedal rank={rank} colors={colors}/>
                            </motion.div>

                            <motion.div
                                className="podium-pillar-content"
                                initial={{opacity: 0}}
                                animate={{opacity: 1}}
                                transition={{duration: 0.45, delay: delay + 1.0}}
                            >
                                <div className="podium-points">
                                    {player.points.toLocaleString()}
                                </div>
                                {stats && (
                                    <div className="podium-accuracy">
                                        {stats.correctAnswers} of {totalQuestions || stats.totalAnswered} correct
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    </div>
                );
            })}
        </div>
    );
};