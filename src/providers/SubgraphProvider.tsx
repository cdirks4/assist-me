"use client";

import { createClient, Provider, ssrExchange } from "urql";
import { cacheExchange, fetchExchange } from "@urql/core";
import { SUBGRAPH_URLS } from "@/lib/constants";
import React from "react";

const isServerSide = typeof window === "undefined";
const ssr = ssrExchange({
  isClient: !isServerSide,
});

const client = createClient({
  url: SUBGRAPH_URLS["mantle-sepolia"],
  exchanges: [cacheExchange, ssr, fetchExchange],
  suspense: false,
});

export default function SubgraphProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Provider value={client}>{children}</Provider>;
}