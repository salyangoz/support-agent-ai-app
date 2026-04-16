import { createContext, useContext, forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const TabsContext = createContext<{ value: string; onValueChange: (v: string) => void }>({
  value: '',
  onValueChange: () => {},
})

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  value: string
  onValueChange: (value: string) => void
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ value, onValueChange, className, ...props }, ref) => (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div ref={ref} className={cn('', className)} {...props} />
    </TabsContext.Provider>
  ),
)
Tabs.displayName = 'Tabs'

const TabsList = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex border-b bg-card rounded-t-[20px] px-2 pt-1',
        className,
      )}
      role="tablist"
      {...props}
    />
  ),
)
TabsList.displayName = 'TabsList'

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string
}

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, className, ...props }, ref) => {
    const ctx = useContext(TabsContext)
    const isActive = ctx.value === value
    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        onClick={() => ctx.onValueChange(value)}
        className={cn(
          '-mb-px px-4 py-2.5 text-sm font-bold transition-all duration-200 border-b-2',
          isActive
            ? 'border-brand-500 text-brand-500'
            : 'border-transparent text-muted-foreground hover:text-foreground',
          className,
        )}
        {...props}
      />
    )
  },
)
TabsTrigger.displayName = 'TabsTrigger'

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, className, ...props }, ref) => {
    const ctx = useContext(TabsContext)
    if (ctx.value !== value) return null
    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn('', className)}
        {...props}
      />
    )
  },
)
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }
