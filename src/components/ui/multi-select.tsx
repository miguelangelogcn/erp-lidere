"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { Badge } from "@/components/ui/badge";

const multiSelectVariants = cva(
    "m-1 transition-all duration-100 ease-in-out",
    {
        variants: {
            variant: {
                default:
                    "border-foreground/10 text-foreground bg-card hover:bg-card/80",
                secondary:
                    "border-secondary-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-destructive-foreground/10 bg-destructive text-destructive-foreground hover:bg-destructive/80",
                inverted: "inverted",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

interface MultiSelectProps
    extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof multiSelectVariants> {
    options: {
        value: string;
        label: string;
        icon?: React.ComponentType<{ className?: string }>;
    }[];
    onValueChange: (value: string[]) => void;
    defaultValue?: string[];
    placeholder?: string;
    animation?: number;
    maxCount?: number;
    asChild?: boolean;
}


const MultiSelect = React.forwardRef<
    HTMLInputElement,
    MultiSelectProps
>(
    (
        {
            options = [],
            onValueChange,
            variant,
            defaultValue,
            placeholder = "Select options",
            className,
            ...props
        },
        ref
    ) => {
        const inputRef = React.useRef<HTMLInputElement>(null);
        const [isOpen, setOpen] = React.useState(false);
        const [selected, setSelected] = React.useState<string[]>(defaultValue || []);
        const [inputValue, setInputValue] = React.useState("");

        React.useEffect(() => {
            setSelected(defaultValue || []);
        }, [defaultValue]);

        const handleSelect = (value: string) => {
            const newSelected = selected.includes(value)
                ? selected.filter((v) => v !== value)
                : [...selected, value];
            setSelected(newSelected);
            onValueChange(newSelected);
        };

        const handleRemove = (value: string) => {
            const newSelected = selected.filter((v) => v !== value);
            setSelected(newSelected);
            onValueChange(newSelected);
        };

        const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" && inputRef.current?.value) {
                // You can add custom logic for handling "Enter" key, e.g., adding a new tag
            }
            if (e.key === "Backspace" && !inputRef.current?.value && selected.length > 0) {
                handleRemove(selected[selected.length - 1]);
            }
        };

        return (
            <Command
                onKeyDown={handleInputKeyDown}
                className="overflow-visible bg-transparent"
            >
                <div
                    className={cn(
                        "group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                        className
                    )}
                >
                    <div className="flex flex-wrap gap-1">
                        {selected.map((value) => {
                            const option = options.find((opt) => opt.value === value);
                            return (
                                <Badge
                                    key={value}
                                    variant={variant as any}
                                    className="gap-1"
                                >
                                    {option ? option.label : value}
                                    <button
                                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleRemove(value);
                                            }
                                        }}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onClick={() => handleRemove(value)}
                                    >
                                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                    </button>
                                </Badge>
                            );
                        })}
                        <CommandPrimitive.Input
                            ref={inputRef}
                            value={inputValue}
                            onValueChange={setInputValue}
                            onBlur={() => setOpen(false)}
                            onFocus={() => setOpen(true)}
                            placeholder={placeholder}
                            className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                        />
                    </div>
                </div>
                <div className="relative mt-2">
                    {isOpen && (
                        <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                            <CommandList>
                                {options
                                    .filter(option => !selected.includes(option.value))
                                    .filter(option => option.label.toLowerCase().includes(inputValue.toLowerCase()))
                                    .map(option => (
                                        <CommandItem
                                            key={option.value}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onSelect={() => {
                                                handleSelect(option.value);
                                                setInputValue("");
                                            }}
                                            className={"cursor-pointer"}
                                        >
                                            {option.label}
                                        </CommandItem>
                                    ))
                                }
                            </CommandList>
                        </div>
                    )}
                </div>
            </Command>
        );
    }
);

MultiSelect.displayName = "MultiSelect";

export { MultiSelect };