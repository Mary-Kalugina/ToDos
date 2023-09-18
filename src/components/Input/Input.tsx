import React, { useState } from "react";

interface InputProps {
  add: (text: string) => void;
}

const Input: React.FC<InputProps> = ({ add }) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      add(inputValue);
      setInputValue("");
    }
  };

  return (
    <form className="d-flex justify-content-center align-items-center mb-4">
      <div className="form-outline flex-fill">
        <input
          type="text"
          id="form2"
          className="form-control"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <label className="form-label" htmlFor="form2">What needs to be done?
        </label>
      </div>
    </form>
  );
};

export default Input;
