"use client";

import { useEffect } from "react";

export default function usePageTitle(title) {
  useEffect(() => {
    if (!title) return;
    document.title = title;
  }, [title]);
}
