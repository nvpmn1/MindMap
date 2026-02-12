import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

// Switch with label
interface SwitchWithLabelProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label: string;
  description?: string;
  position?: 'left' | 'right';
}

const SwitchWithLabel = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchWithLabelProps
>(({ className, label, description, position = 'right', id, ...props }, ref) => {
  const generatedId = React.useId();
  const switchId = id || generatedId;

  const switchElement = <Switch ref={ref} id={switchId} {...props} />;
  const labelElement = (
    <div className="grid gap-1.5 leading-none">
      <label
        htmlFor={switchId}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
      >
        {label}
      </label>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );

  return (
    <div
      className={cn(
        'flex items-center justify-between',
        position === 'left' && 'flex-row-reverse',
        className
      )}
    >
      {labelElement}
      {switchElement}
    </div>
  );
});
SwitchWithLabel.displayName = 'SwitchWithLabel';

// Theme toggle switch
interface ThemeSwitchProps {
  isDark: boolean;
  onToggle: (isDark: boolean) => void;
  className?: string;
}

function ThemeSwitch({ isDark, onToggle, className }: ThemeSwitchProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        className={cn(
          'h-4 w-4 transition-colors',
          !isDark ? 'text-yellow-500' : 'text-muted-foreground'
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
      <Switch checked={isDark} onCheckedChange={onToggle} />
      <svg
        className={cn(
          'h-4 w-4 transition-colors',
          isDark ? 'text-blue-400' : 'text-muted-foreground'
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </div>
  );
}

export { Switch, SwitchWithLabel, ThemeSwitch };
