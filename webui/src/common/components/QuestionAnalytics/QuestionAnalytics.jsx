import React from 'react';
import './styles.sass';

const DIFFICULTY_LABEL = {easy: 'Easy', medium: 'Medium', hard: 'Hard'};

const QuestionAnalytics = ({analyticsData}) => {
    const {questionAnalytics} = analyticsData;

    return (
        <div className="question-analytics">
            <div className="qa-list">
                {questionAnalytics.map((q, index) => {
                    const total = q.totalResponses || 1;
                    const correctPct = (q.correctCount / total) * 100;
                    const partialPct = ((q.partialCount || 0) / total) * 100;
                    const incorrectPct = (q.incorrectCount / total) * 100;

                    return (
                        <div key={index} className="qa-row">
                            <div className="qa-top">
                                <div className="qa-number">Question {index + 1}</div>
                                <div className={`qa-difficulty ${q.difficulty}`}>
                                    {DIFFICULTY_LABEL[q.difficulty] || '—'}
                                </div>
                                <div className="qa-percentage">{q.correctPercentage}%</div>
                            </div>

                            <div className="qa-title">{q.title}</div>

                            <div className="qa-bar">
                                {correctPct > 0 && <div className="qa-seg correct" style={{width: `${correctPct}%`}}/>}
                                {partialPct > 0 && <div className="qa-seg partial" style={{width: `${partialPct}%`}}/>}
                                {incorrectPct > 0 && <div className="qa-seg incorrect" style={{width: `${incorrectPct}%`}}/>}
                            </div>

                            <div className="qa-counts">
                                <span className="correct">{q.correctCount} richtig</span>
                                {q.partialCount > 0 && <span className="partial">{q.partialCount} teilweise</span>}
                                <span className="incorrect">{q.incorrectCount} falsch</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default QuestionAnalytics;