"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const AccordionContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

const AccordionItemContext = React.createContext<string>("")

const Accordion = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    type?: "single" | "multiple"
    collapsible?: boolean
    defaultValue?: string
    onValueChange?: (value: string) => void
  }
>(({ className, type, collapsible, defaultValue, onValueChange, children, ...props }, ref) => {
  const [value, setValue] = React.useState<string | undefined>(defaultValue || "")

  const handleValueChange = (newValue: string) => {
    if (value === newValue && collapsible) {
      setValue("")
      onValueChange?.("")
    } else {
      setValue(newValue)
      onValueChange?.(newValue)
    }
  }

  return (
    <AccordionContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div ref={ref} className={cn("", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
})
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, children, ...props }, ref) => (
  <AccordionItemContext.Provider value={value}>
    <div ref={ref} className={cn("border-b border-slate-200", className)} data-value={value} {...props}>
      {children}
    </div>
  </AccordionItemContext.Provider>
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { value: selectedValue, onValueChange } = React.useContext(AccordionContext)
  const itemValue = React.useContext(AccordionItemContext)
  const isOpen = selectedValue === itemValue && itemValue !== ""

  return (
    <div className="flex">
      <button
        ref={ref}
        onClick={() => onValueChange?.(itemValue)}
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:text-blue-600 [&[data-state=open]>svg]:rotate-180",
          className
        )}
        data-state={isOpen ? "open" : "closed"}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 text-slate-400" />
      </button>
    </div>
  )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { value: selectedValue } = React.useContext(AccordionContext)
  const itemValue = React.useContext(AccordionItemContext)
  const isOpen = selectedValue === itemValue && itemValue !== ""

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div ref={ref} className={cn("pb-4 pt-0", className)} {...props}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
