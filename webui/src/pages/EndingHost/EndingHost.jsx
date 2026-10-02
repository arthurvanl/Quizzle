import "./styles.sass";
import {useContext, useEffect, useState} from "react";
import {QuizContext} from "@/common/contexts/Quiz";
import {useNavigate} from "react-router-dom";
import Podium from "@/pages/EndingHost/components/Podium";
import AnalyticsTabs from "@/common/components/AnalyticsTabs";
import Button from "@/common/components/Button";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChartBar, faTrophy, faDownload, faHouse} from "@fortawesome/free-solid-svg-icons";
import {useSoundManager} from "@/common/utils/SoundManager.js";
import SoundRenderer from "@/common/components/SoundRenderer";
import SoundControl from "@/common/components/SoundControl";
import {exportLiveQuizToExcel} from "@/common/utils/ExcelExport";
import {getCharacterEmoji} from "@/common/data/characters";
import toast from "react-hot-toast";

export const EndingHost = () => {
    const {isLoaded, scoreboard} = useContext(QuizContext);
    const navigate = useNavigate();
    const soundManager = useSoundManager();
    const [activeView, setActiveView] = useState('scoreboard');
    const [analyticsData, setAnalyticsData] = useState(null);
    const [hasPlayedEndingSound, setHasPlayedEndingSound] = useState(false);

    useEffect(() => {
        if (!isLoaded) {
            navigate("/load");
            return;
        }

        if (scoreboard?.analytics) {
            setAnalyticsData(scoreboard.analytics);
        }
    }, [isLoaded, scoreboard]);

    useEffect(() => {
        if (!isLoaded) return;

        if (!hasPlayedEndingSound) {
            const timer = setTimeout(() => {
                soundManager.playCelebration('GAME_COMPLETE');
                setHasPlayedEndingSound(true);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [isLoaded, soundManager, hasPlayedEndingSound]);

    const handleExportToExcel = () => {
        if (!analyticsData) {
            toast.error('No analytics data available to export');
            return;
        }

        try {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
            const quizName = `LiveQuiz_${timestamp}`;
            const filename = exportLiveQuizToExcel(analyticsData, quizName);
            toast.success(`Analytics exported: ${filename}`);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Failed to export data');
        }
    };

    const viewTabs = [
        {id: 'scoreboard', title: 'Results', icon: faTrophy},
        {id: 'analytics', title: 'Analytics', icon: faChartBar}
    ];

    return (
        <div className={`ending-page ${activeView === 'scoreboard' ? 'ending-page--scoreboard' : ''}`}>
            <SoundRenderer/>
            <div className="ending-sound-control">
                <SoundControl />
            </div>

            <div className="view-toggle" role="tablist" aria-label="Switch view">
                {viewTabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`toggle-button ${activeView === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveView(tab.id)}
                        role="tab"
                        aria-selected={activeView === tab.id}
                    >
                        <FontAwesomeIcon icon={tab.icon} aria-hidden="true"/>
                        <span>{tab.title}</span>
                    </button>
                ))}
            </div>

            {activeView === 'analytics' && analyticsData && (
                <div className="export-button-container">
                    <Button
                        text="Download as Excel"
                        icon={faDownload}
                        onClick={handleExportToExcel}
                        type="compact green"
                    />
                </div>
            )}

            {activeView === 'scoreboard' && (
                <>
                    <div className="ending-home-button">
                        <Button onClick={() => location.reload()} text="Home"
                                padding="1rem 1.5rem" icon={faHouse}/>
                    </div>
                    {(() => {
                        const sorted = Object.values(scoreboard?.scoreboard || {})
                            .sort((a, b) => b.points - a.points);
                        const rest = sorted.slice(3);
                        if (rest.length === 0) return null;
                        return (
                            <div className="ending-rest-list">
                                {rest.map((player, i) => (
                                    <div key={player.name} className="ending-rest-row">
                                        <span className="ending-rest-rank">{i + 4}</span>
                                        <span className="ending-rest-character">{getCharacterEmoji(player.character)}</span>
                                        <span className="ending-rest-name">{player.name}</span>
                                        <span className="ending-rest-points">{player.points.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                    <Podium
                        scoreboard={Object.values(scoreboard?.scoreboard || {})}
                        analytics={analyticsData}
                        totalQuestions={analyticsData?.questionAnalytics?.length}
                    />
                </>
            )}

            {activeView === 'analytics' && analyticsData && (
                <div className="analytics-container">
                    <AnalyticsTabs
                        analyticsData={analyticsData}
                        quizData={null}
                        isLiveQuiz={true}
                    />
                </div>
            )}

            {activeView === 'analytics' && !analyticsData && (
                <div className="no-analytics">
                    <p>No analytics data available. Please make sure the quiz was ended properly.</p>
                </div>
            )}
        </div>
    )
}