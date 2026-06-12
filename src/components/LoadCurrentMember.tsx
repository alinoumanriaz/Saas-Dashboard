"use client";

import { useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import { clearMember, setMember } from "@/redux/slicers/currentMember";
import { GET_CURRENT_MEMBER } from "@/graphql/query/member.query";
import { useAppDispatch } from "@/redux/hooks";

const LoadCurrentMember = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useQuery<any>(GET_CURRENT_MEMBER, {
    fetchPolicy: "network-only",
  });

  console.log({ LoadCurrentUser: data || error })

  useEffect(() => {
    if (!loading) {
      if (data?.getCurrentMember) {
        dispatch(setMember(data?.getCurrentMember));
      } else {
        dispatch(clearMember());
      }
    }
  }, [data, loading, dispatch]);

  return null; // no UI needed
};

export default LoadCurrentMember;
