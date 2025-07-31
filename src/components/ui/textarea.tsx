import * as React from "react"

import { cn } from "@/lib/utils"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-2xl border-2 border-[#FFB6C1] bg-[#FFF0F5] px-4 py-3 text-sm ring-offset-background placeholder:text-[#D8627D]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB6C1] focus-visible:ring-offset-2 focus-visible:border-[#FF91A4] focus-visible:bg-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }