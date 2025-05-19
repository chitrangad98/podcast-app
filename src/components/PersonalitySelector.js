// src/components/PersonalitySelector.js
import React from "react";
import CustomDropdown from "./CustomDropdown"; // Import the new component
// Assuming you have CSS for .personality-gradient-circle-1 and -2 in App.css

// Predefined list of personalities
const availablePersonalities = [
  "", // Empty option for placeholder
  "Kanye West",
  "Elon Musk",
  "Oprah Winfrey",
  "Neil deGrasse Tyson",
  "Taylor Swift",
  "Dwayne Johnson",
  "Bill Gates", // Added
  "Steve Jobs", // Added
  "Beyoncé", // Added
  "LeBron James", // Added
  "J.K. Rowling", // Added

  // Add more personalities here as desired
];

function PersonalitySelector({
  selectedPersonalities,
  setSelectedPersonalities,
}) {
  // Handle selection change for a specific dropdown index
  const handleSelect = (index, value) => {
    const newSelected = [...selectedPersonalities];
    newSelected[index] = value; // Update the personality at the given index
    setSelectedPersonalities(newSelected);
  };

  // We don't need to filter options here for CustomDropdown's basic usage,
  // as the component itself just needs the list of available options.
  // Disabling logic will be handled by passing the 'disabled' prop to CustomDropdown
  // if needed (e.g., disabling the whole dropdown while loading).
  // The CustomDropdown component includes logic to visually grey out the empty placeholder.

  return (
    <div className="personality-selector">
      {/* Dropdown for the first personality */}
      <div className="personality-dropdown-container">
        {/* Keep the gradient circle span */}
        <span className="personality-gradient-circle-1">1</span>
        {/* Use CustomDropdown component */}
        <CustomDropdown
          options={availablePersonalities} // Pass the full options array
          value={selectedPersonalities[0]} // Pass the current value
          onChange={(value) => handleSelect(0, value)} // Pass the change handler
          placeholder="Personality 1" // Placeholder text
          // You can add disabled={isLoading} here if you want to disable dropdowns while loading
          className="personality-dropdown-custom" // Optional class for styling the custom dropdown container
        />
      </div>
      {/* Dropdown for the second personality */}
      <div className="personality-dropdown-container">
        {/* Keep the gradient circle span */}
        <span className="personality-gradient-circle-2">2</span>
        {/* Use CustomDropdown component */}
        <CustomDropdown
          options={availablePersonalities} // Pass the full options array
          value={selectedPersonalities[1]} // Pass the current value
          onChange={(value) => handleSelect(1, value)} // Pass the change handler
          placeholder="Personality 2" // Placeholder text
          // You can add disabled={isLoading} here if you want to disable dropdowns while loading
          className="personality-dropdown-custom" // Optional class for styling the custom dropdown container
        />
      </div>
    </div>
  );
}

export default PersonalitySelector;
