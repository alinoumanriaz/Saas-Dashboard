/* eslint-disable react-hooks/rules-of-hooks */
import { GET_ALL_INDUSTRY } from "@/graphql/current-website-queries/industry.query";
import { GET_ALL_MATERIALS } from "@/graphql/current-website-queries/material.query";
import { GET_ALL_STYLES } from "@/graphql/current-website-queries/style.query";
import { useQuery } from "@apollo/client/react";


export const getIndustries = async () => {
  const { data, loading, error } = useQuery<any>(
    GET_ALL_INDUSTRY,
    {
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
    }
  )
  console.log({ GET_ALL_INDUSTRY: data })
  return data?.getPaginatedIndustries?.industries || [];
}

export const getMaterials = async () => {
  const { data, loading, error } = useQuery<any>(
    GET_ALL_MATERIALS,
    {
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
    }
  )
  return data?.getPaginatedMaterials?.materials || [];
}

export const getStyles = async () => {
  const { data, loading, error } = useQuery<any>(
    GET_ALL_STYLES,
    {
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
    }
  )
  return data?.getPaginatedStyles?.styles || [];
}