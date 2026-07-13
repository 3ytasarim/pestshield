"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type UseFormRegisterReturn,
} from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormSectionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function FormSectionCard({ icon: Icon, title, description, children }: FormSectionCardProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4.5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

interface FieldWrapperProps {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FieldWrapper({ label, htmlFor, error, required, className, children }: FieldWrapperProps) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mb-1.5 text-[13px] font-medium text-foreground/80">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface TextFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
  type?: string;
  registration: UseFormRegisterReturn;
}

export function TextField({
  label,
  error,
  required,
  className,
  placeholder,
  type = "text",
  registration,
}: TextFieldProps) {
  return (
    <FieldWrapper label={label} error={error} required={required} className={className}>
      <Input
        type={type}
        placeholder={placeholder ?? label}
        aria-invalid={!!error}
        className="h-11 rounded-xl px-3.5"
        {...registration}
      />
    </FieldWrapper>
  );
}

interface PasswordFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
  registration: UseFormRegisterReturn;
}

export function PasswordField({ label, error, required, className, placeholder, registration }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <FieldWrapper label={label} error={error} required={required} className={className}>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          placeholder={placeholder ?? label}
          aria-invalid={!!error}
          className="h-11 rounded-xl px-3.5 pr-10"
          {...registration}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={visible ? "Parolayı gizle" : "Parolayı göster"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </FieldWrapper>
  );
}

interface TextareaFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
  rows?: number;
  registration: UseFormRegisterReturn;
}

export function TextareaField({
  label,
  error,
  required,
  className,
  placeholder,
  rows = 3,
  registration,
}: TextareaFieldProps) {
  return (
    <FieldWrapper label={label} error={error} required={required} className={className}>
      <Textarea
        placeholder={placeholder ?? label}
        rows={rows}
        aria-invalid={!!error}
        className="rounded-xl px-3.5 py-2.5"
        {...registration}
      />
    </FieldWrapper>
  );
}

interface SelectFieldProps<TFieldValues extends FieldValues> {
  label: string;
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function SelectField<TFieldValues extends FieldValues>({
  label,
  name,
  control,
  options,
  placeholder,
  error,
  required,
  className,
}: SelectFieldProps<TFieldValues>) {
  return (
    <FieldWrapper label={label} error={error} required={required} className={className}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
              <SelectValue placeholder={placeholder ?? "Seçiniz"}>
                {(value: unknown) => options.find((option) => option.value === value)?.label ?? placeholder ?? "Seçiniz"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </FieldWrapper>
  );
}

interface CheckboxFieldProps<TFieldValues extends FieldValues> {
  label: string;
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  className?: string;
}

export function CheckboxField<TFieldValues extends FieldValues>({
  label,
  name,
  control,
  className,
}: CheckboxFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label className={`flex items-center gap-2 text-sm ${className ?? ""}`}>
          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          {label}
        </label>
      )}
    />
  );
}

interface ToggleFieldProps<TFieldValues extends FieldValues> {
  label: string;
  description?: string;
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  className?: string;
}

export function ToggleField<TFieldValues extends FieldValues>({
  label,
  description,
  name,
  control,
  className,
}: ToggleFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className={`flex items-start justify-between gap-3 ${className ?? ""}`}>
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <Switch checked={field.value} onCheckedChange={field.onChange} className="mt-0.5 shrink-0" />
        </div>
      )}
    />
  );
}

interface CurrencyFieldProps<TFieldValues extends FieldValues> {
  label: string;
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  error?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

/** Türkçe binlik ayraçlı (1.000) tutar girişi — react-hook-form'a saf sayı ("1000") olarak yazar. */
export function CurrencyField<TFieldValues extends FieldValues>({
  label,
  name,
  control,
  error,
  required,
  className,
  placeholder,
}: CurrencyFieldProps<TFieldValues>) {
  return (
    <FieldWrapper label={label} error={error} required={required} className={className}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Input
            type="text"
            inputMode="numeric"
            placeholder={placeholder ?? "0"}
            aria-invalid={!!error}
            className="h-11 rounded-xl px-3.5"
            value={field.value ? new Intl.NumberFormat("tr-TR").format(field.value) : ""}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              field.onChange(digits ? Number(digits) : 0);
            }}
            onBlur={field.onBlur}
          />
        )}
      />
    </FieldWrapper>
  );
}

export function FormSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</h3>
  );
}
