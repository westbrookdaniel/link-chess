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
import { Game } from "@/db/schema";

const FormSchema = z.object({
  password: z.string().optional(),
});

export function LinkForm({
  onSubmitAction,
}: {
  onSubmitAction: (
    data: z.infer<typeof FormSchema>,
  ) => Promise<{ data: Game; error?: never } | { error: string; data?: never }>;
}) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {},
  });

  const {
    formState: { isSubmitting },
  } = form;

  const [serverError, setServerError] = useState<string | null>(null);

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    try {
      const result = await onSubmitAction(values);

      if (result.data) {
        window.location.href = `/game/${result.data.slug}`;
      } else {
        setServerError(result.error ?? "Internal server error");
      }
    } catch (error) {
      console.error(error);
      setServerError("Internal server error");
    }
  }

  return (
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
              <FormLabel>Set Password</FormLabel>
              <FormControl>
                <Input placeholder="Enter password (optional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Create New Game
        </Button>

        {serverError ? (
          <div className="text-red-500 text-center mt-2">{serverError}</div>
        ) : null}
      </form>
    </Form>
  );
}
