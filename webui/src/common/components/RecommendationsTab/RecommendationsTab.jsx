import React from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faExclamationTriangle,
    faCheckCircle,
    faUsers,
    faQuestionCircle,
} from '@fortawesome/free-solid-svg-icons';
import './styles.sass';

const RecommendationsTab = ({analyticsData}) => {
    const {classAnalytics, questionAnalytics, studentAnalytics} = analyticsData;

    const recommendations = [];

    const strugglingStudents = studentAnalytics.filter(s => s.needsAttention);
    const hardQuestions = questionAnalytics.filter(q => q.needsReview);

    if (strugglingStudents.length > 0) {
        recommendations.push({
            type: 'urgent',
            icon: faExclamationTriangle,
            title: `${strugglingStudents.length} students need help`,
            students: strugglingStudents.map(s => `${s.name} (${s.accuracy}%)`)
        });
    }

    if (hardQuestions.length > 0) {
        recommendations.push({
            type: 'warning',
            icon: faQuestionCircle,
            title: `${hardQuestions.length} hard questions`,
            questions: hardQuestions.map(q => `Question ${q.questionIndex + 1}: ${q.correctPercentage}%`)
        });
    }

    if (classAnalytics.averageAccuracy < 60) {
        recommendations.push({
            type: 'urgent',
            icon: faUsers,
            title: `Low class performance: ${classAnalytics.averageAccuracy}%`,
            action: 'Reviewing the material is recommended'
        });
    } else if (classAnalytics.averageAccuracy >= 80) {
        recommendations.push({
            type: 'success',
            icon: faCheckCircle,
            title: `Good class performance: ${classAnalytics.averageAccuracy}%`,
            action: 'Class is ready for new topics'
        });
    }

    return (
        <div className="recommendations-tab">
            {recommendations.length > 0 ? (
                <div className="recommendations-list">
                    {recommendations.map((rec, index) => (
                        <div key={index} className={`recommendation-card ${rec.type}`}>
                            <div className="recommendation-header">
                                <FontAwesomeIcon
                                    icon={rec.icon}
                                    className={`recommendation-icon ${rec.type}`}
                                />
                                <h3>{rec.title}</h3>
                            </div>

                            <div className="recommendation-content">
                                {rec.action && (
                                    <p className="recommendation-action">{rec.action}</p>
                                )}

                                {rec.students && (
                                    <div className="recommendation-details">
                                        <h4>Students:</h4>
                                        <ul>
                                            {rec.students.map((student, i) => (
                                                <li key={i}>{student}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {rec.questions && (
                                    <div className="recommendation-details">
                                        <h4>Questions:</h4>
                                        <ul>
                                            {rec.questions.map((question, i) => (
                                                <li key={i}>{question}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="no-recommendations">
                    <FontAwesomeIcon icon={faCheckCircle}/>
                    <h3>No issues detected</h3>
                    <p>The class is performing well.</p>
                </div>
            )}
        </div>
    );
};

export default RecommendationsTab;