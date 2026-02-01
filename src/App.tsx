/**
 * Main Application Component
 */

import { RouterProvider } from "react-router";
import { router } from "./app/router";
import { AuthProvider } from "./store/auth.store";
import { ProjectProvider } from "./store/project.store";
import { NotificationProvider } from "./store/notification.store";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <NotificationProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" />
        </NotificationProvider>
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;
