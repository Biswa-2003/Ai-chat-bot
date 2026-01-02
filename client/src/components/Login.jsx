import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (isRegister) {
                await axios.post('/register', { username, password });
                setIsRegister(false); // Switch to Login mode
                setError('');
                alert("Account created successfully! Please sign in.");
                setPassword('');
            } else {
                const formData = new FormData();
                formData.append('username', username);
                formData.append('password', password);

                const response = await axios.post('/token', formData);
                onLogin(response.data.access_token, response.data.username);
            }
        } catch (err) {
            setError(err.response?.data?.detail || "Authentication failed");
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-card w-[400px]">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg">
                        AI
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        {isRegister ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">
                        {isRegister ? 'Start building your AI workflows' : 'Login to access your workspace'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm border border-red-100 flex items-center justify-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label>Username</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary w-full mt-4 justify-center py-3 btn-gradient text-white shadow-lg transform hover:-translate-y-0.5 transition-all">
                        {isRegister ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                <div className="text-center mt-6 pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                        {isRegister ? 'Already have an account?' : "Don't have an account?"}
                        <button
                            className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline focus:outline-none transition-colors"
                            onClick={() => setIsRegister(!isRegister)}
                        >
                            {isRegister ? 'Login here' : 'Register now'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
