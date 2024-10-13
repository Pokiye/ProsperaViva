var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import axios from "axios";
import "./App.css";
const App = () => {
    const [userInput, setUserInput] = useState("");
    const [advice, setAdvice] = useState("");
    const handleSubmit = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        try {
            const response = yield axios.post("http://localhost:5000/api/advice", { userInput });
            setAdvice(response.data.advice);
        }
        catch (error) {
            console.error("Error fetching advice", error);
        }
    });
    return (_jsxs(_Fragment, { children: [_jsx("h1", { children: "Prospera Viva!" }), _jsx("h2", { children: "Your personal financial empower and budgeting tracking app" }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx("input", { type: "text", value: userInput, onChange: (e) => setUserInput(e.target.value), placeholder: "Enter your financial question" }), _jsx("button", { type: "submit", children: "Get Advice" })] }), advice && _jsx("p", { children: advice })] }));
};
export default App;
