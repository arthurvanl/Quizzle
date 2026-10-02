import React from 'react';
import './styles.sass';

const ClassOverview = ({analyticsData, isLiveQuiz}) => {
    const {classAnalytics, questionAnalytics} = analyticsData;

    const difficulty = questionAnalytics.reduce((acc, q) => {
        acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
        return acc;
    }, {});
    const total = questionAnalytics.length || 1;
    const easy = difficulty.easy || 0;
    const medium = difficulty.medium || 0;
    const hard = difficulty.hard || 0;

    const stats = [
        {label: 'Participants', value: classAnalytics.totalStudents},
        {label: 'Questions', value: classAnalytics.totalQuestions},
        {label: 'Avg. accuracy', value: `${classAnalytics.averageAccuracy}%`, accent: classAnalytics.averageAccuracy >= 80 ? 'green' : classAnalytics.averageAccuracy >= 60 ? 'orange' : 'red'},
        ...(isLiveQuiz ? [{label: 'Avg. points', value: classAnalytics.averageScore}] : [])
    ];

    return (
        <div className="class-overview">
            <div className="overview-stats">
                {stats.map((s) => (
                    <div key={s.label} className={`overview-stat ${s.accent || ''}`}>
                        <div className="overview-stat-value">{s.value}</div>
                        <div className="overview-stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="overview-card">
                <h3>Difficulty distribution</h3>
                <div className="difficulty-bar">
                    {easy > 0 && <div className="difficulty-seg easy" style={{flex: easy}} title={`${easy} easy`}/>}
                    {medium > 0 && <div className="difficulty-seg medium" style={{flex: medium}} title={`${medium} medium`}/>}
                    {hard > 0 && <div className="difficulty-seg hard" style={{flex: hard}} title={`${hard} hard`}/>}
                </div>
                <div className="difficulty-legend">
                    <span><span className="dot easy"/>Easy · {easy}</span>
                    <span><span className="dot medium"/>Medium · {medium}</span>
                    <span><span className="dot hard"/>Hard · {hard}</span>
                </div>
            </div>
        </div>
    );
};

export default ClassOverview;