import { SignedIn, SignedOut, SignIn, SignUp, RedirectToSignIn } from "@clerk/clerk-react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SyncUser } from "./components/SyncUser";
import Dashboard from "./pages/Dashboard";
import VehiclePooling from "./pages/VehiclePooling";
import DriverDashboard from "./pages/DriverDashboard";
import LiveTracking from "./pages/LiveTracking";
import Landing from "./pages/Landing";
import { SocketProvider } from "./context/SocketContext";
import { ThemeProvider } from "./context/ThemeContext";
import RouteDetails from "./pages/RouteDetails";
import AiRoutePlanner from "./pages/AiRoutePlanner";
import BookingPage from "./pages/BookingPage";
import AppAssistantChat from "./components/AppAssistantChat";
import SharedAutoPage from "./pages/SharedAutoPage";

function App() {
  return (
    <ThemeProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <Landing />
              }
            />
            <Route
              path="/sign-in/*"
              element={
                <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                  <SignIn routing="path" path="/sign-in" />
                </div>
              }
            />
            <Route
              path="/dashboard"
              element={
                <>
                  <SignedIn>
                    <SyncUser />
                    <Dashboard />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
            <Route
              path="/pooling"
              element={
                <>
                  <SignedIn>
                    <VehiclePooling />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
            <Route
              path="/route-details"
              element={
                <>
                  <SignedIn>
                    <RouteDetails />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
            <Route
              path="/driver"
              element={
                <>
                  <SignedIn>
                    <DriverDashboard />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
            <Route
              path="/tracking"
              element={
                <>
                  <SignedIn>
                    <LiveTracking />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
            <Route
              path="/ai-route"
              element={
                <>
                  <SignedIn>
                    <AiRoutePlanner />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
            <Route
              path="/shared-auto"
              element={
                <>
                  <SignedIn>
                    <SharedAutoPage />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
            <Route
              path="/booking"
              element={
                <>
                  <SignedIn>
                    <BookingPage />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
            <Route
              path="/sign-up/*"
              element={
                <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                  <SignUp routing="path" path="/sign-up" />
                </div>
              }
            />
          </Routes>
          {/* SafarLink App Assistant — available on every signed-in page */}
          <SignedIn>
            <AppAssistantChat />
          </SignedIn>
        </BrowserRouter>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
