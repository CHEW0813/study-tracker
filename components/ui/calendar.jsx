import React from "react";

export function Calendar({ selected, onSelect, className = "" }) {
  const handleChange = (e) => {
    const date = new Date(e.target.value);
    if (!isNaN(date)) onSelect(date);
  };

  return (
    <input
      type="date"
      value={selected.toISOString().split("T")[0]}
      onChange={handleChange}
      className={`p-2 border border-gray-300 rounded ${className}`}
    />
  );
}