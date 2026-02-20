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
              path="/sign-up/*"
              element={
                <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                  <SignUp routing="path" path="/sign-up" />
                </div>
              }
            />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
