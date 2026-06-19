"use client";

import { useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import { clearMember, setMember } from "@/redux/slicers/currentMember";
import { GET_CURRENT_MEMBER } from "@/graphql/query/member.query";
import { useAppDispatch } from "@/redux/hooks";
import LoadingScreen from "./LoadingScreen";

interface LoadCurrentMemberProps {
  children: React.ReactNode;
}

const LoadCurrentMember = ({ children }: LoadCurrentMemberProps) => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useQuery<any>(GET_CURRENT_MEMBER, {
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (!loading) {
      if (data?.getCurrentMember) {
        dispatch(setMember(data.getCurrentMember));
      } else {
        dispatch(clearMember());
      }
    }
  }, [data, loading, dispatch]);

  console.log({getCurrentMember:data})

  // While loading, show a full‑screen spinner
  if (loading) {
    return (
      <LoadingScreen
        appName="Dashboard"
        message="Verifying your account..."
      />
    );
  }

  // Optionally handle errors (e.g., show an error message)
  if (error) {
    console.log(error)
    // You could redirect to login or show an error overlay
    return <div>Error loading member. Please refresh.</div>;
  }

  // Once loaded, render the actual app
  return <>{children}</>;
};

export default LoadCurrentMember;