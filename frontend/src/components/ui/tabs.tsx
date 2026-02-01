import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// Underline variant tabs
const TabsListUnderline = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-start border-b w-full',
      className
    )}
    {...props}
  />
));
TabsListUnderline.displayName = 'TabsListUnderline';

const TabsTriggerUnderline = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-sm font-medium transition-all border-b-2 border-transparent -mb-px',
      'text-muted-foreground hover:text-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:text-foreground data-[state=active]:border-primary',
      className
    )}
    {...props}
  />
));
TabsTriggerUnderline.displayName = 'TabsTriggerUnderline';

// View switcher tabs (Map/List/Kanban)
type ViewType = 'map' | 'list' | 'kanban';

interface ViewTabsProps {
  value: ViewType;
  onValueChange: (value: ViewType) => void;
  className?: string;
}

const viewIcons: Record<ViewType, React.ReactNode> = {
  map: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  ),
  list: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  ),
  kanban: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
};

const viewLabels: Record<ViewType, string> = {
  map: 'Mapa',
  list: 'Lista',
  kanban: 'Kanban',
};

function ViewTabs({ value, onValueChange, className }: ViewTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onValueChange(v as ViewType)}
      className={className}
    >
      <TabsList>
        {(['map', 'list', 'kanban'] as ViewType[]).map((view) => (
          <TabsTrigger
            key={view}
            value={view}
            className="flex items-center gap-2"
          >
            {viewIcons[view]}
            <span className="hidden sm:inline">{viewLabels[view]}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

// Typed tabs helper
interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: number | string;
}

interface TypedTabsProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  tabs: TabItem<T>[];
  variant?: 'default' | 'underline';
  className?: string;
}

function TypedTabs<T extends string>({
  value,
  onValueChange,
  tabs,
  variant = 'default',
  className,
}: TypedTabsProps<T>) {
  const ListComponent = variant === 'underline' ? TabsListUnderline : TabsList;
  const TriggerComponent =
    variant === 'underline' ? TabsTriggerUnderline : TabsTrigger;

  return (
    <Tabs
      value={value}
      onValueChange={(v) => onValueChange(v as T)}
      className={className}
    >
      <ListComponent>
        {tabs.map((tab) => (
          <TriggerComponent
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className="flex items-center gap-2"
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && (
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                {tab.badge}
              </span>
            )}
          </TriggerComponent>
        ))}
      </ListComponent>
    </Tabs>
  );
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsListUnderline,
  TabsTriggerUnderline,
  ViewTabs,
  TypedTabs,
};
export type { ViewType };
