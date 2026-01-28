'use client';

import { forwardRef } from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
};

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "w-full rounded-2xl bg-slate-900 px-6 py-4 font-bold text-white shadow-sm shadow-slate-300 hover:bg-slate-800 active:scale-95 transition disabled:opacity-70 flex items-center justify-center gap-2",
  outline:
    "w-full rounded-2xl border border-slate-200 bg-white px-6 py-4 font-bold text-slate-900 shadow-sm shadow-slate-300 hover:border-slate-300 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2",
  ghost:
    "w-full rounded-2xl bg-transparent px-6 py-4 font-bold text-slate-900 hover:text-slate-700 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`${variantStyles[variant]} ${className}`.trim()}
      {...props}
    />
  )
);

Button.displayName = "Button";

export default Button;
