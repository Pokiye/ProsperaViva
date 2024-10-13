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
        <>
            <h1>Prospera Viva!</h1>
            <h2>Your personal financial empowerment and budgeting tracking app</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Enter your financial question"
                />
                <button type="submit">Get Advice</button>
            </form>
            {advice && <p>{advice}</p>}
        </>
    );
};

export default App;