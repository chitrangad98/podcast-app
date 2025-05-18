import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // Your global styles
import App from "./App"; // Your main App component
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SavedConversationsList from "./components/SavedConversationsList"; // We will create this
import ViewSavedConversation from "./components/ViewSavedConversation"; // We will create this

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {/* BrowserRouter enables routing */}
    <BrowserRouter>
      {/* Routes defines the different paths */}
      <Routes>
        {/* Route for the main application (live conversation) */}
        <Route path="/" element={<App />} />
        {/* Route for the list of saved conversations */}
        <Route path="/saved" element={<SavedConversationsList />} />
        {/* Route for viewing a specific saved conversation, using a URL parameter for the ID */}
        <Route
          path="/saved/:conversationId"
          element={<ViewSavedConversation />}
        />
        {/* Add a catch-all or 404 route if desired */}
        {/* <Route path="*" element={<div>Page Not Found</div>} /> */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
