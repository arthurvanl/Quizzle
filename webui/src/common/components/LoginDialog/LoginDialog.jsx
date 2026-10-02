import {useState, useContext} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faRightToBracket, faUserPlus} from '@fortawesome/free-solid-svg-icons';
import Dialog from '@/common/components/Dialog';
import Input from '@/common/components/Input';
import {AuthContext} from '@/common/contexts/Auth';
import toast from 'react-hot-toast';
import './styles.sass';

export const LoginDialog = ({isOpen, onClose, onSuccess}) => {
    const {login, register} = useContext(AuthContext);
    const [mode, setMode] = useState('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isRegister = mode === 'register';

    const resetForm = () => {
        setUsername('');
        setPassword('');
        setPasswordConfirm('');
        setError('');
    };

    const switchMode = (newMode) => {
        resetForm();
        setMode(newMode);
    };

    const handleConfirm = async () => {
        if (loading) return;
        if (!username.trim()) {
            setError('Username is required');
            return;
        }
        if (!password) {
            setError('Password is required');
            return;
        }
        if (isRegister && password !== passwordConfirm) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (isRegister) {
                await register(username.trim(), password);
                toast.success('Account requested. An administrator has to approve it before you can log in.', {duration: 6000});
                switchMode('login');
                return;
            }

            await login(username.trim(), password);
            toast.success('Logged in successfully.');
            resetForm();
            onSuccess?.();
        } catch (err) {
            setError(err.message || (isRegister ? 'Request failed.' : 'Login failed.'));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        resetForm();
        setMode('login');
        onClose();
    };

    const onEnter = (e) => e.key === 'Enter' && handleConfirm();

    return (
        <Dialog
            isOpen={isOpen}
            onClose={handleClose}
            onConfirm={handleConfirm}
            onCancel={handleClose}
            title={
                <div className="login-dialog-title">
                    <FontAwesomeIcon icon={isRegister ? faUserPlus : faRightToBracket} className="login-dialog-title-icon"/>
                    {isRegister ? 'Request an account' : 'Log in'}
                </div>
            }
            confirmText={loading ? "..." : (isRegister ? "Request" : "Log in")}
            cancelText="Cancel"
            className="login-dialog"
        >
            <div className="login-dialog-content">
                <p className="login-dialog-text">
                    {isRegister
                        ? <>An <strong>administrator</strong> has to approve your account before you can log in.</>
                        : <>Please log in with your <strong>user account</strong>.</>}
                </p>
                <div className="login-input-wrapper">
                    <Input
                        placeholder="Username"
                        value={username}
                        onChange={(e) => {setUsername(e.target.value); setError('');}}
                        onKeyDown={onEnter}
                    />
                    <Input
                        type="password"
                        placeholder={isRegister ? "Password (min. 6 characters)" : "Password"}
                        value={password}
                        onChange={(e) => {setPassword(e.target.value); setError('');}}
                        error={isRegister ? undefined : error}
                        onKeyDown={onEnter}
                    />
                    {isRegister && (
                        <Input
                            type="password"
                            placeholder="Repeat password"
                            value={passwordConfirm}
                            onChange={(e) => {setPasswordConfirm(e.target.value); setError('');}}
                            error={error}
                            onKeyDown={onEnter}
                        />
                    )}
                </div>
                <button type="button" className="login-dialog-switch" onClick={() => switchMode(isRegister ? 'login' : 'register')}>
                    {isRegister ? 'Already have an account? Log in' : 'No account yet? Request one'}
                </button>
            </div>
        </Dialog>
    );
};
