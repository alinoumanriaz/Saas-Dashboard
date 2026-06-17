"use client";

import { useMutation } from "@apollo/client/react";
import { useApolloClient } from "@apollo/client/react";
import { LOGOUT_MEMBER } from "@/graphql/query/member.query";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/redux/hooks";
import { clearMember } from "@/redux/slicers/currentMember";

export default function useLogout() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const client = useApolloClient();

  const [logoutUser, { loading, error }] = useMutation(LOGOUT_MEMBER, {
    onCompleted: async (data: any) => {
      if (data.logoutMember) {
        try {
          dispatch(clearMember());
          await client.clearStore();
          router.push("/sign_in");
        } catch (err) {
          console.error("Error during logout cleanup", err);
          router.push("/sign_in");
        }
      }
    },
    onError: (err) => {
      console.error("Logout mutation failed", err);
      dispatch(clearMember());
      client.clearStore();
      router.push("/sign_in");
    },
  });

  const handleLogout = () => {
    logoutUser();
  };

  return { handleLogout, loading, error };
}