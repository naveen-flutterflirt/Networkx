"use client";
import { useEffect } from "react";
export default function ReadBetweenPage() {
  useEffect(() => {
    window.location.href = "/dashboard";
  }, []);
  return null;
}
