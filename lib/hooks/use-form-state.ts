import { useState, useCallback } from 'react';

type FormErrors<T> = Partial<Record<keyof T, string>>;

export function useFormState<T extends Record<string, any>>(
  initialValues: T,
  validate?: (values: T) => FormErrors<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTouched, setIsTouched] = useState<Record<string, boolean>>({});

  const handleChange = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setIsTouched((prev) => ({ ...prev, [name]: true }));
    if (validate) {
      const fieldErrors = validate({ ...values, [name]: value });
      setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
    }
  }, [validate, values]);

  const handleSubmit = useCallback(async (onSubmit: (data: T) => Promise<void> | void) => {
    setIsSubmitting(true);
    let valid = true;
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) valid = false;
    }

    if (valid) {
      try {
        await onSubmit(values);
      } catch (err) {
        console.error(err);
      }
    }
    setIsSubmitting(false);
  }, [validate, values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsTouched({});
  }, [initialValues]);

  return { values, errors, isSubmitting, isTouched, handleChange, handleSubmit, reset };
}
