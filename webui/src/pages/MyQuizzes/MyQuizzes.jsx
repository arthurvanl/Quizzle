import {useContext, useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {AuthContext} from "@/common/contexts/Auth";
import {BrandingContext} from "@/common/contexts/Branding";
import {jsonRequest} from "@/common/utils/RequestUtil.js";
import Dialog from "@/common/components/Dialog";
import QuizQuestions from "@/common/components/QuizQuestions";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChalkboardTeacher, faChartBar, faEye, faListUl} from "@fortawesome/free-solid-svg-icons";
import {motion} from "framer-motion";
import toast from "react-hot-toast";
import "@/pages/Admin/styles.sass";
import "./styles.sass";

export const MyQuizzes = () => {
    const {user} = useContext(AuthContext);
    const {titleImg} = useContext(BrandingContext);

    const [quizzes, setQuizzes] = useState(null);
    const [viewedQuiz, setViewedQuiz] = useState(null);

    useEffect(() => {
        jsonRequest('/account/quizzes')
            .then(data => setQuizzes(data.quizzes || []))
            .catch(() => {
                toast.error('Could not load quizzes.');
                setQuizzes([]);
            });
    }, []);

    const viewQuiz = async (q) => {
        try {
            const data = await jsonRequest(`/account/quizzes/${q.type}/${q.id}`);
            if (!data.quiz) throw new Error(data.message);
            setViewedQuiz({...q, quiz: data.quiz});
        } catch (error) {
            toast.error(error.message || 'Could not load quiz.');
        }
    };

    const formatDate = (date) => new Date(date).toLocaleString('en-GB', {dateStyle: 'medium', timeStyle: 'short'});

    if (quizzes === null) return null;

    return (
        <div className="admin-page my-quizzes-page">
            <motion.div className="admin-header" initial={{opacity: 0, y: -20}} animate={{opacity: 1, y: 0}}>
                <Link to="/"><img src={titleImg} alt="logo" className="admin-logo"/></Link>
                <div className="admin-header-right">
                    <span className="admin-user-info">
                        <FontAwesomeIcon icon={faChalkboardTeacher}/>
                        {user?.username}
                    </span>
                </div>
            </motion.div>

            <motion.div className="admin-content" initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}}>
                <div className="admin-panel">
                    <div className="settings-section">
                        <h2><FontAwesomeIcon icon={faListUl}/> My quizzes</h2>
                        <p className="section-description">All live and practice quizzes you have created.</p>

                        <div className="user-list">
                            {quizzes.length === 0 && <div className="quiz-empty">You have not created any quizzes yet.</div>}
                            {quizzes.map(q => (
                                <div key={`${q.type}-${q.id}`} className="user-card">
                                    <div className="user-info">
                                        <div>
                                            <span className="user-name">{q.title}</span>
                                            <span className="user-role">
                                                {q.type === 'live' ? 'Live quiz' : 'Practice quiz'} · {q.id} · {q.questionCount} {q.questionCount === 1 ? 'question' : 'questions'} · {formatDate(q.created)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="user-actions">
                                        <button className="icon-btn" title="View questions" onClick={() => viewQuiz(q)}>
                                            <FontAwesomeIcon icon={faEye}/>
                                        </button>
                                        {q.type === 'practice' && (
                                            <Link className="icon-btn" title="View results" to={`/results/${q.id}`}>
                                                <FontAwesomeIcon icon={faChartBar}/>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            <Dialog
                isOpen={!!viewedQuiz}
                onClose={() => setViewedQuiz(null)}
                onConfirm={() => setViewedQuiz(null)}
                title={viewedQuiz?.title || 'Quiz'}
                confirmText="Close"
                showCancelButton={false}
            >
                {viewedQuiz && <QuizQuestions quiz={viewedQuiz.quiz}/>}
            </Dialog>
        </div>
    );
};
