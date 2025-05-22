"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const FormSchema = z.object({
  password: z.string(),
});

export function PasswordForm({
  error,
  onSubmitAction,
}: {
  error?: string;
  onSubmitAction: (
    data: z.infer<typeof FormSchema>,
  ) => Promise<
    { success: boolean; error?: never } | { error: string; success?: never }
  >;
}) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {},
  });

  const {
    formState: { isSubmitting },
  } = form;

  const [serverError, setServerError] = useState<string | null>(error ?? null);

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    try {
      const result = await onSubmitAction(values);
      if (!result.success)
        setServerError(result.error ?? "Internal server error");
    } catch (error) {
      console.error(error);
      setServerError("Internal server error");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 w-full max-w-md"
        >
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input placeholder="Enter password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            Login to Play
          </Button>

          {serverError ? (
            <div className="text-red-500 text-center mt-2">{serverError}</div>
          ) : null}
        </form>
      </Form>
    </div>
  );
}
