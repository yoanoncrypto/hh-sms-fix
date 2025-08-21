import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Login from "./components/Login";
import Layout from "./components/Layout";
import UserManagement from "./components/UserManagement";
import BulkImport from "./components/BulkImport";
import SMSManager from "./components/SMSManager";
import EmailManager from "./components/EmailManager";
import CampaignManagement from "./components/CampaignManagement";
import CampaignDetails from "./components/CampaignDetails";
import CampaignView from "./components/CampaignView";
import UserDetails from "./components/UserDetails";
import Home from "./components/Home";
import Discover from "./components/Discover";

const AppContent: React.FC = () => {
  const { user } = useAuth();

  // Main application routing
  return (
    <Router>
      <Routes>
        {/* Public routes - accessible without authentication */}
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/c/:shortId" element={<CampaignView />} />
        <Route path="/:token" element={<CampaignView />} />

        {/* Protected admin routes */}
        <Route
          path="/admin/*"
          element={
            user ? (
              <Layout>
                <Routes>
                  <Route path="/" element={<UserManagement />} />
                  <Route path="/import" element={<BulkImport />} />
                  <Route path="/sms" element={<SMSManager />} />
                  <Route path="/email" element={<EmailManager />} />
                  <Route path="/campaigns" element={<CampaignManagement />} />
                  <Route path="/campaigns/:id" element={<CampaignDetails />} />
                  <Route path="/users/:id" element={<UserDetails />} />
                </Routes>
              </Layout>
            ) : (
              <Login onLogin={() => {}} />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default AppContent;
