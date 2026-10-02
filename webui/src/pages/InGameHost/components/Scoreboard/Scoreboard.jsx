import "./styles.sass";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faForward, faHouse, faArrowUp, faBolt} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/components/Button";
import {useEffect, useMemo, useRef, useState} from "react";
import {LayoutGroup, motion} from "framer-motion";
import {getCharacterEmoji} from "@/common/data/characters";
import {useSoundManager} from "@/common/utils/SoundManager.js";
import AnimatedCounter from "@/pages/InGameHost/components/AnimatedCounter";

export const Scoreboard = ({scoreboard, nextQuestion, isEnd, hideTop3}) => {
    const prevRanksRef = useRef({});
    const [animatedPlayers, setAnimatedPlayers] = useState([]);
    const [pointsAnimationPhase, setPointsAnimationPhase] = useState('initial');
    const soundManager = useSoundManager();
    const hasPlayedSoundRef = useRef(false);

    const goHome = () => {
        location.reload();
    }

    const sorted = [...scoreboard].sort((a, b) => b.points - a.points);

    useEffect(() => {
        let isMounted = true;
        const timeouts = [];
        let soundInterval;
        
        const prevRanks = prevRanksRef.current;
        const withChanges = sorted.map((player, index) => {
            const prevRank = prevRanks[player.name];
            const currentRank = index + 1;
            const positionChange = prevRank !== undefined ? prevRank - currentRank : 0;

            const previousPoints = player.points - (player.lastRoundPoints || 0);
            return { ...player, rank: currentRank, positionChange, previousPoints };
        });

        const hasRoundPoints = withChanges.some(p => (p.lastRoundPoints || 0) > 0);

        setAnimatedPlayers(withChanges);
        setPointsAnimationPhase('initial');
        hasPlayedSoundRef.current = false;

        timeouts.push(setTimeout(() => {
            if (isMounted) setPointsAnimationPhase('flying');
        }, 400));

        timeouts.push(setTimeout(() => {
            if (!isMounted) return;
            setPointsAnimationPhase('counting');
            if (hasRoundPoints && !hasPlayedSoundRef.current) {
                hasPlayedSoundRef.current = true;
                soundManager.playFeedback('POINTS_ADD');
                let playCount = 0;
                const maxPlays = 6;
                soundInterval = setInterval(() => {
                    if (!isMounted) {
                        clearInterval(soundInterval);
                        return;
                    }
                    playCount++;
                    if (playCount < maxPlays) {
                        soundManager.playFeedback('POINTS_ADD');
                    } else {
                        clearInterval(soundInterval);
                    }
                }, 120);
            }
        }, 700));

        timeouts.push(setTimeout(() => {
            if (!isMounted) return;
            setPointsAnimationPhase('reordering');
            const risers = withChanges
                .filter(p => (p.positionChange || 0) > 0)
                .sort((a, b) => Math.abs(a.positionChange) - Math.abs(b.positionChange));
            risers.forEach((p, i) => {
                const t = setTimeout(() => {
                    if (isMounted) soundManager.playFeedback('POINTS_ADD');
                }, Math.abs(p.positionChange) * 80 + i * 60);
                timeouts.push(t);
            });
        }, 1500));

        const newRanks = {};
        sorted.forEach((player, i) => { newRanks[player.name] = i + 1; });
        prevRanksRef.current = newRanks;
        
        return () => {
            isMounted = false;
            timeouts.forEach(t => clearTimeout(t));
            if (soundInterval) clearInterval(soundInterval);
        };
    }, [scoreboard]);

    const displayPlayers = useMemo(() => {
        const useNewOrder = pointsAnimationPhase === 'reordering';
        return [...animatedPlayers].sort((a, b) => {
            if (useNewOrder) return b.points - a.points;
            const aPrev = a.previousPoints ?? a.points;
            const bPrev = b.previousPoints ?? b.points;
            if (bPrev !== aPrev) return bPrev - aPrev;
            return a.name.localeCompare(b.name);
        });
    }, [animatedPlayers, pointsAnimationPhase]);

    return (
        <div className="scoreboard">
            <div className="top-area">
                {!isEnd && <Button onClick={nextQuestion} text="Next"
                        padding="1rem 1.5rem" icon={faForward}/>}
                {isEnd && <Button onClick={goHome} text="Home"
                        padding="1rem 1.5rem" icon={faHouse}/>}
            </div>
            {!hideTop3 && <h1>{isEnd ? "Final standings" : "Leaderboard"}</h1>}

            <div className="scoreboard-players">
                <LayoutGroup>
                    {displayPlayers.map((player, index) => {
                        if (hideTop3 && index < 3) return null;
                        const hasRoundPoints = (player.lastRoundPoints || 0) > 0;
                        const showFlyingPoints = hasRoundPoints && pointsAnimationPhase === 'flying';
                        const showCounting = pointsAnimationPhase === 'counting' || pointsAnimationPhase === 'reordering';
                        const delayMs = index * 80;
                        const isReordering = pointsAnimationPhase === 'reordering';
                        const moved = (player.positionChange || 0) !== 0;
                        const rising = (player.positionChange || 0) > 0;
                        const highlightClass = isReordering && moved
                            ? (rising ? 'row-rising' : 'row-falling')
                            : '';

                        return (
                            <motion.div
                                key={player.name}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: 1,
                                    scale: isReordering && rising ? [1, 1.05, 1] : 1,
                                }}
                                transition={{
                                    layout: {
                                        type: "spring",
                                        stiffness: 120,
                                        damping: 16,
                                        mass: 0.9,
                                        delay: isReordering && moved ? Math.abs(player.positionChange) * 0.05 : 0,
                                    },
                                    opacity: { duration: 0.25, delay: index * 0.04 },
                                    scale: { duration: 0.55, times: [0, 0.4, 1], ease: "easeInOut" },
                                }}
                                style={{
                                    zIndex: isReordering && rising
                                        ? 20 + Math.abs(player.positionChange)
                                        : (isReordering && moved ? 2 : 1),
                                }}
                                className={`scoreboard-player ${!hideTop3 && index === 0 ? 'scoreboard-top-1' : ''} ${highlightClass}`}
                            >
                                <div className="player-left">
                                    <div className="player-character">
                                        {getCharacterEmoji(player.character)}
                                    </div>
                                    <h2 className="player-name">{player.name}</h2>
                                </div>
                                <div className="player-right">
                                    {hasRoundPoints && (
                                        <span
                                            className={`round-points ${showFlyingPoints ? 'round-points-flying' : ''} ${showCounting ? 'round-points-merged' : ''}`}
                                            style={{ animationDelay: `${delayMs}ms` }}
                                        >
                                            <FontAwesomeIcon icon={faBolt} />+{player.lastRoundPoints}
                                        </span>
                                    )}
                                    <h2 className="total-points">
                                        {showCounting ? (
                                            <AnimatedCounter
                                                value={player.points}
                                                previousValue={player.previousPoints}
                                                delay={delayMs}
                                                duration={800}
                                            />
                                        ) : (
                                            player.previousPoints
                                        )}
                                    </h2>
                                    {rising && (
                                        <span className="rise-indicator" aria-label={`${player.positionChange} places up`}>
                                            <FontAwesomeIcon icon={faArrowUp} />
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </LayoutGroup>
            </div>
        </div>
    )
}