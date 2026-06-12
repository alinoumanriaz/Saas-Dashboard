"use client";

import { useMutation } from "@apollo/client/react";
import { LOGOUT_MEMBER } from "@/graphql/query/member.query";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/redux/hooks";
import { clearMember } from "@/redux/slicers/currentMember";


export default function useLogout() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [logoutUser, { loading, error }] = useMutation(LOGOUT_MEMBER, {
    onCompleted: (data: any) => {
      if (data.logoutMember) {
        dispatch(clearMember());
        router.push("/sign_in");
      }
    },
  });

  const handleLogout = () => {
    logoutUser();
  };

  return { handleLogout, loading, error };
}
