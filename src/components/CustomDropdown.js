// src/components/CustomDropdown.js
import React, { useState, useRef, useEffect } from "react";
import { FaArrowDown } from "react-icons/fa6";
import { FaArrowUp } from "react-icons/fa6";
// Modular Custom Dropdown Component
// Props:
// - options: Array of strings for dropdown options (e.g., ['Option 1', 'Option 2'])
// - value: The currently selected value
// - onChange: Callback function when an option is selected (receives the selected value)
// - placeholder: Text to display when no value is selected
// - disabled: Boolean to disable the dropdown
// - className: Optional class name for the main container div
function CustomDropdown({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  className,
}) {
  // State to control whether the dropdown list is open
  const [isOpen, setIsOpen] = useState(false);
  // Ref to the dropdown container to handle clicks outside
  const dropdownRef = useRef(null);

  // Effect to close the dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the click is outside the dropdown container and the dropdown is open
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        isOpen
      ) {
        setIsOpen(false); // Close the dropdown
      }
    };

    // Add the event listener to the document
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup: Remove the event listener when the component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]); // Re-run effect if isOpen state changes

  // Toggle the dropdown open/closed state
  const handleToggle = () => {
    if (!disabled) {
      // Only toggle if not disabled
      setIsOpen((prev) => !prev);
    }
  };

  // Handle selecting an option from the list
  const handleSelect = (optionValue) => {
    onChange(optionValue); // Call the parent component's onChange handler
    setIsOpen(false); // Close the dropdown after selection
  };

  // Determine the text to display in the main button
  const displayValue = value && value !== "" ? value : placeholder;

  return (
    // Main container div with a ref for click outside detection
    <div className={`custom-dropdown ${className}`} ref={dropdownRef}>
      {/* Button that displays the current value and toggles the dropdown */}
      <button
        type="button" // Important for preventing form submission
        className={`dropdown-button ${isOpen ? "open" : ""}`}
        onClick={handleToggle}
        disabled={disabled} // Disable the button if the dropdown is disabled
      >
        {displayValue}
        {/* Optional: Add an indicator arrow */}
        <span className="dropdown-arrow">
          {isOpen ? <FaArrowUp /> : <FaArrowDown />}
        </span>
      </button>

      {/* The dropdown list, only visible when isOpen is true */}
      {isOpen &&
        !disabled && ( // Ensure list is only shown when open and not disabled
          <ul className="dropdown-list">
            {options.map((option, index) => (
              // Render a list item for each option
              <li
                key={index} // Using index as key is okay if options array order is stable and items are unique
                className={`dropdown-list-item ${
                  option === value ? "selected" : ""
                } ${option === "" ? "disabled-option" : ""}`}
                onClick={() => handleSelect(option)}
                // Disable the list item if it's the empty placeholder option
                style={{ pointerEvents: option === "" ? "none" : "auto" }}
              >
                {option === "" ? placeholder : option}{" "}
                {/* Display placeholder for empty option */}
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

export default CustomDropdown;
