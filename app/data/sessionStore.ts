"use client";

import { useSyncExternalStore } from "react";
import { CLAIMS, type Claim } from "@/app/data/mockData";

let claims = CLAIMS;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getClaimsSnapshot() {
  return claims;
}

// Module-level so referential equality is stable across renders.
function setClaims(next: Claim[] | ((previous: Claim[]) => Claim[])) {
  claims = typeof next === "function" ? next(claims) : next;
  emit();
}

export function useClaims() {
  const currentClaims = useSyncExternalStore(subscribe, getClaimsSnapshot, getClaimsSnapshot);
  return [currentClaims, setClaims] as const;
}
