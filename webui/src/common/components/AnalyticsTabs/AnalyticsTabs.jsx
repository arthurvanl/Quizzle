import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartPie, faUsers, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import ClassOverview from '../ClassOverview';
import StudentAnalytics from '../StudentAnalytics';
import QuestionAnalytics from '../QuestionAnalytics';
import './styles.sass';

const AnalyticsTabs = ({ analyticsData, quizData, isLiveQuiz = false }) => {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        {id: 'overview', title: 'Overview', icon: faChartPie, component: ClassOverview},
        {id: 'students', title: 'Students', icon: faUsers, component: StudentAnalytics},
        {id: 'questions', title: 'Questions', icon: faQuestionCircle, component: QuestionAnalytics}
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

    return (
        <div className="analytics-tabs">
            <div className="tab-navigation" role="tablist" aria-label="Analytics Tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`tabpanel-${tab.id}`}
                        id={`tab-${tab.id}`}
                    >
                        <FontAwesomeIcon icon={tab.icon} aria-hidden="true" />
                        <span>{tab.title}</span>
                    </button>
                ))}
            </div>

            <div className="tab-content" role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
                {ActiveComponent && (
                    <ActiveComponent 
                        analyticsData={analyticsData} 
                        quizData={quizData}
                        isLiveQuiz={isLiveQuiz}
                    />
                )}
            </div>
        </div>
    );
};

export default AnalyticsTabs;