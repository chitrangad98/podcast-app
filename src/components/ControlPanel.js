// src/components/ControlPanel.js
import React from "react";

// ControlPanel now only receives Stop, Save, and Clear related props
function ControlPanel({
  onStop,
  onSave,
  onClear,
  isLoading,
  canSave,
  canClear,
}) {
  return (
    <div className="control-panel">
      {/* Stop button - enabled only when loading */}
      <button
        onClick={onStop}
        disabled={!isLoading}
        className="control-button-stop-button"
      >
        STOP
      </button>
      {/* Save button - visible and enabled based on canSave prop */}
      {/* We only show the save button if there's a conversation to potentially save */}
      {/* The canSave logic in App.js already checks conversation.length > 0 */}
      <button
        onClick={onSave}
        disabled={!canSave}
        className="control-button-save-button"
      >
        SAVE
      </button>
      {/* Clear button - visible and enabled based on canClear prop */}
      {/* The canClear logic in App.js already checks conversation.length > 0 */}
      <button
        onClick={onClear}
        disabled={!canClear}
        className="control-button-clear-button"
      >
        CLEAR
      </button>
    </div>
  );
}

export default ControlPanel;
