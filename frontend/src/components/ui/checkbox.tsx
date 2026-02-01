import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn('flex items-center justify-center text-current')}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

// Checkbox with indeterminate state
const CheckboxIndeterminate = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    indeterminate?: boolean;
  }
>(({ className, indeterminate, checked, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    checked={indeterminate ? 'indeterminate' : checked}
    className={cn(
      'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn('flex items-center justify-center text-current')}
    >
      {indeterminate ? (
        <Minus className="h-4 w-4" />
      ) : (
        <Check className="h-4 w-4" />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
CheckboxIndeterminate.displayName = 'CheckboxIndeterminate';

// Checkbox with label
interface CheckboxWithLabelProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label: string;
  description?: string;
}

const CheckboxWithLabel = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxWithLabelProps
>(({ className, label, description, id, ...props }, ref) => {
  const generatedId = React.useId();
  const checkboxId = id || generatedId;

  return (
    <div className="flex items-start space-x-3">
      <Checkbox ref={ref} id={checkboxId} className={className} {...props} />
      <div className="grid gap-1.5 leading-none">
        <label
          htmlFor={checkboxId}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          {label}
        </label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
});
CheckboxWithLabel.displayName = 'CheckboxWithLabel';

// Task checkbox with strikethrough effect
interface TaskCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}

function TaskCheckbox({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  className,
}: TaskCheckboxProps) {
  const id = React.useId();

  return (
    <div className={cn('flex items-center space-x-3', className)}>
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={(c) => onCheckedChange(c === true)}
        disabled={disabled}
        className={cn(
          'peer h-5 w-5 shrink-0 rounded-full border-2 transition-all duration-200',
          'border-muted-foreground/50 ring-offset-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 data-[state=checked]:text-white',
          'hover:border-green-500/50'
        )}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
          <Check className="h-3 w-3" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <label
        htmlFor={id}
        className={cn(
          'text-sm cursor-pointer transition-all duration-200 select-none',
          checked && 'line-through text-muted-foreground',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {label}
      </label>
    </div>
  );
}

// Checkbox group
interface CheckboxGroupOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface CheckboxGroupProps {
  options: CheckboxGroupOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  disabled?: boolean;
  className?: string;
}

function CheckboxGroup({
  options,
  value,
  onValueChange,
  disabled = false,
  className,
}: CheckboxGroupProps) {
  const handleCheckedChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onValueChange([...value, optionValue]);
    } else {
      onValueChange(value.filter((v) => v !== optionValue));
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {options.map((option) => (
        <CheckboxWithLabel
          key={option.value}
          label={option.label}
          description={option.description}
          checked={value.includes(option.value)}
          onCheckedChange={(checked) =>
            handleCheckedChange(option.value, checked === true)
          }
          disabled={disabled || option.disabled}
        />
      ))}
    </div>
  );
}

export {
  Checkbox,
  CheckboxIndeterminate,
  CheckboxWithLabel,
  TaskCheckbox,
  CheckboxGroup,
};
