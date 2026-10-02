import {useContext, useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {AuthContext} from "@/common/contexts/Auth";
import {BrandingContext} from "@/common/contexts/Branding";
import {jsonRequest, postRequest, putRequest, deleteRequest} from "@/common/utils/RequestUtil.js";
import Button from "@/common/components/Button";
import Input from "@/common/components/Input";
import SelectBox from "@/common/components/SelectBox";
import Dialog from "@/common/components/Dialog";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faUsers, faRobot, faPalette, faPlus, faTrash,
    faShieldAlt, faChalkboardTeacher, faKey, faRightFromBracket, faUpload, faRotateLeft, faImage,
    faListUl, faChartBar
} from "@fortawesome/free-solid-svg-icons";
import {motion} from "framer-motion";
import toast from "react-hot-toast";
import "./styles.sass";

const AI_PROVIDERS = [
    {value: '', label: 'Disabled'},
    {value: 'openai', label: 'OpenAI'},
    {value: 'anthropic', label: 'Anthropic'},
    {value: 'google', label: 'Google'},
    {value: 'ollama', label: 'Ollama'}
];

export const Admin = () => {
    const {user, isAdmin, logout} = useContext(AuthContext);
    const {titleImg, logoImg, refreshBranding} = useContext(BrandingContext);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('ai');
    const [settings, setSettings] = useState(null);
    const [users, setUsers] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [quizOwnerFilter, setQuizOwnerFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    const [aiProvider, setAiProvider] = useState('');
    const [aiApiKey, setAiApiKey] = useState('');
    const [aiModel, setAiModel] = useState('');
    const [aiBaseUrl, setAiBaseUrl] = useState('');
    const [aiModels, setAiModels] = useState([]);
    const [modelsLoading, setModelsLoading] = useState(false);

    const [unsplashAccessKey, setUnsplashAccessKey] = useState('');
    const [giphyApiKey, setGiphyApiKey] = useState('');

    const [brandName, setBrandName] = useState('');
    const [brandColor, setBrandColor] = useState('');
    const [brandImprint, setBrandImprint] = useState('');
    const [brandPrivacy, setBrandPrivacy] = useState('');

    const [logoPreview, setLogoPreview] = useState(null);
    const [titlePreview, setTitlePreview] = useState(null);

    const [showNewUserDialog, setShowNewUserDialog] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('teacher');
    const [newUserError, setNewUserError] = useState('');

    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [passwordResetUserId, setPasswordResetUserId] = useState(null);
    const [newPasswordValue, setNewPasswordValue] = useState('');

    useEffect(() => {
        if (!isAdmin) {
            navigate('/');
            return;
        }
        loadSettings();
        loadUsers();
    }, [isAdmin, navigate]);

    useEffect(() => {
        if (isAdmin && activeTab === 'quizzes') loadQuizzes();
    }, [isAdmin, activeTab]);

    useEffect(() => {
        if (!aiProvider) {
            setAiModels([]);
            return;
        }
        fetchModels(aiProvider, aiApiKey, aiBaseUrl);
    }, [aiProvider, aiApiKey, aiBaseUrl]);

    const fetchModels = async (provider, apiKey, baseUrl) => {
        setModelsLoading(true);
        try {
            const data = await postRequest('/admin/models', {provider, apiKey, baseUrl});
            setAiModels((data.models || []).map(m => ({value: m, label: m})));
        } catch {
            setAiModels([]);
        } finally {
            setModelsLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const data = await jsonRequest('/admin/settings');
            setSettings(data);
            setAiProvider(data.config?.ai?.provider || '');
            setAiApiKey(data.config?.ai?.apiKey || '');
            setAiModel(data.config?.ai?.model || '');
            setAiBaseUrl(data.config?.ai?.baseUrl || '');
            setUnsplashAccessKey(data.config?.media?.unsplashAccessKey || '');
            setGiphyApiKey(data.config?.media?.giphyApiKey || '');
            setBrandName(data.branding?.name || '');
            setBrandColor(data.branding?.color || '');
            setBrandImprint(data.branding?.imprint || '');
            setBrandPrivacy(data.branding?.privacy || '');
        } catch (error) {
            toast.error('Could not load settings.');
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const data = await jsonRequest('/admin/users');
            setUsers(data.users || []);
        } catch (error) {
            toast.error('Could not load users.');
        }
    };

    const loadQuizzes = async () => {
        try {
            const data = await jsonRequest('/admin/quizzes');
            setQuizzes(data.quizzes || []);
        } catch (error) {
            toast.error('Could not load quizzes.');
        }
    };

    const quizOwnerOptions = [
        {value: 'all', label: 'All accounts'},
        ...users.map(u => ({value: u.id, label: u.username})),
        ...(quizzes.some(q => !q.createdBy) ? [{value: 'unknown', label: 'Unknown creator'}] : [])
    ];

    const filteredQuizzes = quizzes.filter(q => {
        if (quizOwnerFilter === 'all') return true;
        if (quizOwnerFilter === 'unknown') return !q.createdBy;
        return q.createdBy === quizOwnerFilter;
    });

    const formatDate = (date) => new Date(date).toLocaleString('en-GB', {dateStyle: 'medium', timeStyle: 'short'});

    const saveAiSettings = async () => {
        try {
            await putRequest('/admin/settings', {
                config: {ai: {provider: aiProvider, apiKey: aiApiKey, model: aiModel, baseUrl: aiBaseUrl}}
            });
            toast.success('AI settings saved.');
        } catch (error) {
            toast.error(error.message || 'Failed to save.');
        }
    };

    const saveMediaSettings = async () => {
        try {
            await putRequest('/admin/settings', {
                config: {media: {unsplashAccessKey, giphyApiKey}}
            });
            toast.success('Media settings saved.');
        } catch (error) {
            toast.error(error.message || 'Failed to save.');
        }
    };

    const saveBrandingSettings = async () => {
        try {
            await putRequest('/admin/settings', {
                branding: {name: brandName, color: brandColor, imprint: brandImprint, privacy: brandPrivacy}
            });
            toast.success('Branding saved. Changes take effect after a restart.');
        } catch (error) {
            toast.error(error.message || 'Failed to save.');
        }
    };

    const handleImageSelect = (type, e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image is too large (max. 5 MB).');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            if (type === 'logo') setLogoPreview(reader.result);
            else setTitlePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const uploadImage = async (type) => {
        const image = type === 'logo' ? logoPreview : titlePreview;
        if (!image) return;

        try {
            await putRequest(`/admin/branding/${type}`, {image});
            toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} uploaded.`);
            if (type === 'logo') setLogoPreview(null);
            else setTitlePreview(null);
            refreshBranding?.();
        } catch (error) {
            toast.error(error.message || 'Failed to upload.');
        }
    };

    const resetImage = async (type) => {
        try {
            await deleteRequest(`/admin/branding/${type}`);
            toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} reset.`);
            if (type === 'logo') setLogoPreview(null);
            else setTitlePreview(null);
            refreshBranding?.();
        } catch (error) {
            toast.error(error.message || 'Failed to reset.');
        }
    };

    const createUser = async () => {
        if (!newUsername.trim() || !newPassword) {
            setNewUserError('All fields are required.');
            return;
        }
        try {
            await postRequest('/admin/users', {
                username: newUsername.trim(),
                password: newPassword,
                role: newRole
            });
            toast.success(`User "${newUsername}" created.`);
            setShowNewUserDialog(false);
            setNewUsername('');
            setNewPassword('');
            setNewRole('teacher');
            setNewUserError('');
            loadUsers();
        } catch (error) {
            setNewUserError(error.message || 'Failed to create.');
        }
    };

    const deleteUserHandler = async (userId, username) => {
        if (!confirm(`Really delete user "${username}"?`)) return;
        try {
            await deleteRequest(`/admin/users/${userId}`);
            toast.success(`User "${username}" deleted.`);
            loadUsers();
        } catch (error) {
            toast.error(error.message || 'Failed to delete.');
        }
    };

    const toggleRole = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'teacher' : 'admin';
        try {
            await putRequest(`/admin/users/${userId}/role`, {role: newRole});
            toast.success('Role updated.');
            loadUsers();
        } catch (error) {
            toast.error(error.message || 'Failed to update.');
        }
    };

    const resetPassword = async () => {
        if (!newPasswordValue || newPasswordValue.length < 6) {
            toast.error('Password must be at least 6 characters long.');
            return;
        }
        try {
            await putRequest(`/admin/users/${passwordResetUserId}/password`, {password: newPasswordValue});
            toast.success('Password reset.');
            setShowPasswordDialog(false);
            setPasswordResetUserId(null);
            setNewPasswordValue('');
        } catch (error) {
            toast.error(error.message || 'Failed to reset.');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (loading) return null;

    return (
        <div className="admin-page">
            <motion.div className="admin-header" initial={{opacity: 0, y: -20}} animate={{opacity: 1, y: 0}}>
                <Link to="/"><img src={titleImg} alt="logo" className="admin-logo"/></Link>
                <div className="admin-header-right">
                    <span className="admin-user-info">
                        <FontAwesomeIcon icon={faShieldAlt}/>
                        {user?.username}
                    </span>
                    <Button text="Log out" icon={faRightFromBracket} type="secondary compact" onClick={handleLogout}/>
                </div>
            </motion.div>

            <motion.div className="admin-content" initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}}>
                <div className="admin-sidebar">
                    <button className={`sidebar-item ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
                        <FontAwesomeIcon icon={faRobot}/> AI configuration
                    </button>
                    <button className={`sidebar-item ${activeTab === 'media' ? 'active' : ''}`} onClick={() => setActiveTab('media')}>
                        <FontAwesomeIcon icon={faImage}/> Media
                    </button>
                    <button className={`sidebar-item ${activeTab === 'branding' ? 'active' : ''}`} onClick={() => setActiveTab('branding')}>
                        <FontAwesomeIcon icon={faPalette}/> Branding
                    </button>
                    <button className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                        <FontAwesomeIcon icon={faUsers}/> User management
                    </button>
                    <button className={`sidebar-item ${activeTab === 'quizzes' ? 'active' : ''}`} onClick={() => setActiveTab('quizzes')}>
                        <FontAwesomeIcon icon={faListUl}/> Quizzes
                    </button>
                </div>

                <div className="admin-panel">
                    {activeTab === 'ai' && (
                        <motion.div className="settings-section" initial={{opacity: 0}} animate={{opacity: 1}}>
                            <h2><FontAwesomeIcon icon={faRobot}/> AI configuration</h2>
                            <p className="section-description">Configure the AI provider for automatic quiz generation.</p>

                            <div className="settings-form">
                                <div className="form-group">
                                    <label>Provider</label>
                                    <SelectBox value={aiProvider} onChange={setAiProvider} options={AI_PROVIDERS} placeholder="Select provider..."/>
                                </div>

                                {aiProvider && (
                                    <>
                                        {aiProvider !== 'ollama' && (
                                            <div className="form-group">
                                                <label>API key</label>
                                                <Input placeholder="sk-..." value={aiApiKey} onChange={(e) => setAiApiKey(e.target.value)}/>
                                            </div>
                                        )}
                                        <div className="form-group">
                                            <label>Model</label>
                                            <SelectBox
                                                value={aiModel}
                                                onChange={setAiModel}
                                                options={aiModels}
                                                placeholder={modelsLoading ? 'Loading models...' : 'Select model...'}
                                                disabled={modelsLoading}
                                            />
                                        </div>
                                        {aiProvider === 'ollama' && (
                                            <div className="form-group">
                                                <label>Base URL</label>
                                                <Input placeholder="http://localhost:11434" value={aiBaseUrl} onChange={(e) => setAiBaseUrl(e.target.value)}/>
                                            </div>
                                        )}
                                    </>
                                )}

                                <Button text="Save" type="green compact" onClick={saveAiSettings}/>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'media' && (
                        <motion.div className="settings-section" initial={{opacity: 0}} animate={{opacity: 1}}>
                            <h2><FontAwesomeIcon icon={faImage}/> Media</h2>
                            <p className="section-description">Configure API keys for image search in the quiz editor. Both services are free.</p>

                            <div className="settings-form">
                                <div className="form-group">
                                    <label>Unsplash Access Key</label>
                                    <span className="form-hint">Create an app at <a href="https://unsplash.com/oauth/applications/new" target="_blank" rel="noopener noreferrer">unsplash.com/developers</a> and copy the "Access Key".</span>
                                    <Input placeholder="e.g. ab12cd34ef56gh78ij90..." value={unsplashAccessKey} onChange={(e) => setUnsplashAccessKey(e.target.value)}/>
                                </div>
                                <div className="form-group">
                                    <label>Giphy API Key</label>
                                    <span className="form-hint">Create an app at <a href="https://developers.giphy.com/dashboard/?create=true" target="_blank" rel="noopener noreferrer">developers.giphy.com</a> and copy the "API Key".</span>
                                    <Input placeholder="e.g. aBcDeFgHiJkLmNoPqRsT..." value={giphyApiKey} onChange={(e) => setGiphyApiKey(e.target.value)}/>
                                </div>

                                <Button text="Save" type="green compact" onClick={saveMediaSettings}/>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'branding' && (
                        <motion.div className="settings-section" initial={{opacity: 0}} animate={{opacity: 1}}>
                            <h2><FontAwesomeIcon icon={faPalette}/> Branding</h2>
                            <p className="section-description">Customize the appearance of your Quizzle instance.</p>

                            <div className="settings-form">
                                <div className="form-group">
                                    <label>Logo</label>
                                    <div className="image-upload-area">
                                        <img src={logoPreview || logoImg} alt="Logo" className="image-preview logo-preview"/>
                                        <div className="image-upload-actions">
                                            <label className="upload-btn">
                                                <FontAwesomeIcon icon={faUpload}/> Choose image
                                                <input type="file" accept="image/*" hidden onChange={(e) => handleImageSelect('logo', e)}/>
                                            </label>
                                            {logoPreview && <Button text="Upload" type="green compact" onClick={() => uploadImage('logo')}/>}
                                            {!logoPreview && <button className="reset-btn" onClick={() => resetImage('logo')}><FontAwesomeIcon icon={faRotateLeft}/> Reset</button>}
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Banner</label>
                                    <div className="image-upload-area">
                                        <img src={titlePreview || titleImg} alt="Banner" className="image-preview title-preview"/>
                                        <div className="image-upload-actions">
                                            <label className="upload-btn">
                                                <FontAwesomeIcon icon={faUpload}/> Choose image
                                                <input type="file" accept="image/*" hidden onChange={(e) => handleImageSelect('title', e)}/>
                                            </label>
                                            {titlePreview && <Button text="Upload" type="green compact" onClick={() => uploadImage('title')}/>}
                                            {!titlePreview && <button className="reset-btn" onClick={() => resetImage('title')}><FontAwesomeIcon icon={faRotateLeft}/> Reset</button>}
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Name</label>
                                    <Input placeholder="Quizzle" value={brandName} onChange={(e) => setBrandName(e.target.value)}/>
                                </div>
                                <div className="form-group">
                                    <label>Primary color</label>
                                    <div className="color-input-row">
                                        <input type="color" value={brandColor || '#6547EE'} onChange={(e) => setBrandColor(e.target.value)} className="color-picker"/>
                                        <Input placeholder="#6547EE" value={brandColor} onChange={(e) => setBrandColor(e.target.value)}/>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Imprint URL</label>
                                    <Input placeholder="https://..." value={brandImprint} onChange={(e) => setBrandImprint(e.target.value)}/>
                                </div>
                                <div className="form-group">
                                    <label>Privacy policy URL</label>
                                    <Input placeholder="https://..." value={brandPrivacy} onChange={(e) => setBrandPrivacy(e.target.value)}/>
                                </div>

                                <Button text="Save" type="green compact" onClick={saveBrandingSettings}/>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'users' && (
                        <motion.div className="settings-section" initial={{opacity: 0}} animate={{opacity: 1}}>
                            <div className="section-header-row">
                                <div>
                                    <h2><FontAwesomeIcon icon={faUsers}/> User management</h2>
                                    <p className="section-description">Manage user accounts and permissions.</p>
                                </div>
                                <Button text="New user" icon={faPlus} type="primary compact" onClick={() => setShowNewUserDialog(true)}/>
                            </div>

                            <div className="user-list">
                                {users.map(u => (
                                    <div key={u.id} className="user-card">
                                        <div className="user-info">
                                            <FontAwesomeIcon icon={u.role === 'admin' ? faShieldAlt : faChalkboardTeacher} className={`role-icon ${u.role}`}/>
                                            <div>
                                                <span className="user-name">{u.username}</span>
                                                <span className="user-role">{u.role === 'admin' ? 'Administrator' : 'Teacher'}</span>
                                            </div>
                                        </div>
                                        <div className="user-actions">
                                            {u.id !== user?.id && (
                                                <>
                                                    <button className="icon-btn" title="Toggle role" onClick={() => toggleRole(u.id, u.role)}>
                                                        <FontAwesomeIcon icon={u.role === 'admin' ? faChalkboardTeacher : faShieldAlt}/>
                                                    </button>
                                                    <button className="icon-btn" title="Reset password" onClick={() => {setPasswordResetUserId(u.id); setShowPasswordDialog(true);}}>
                                                        <FontAwesomeIcon icon={faKey}/>
                                                    </button>
                                                    <button className="icon-btn danger" title="Delete" onClick={() => deleteUserHandler(u.id, u.username)}>
                                                        <FontAwesomeIcon icon={faTrash}/>
                                                    </button>
                                                </>
                                            )}
                                            {u.id === user?.id && <span className="you-badge">You</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'quizzes' && (
                        <motion.div className="settings-section" initial={{opacity: 0}} animate={{opacity: 1}}>
                            <div className="section-header-row">
                                <div>
                                    <h2><FontAwesomeIcon icon={faListUl}/> Quizzes</h2>
                                    <p className="section-description">All quizzes created on this instance. Quizzes created before creator tracking show as unknown.</p>
                                </div>
                                <div className="quiz-filter">
                                    <SelectBox value={quizOwnerFilter} onChange={setQuizOwnerFilter} options={quizOwnerOptions}/>
                                </div>
                            </div>

                            <div className="user-list">
                                {filteredQuizzes.length === 0 && <div className="quiz-empty">No quizzes found.</div>}
                                {filteredQuizzes.map(q => (
                                    <div key={`${q.type}-${q.id}`} className="user-card">
                                        <div className="user-info">
                                            <div>
                                                <span className="user-name">{q.title}</span>
                                                <span className="user-role">
                                                    {q.type === 'live' ? 'Live quiz' : 'Practice quiz'} · {q.id} · {q.questionCount} {q.questionCount === 1 ? 'question' : 'questions'} · {formatDate(q.created)} · by {q.createdByName || 'unknown'}
                                                    {q.type === 'practice' && q.expiry && new Date(q.expiry) < new Date() && ' · expired'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="user-actions">
                                            {q.type === 'practice' && (
                                                <Link className="icon-btn" title="View results" to={`/results/${q.id}`}>
                                                    <FontAwesomeIcon icon={faChartBar}/>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            <Dialog
                isOpen={showNewUserDialog}
                onClose={() => {setShowNewUserDialog(false); setNewUserError('');}}
                onConfirm={createUser}
                title="Create new user"
                confirmText="Create"
                cancelText="Cancel"
            >
                <div className="new-user-form">
                    <Input placeholder="Username" value={newUsername} onChange={(e) => {setNewUsername(e.target.value); setNewUserError('');}}/>
                    <Input type="password" placeholder="Password" value={newPassword} onChange={(e) => {setNewPassword(e.target.value); setNewUserError('');}}/>
                    <SelectBox
                        value={newRole}
                        onChange={setNewRole}
                        options={[
                            {value: 'teacher', label: 'Teacher', icon: faChalkboardTeacher},
                            {value: 'admin', label: 'Administrator', icon: faShieldAlt}
                        ]}
                    />
                    {newUserError && <div className="form-error">{newUserError}</div>}
                </div>
            </Dialog>

            <Dialog
                isOpen={showPasswordDialog}
                onClose={() => {setShowPasswordDialog(false); setNewPasswordValue('');}}
                onConfirm={resetPassword}
                title="Reset password"
                confirmText="Reset"
                cancelText="Cancel"
            >
                <div className="new-user-form">
                    <Input type="password" placeholder="New password (min. 6 characters)" value={newPasswordValue} onChange={(e) => setNewPasswordValue(e.target.value)}/>
                </div>
            </Dialog>
        </div>
    );
};
