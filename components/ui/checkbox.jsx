import React from "react";

export function Checkbox({ checked = false, onCheckedChange }) {
  return (
    <input
      type="checkbox"
      className="w-4 h-4 accent-blue-600"
      checked={checked}
      onChange={() => {
        if (typeof onCheckedChange === "function") {
          onCheckedChange(); // ❗不要传 e.target.checked
        }
      }}
    />
  );
}
