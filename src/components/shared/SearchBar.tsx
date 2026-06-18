"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchBarProps = {
  defaultValue?: string;
  className?: string;
};

export default function SearchBar({ defaultValue = "", className }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      setQuery(defaultValue || params.get("search") || "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [defaultValue]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    router.push(`/products${params.size ? `?${params.toString()}` : ""}`);
  };

  return (
    <form onSubmit={onSubmit} className={cn("flex h-12 items-center gap-2 rounded-xl border border-emerald-100 bg-white p-1.5 shadow-sm", className)}>
      <Search className="ml-3 size-4 text-emerald-700" />
      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search groceries, brands, and fresh deals" className="h-9 border-0 px-1 focus-visible:ring-0" />
      <Button type="submit" className="h-9 bg-emerald-700 px-4 text-white hover:bg-emerald-800">Search</Button>
    </form>
  );
}
