import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export const Logo = ({
  fontSize = "text-2xl",
  iconSize = 20,
}: {
  fontSize?: string;
  iconSize?: number;
}) => {
  return (
    <Link
      href="/"
      className={cn("text-2xl font-extrabold flex items-center gap-2", fontSize)}
    >
      
      <div className="flex items-center gap-2">
        <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">Viona</span>
        <span className="text-stone-700 dark:text-stone-300"> Pro</span>
      </div>
    </Link>
  );
};
