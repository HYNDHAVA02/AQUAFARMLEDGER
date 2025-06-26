import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useAuthContext } from "@/components/AuthProvider";

function AuthCacheResetter() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const userIdRef = useRef(user?.id);

  useEffect(() => {
    const currentUserId = user?.id;
    // If the user ID has changed since the last render, it signifies a login or logout.
    if (userIdRef.current !== currentUserId) {
      // Clear the entire query cache to ensure no stale data from the
      // previous user is displayed.
      queryClient.clear();
    }

    // Update the ref to the current user's ID for the next check.
    userIdRef.current = currentUserId;
  }, [user, queryClient]);

  // This component doesn't render any UI.
  return null;
}

export default AuthCacheResetter; 