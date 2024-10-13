import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const App: React.FC = () => {
    const [userInput, setUserInput] = useState("");
    const [advice, setAdvice] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            console.log("making request");
            const response = await axios.post(`http://localhost:3000/api/advice`, { userInput });
            setAdvice(response.data.advice);
        } catch (error) {
            console.error("Error fetching advice", error);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="title-container">
                        <img src="/prosperaviva-logo.png" alt="Prospera Viva Logo" />
                        <h2>Your personal financial empowerment and budgeting tracking app</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="mb-4">
                        <div className="input-group mb-3">
                            <input
                                type="text"
                                className="form-control"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="Enter your financial question"
                            />
                            <div className="input-group-append">
                                <button type="submit" className="btn btn-primary" title="Send">
                                    <i className="fas fa-paper-plane"></i> 
                                </button>
                            </div>
                        </div>
                    </form>
                    {advice && (
                        <div className="alert alert-success" role="alert">
                            {advice}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;