import { ReactNode } from "react";
import { useForm, FormProvider, FieldValues, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodSchema } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // ensure you have this utility

export type TabConfig = {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
};

interface DynamicFormProps<T extends FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  tabs: TabConfig[];
  defaultValues: DefaultValues<T>;
  validationSchema: ZodSchema<T>;
  onSubmit: (values: T) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}

export function DynamicForm<T extends FieldValues>({
  open,
  onOpenChange,
  title,
  description,
  tabs,
  defaultValues,
  validationSchema,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save",
  cancelLabel = "Cancel",
}: DynamicFormProps<T>) {
  const methods = useForm<T>({
    resolver: zodResolver(validationSchema as any),
    defaultValues,
    mode: "onBlur",
  });

  const handleFormSubmit = methods.handleSubmit(onSubmit);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] min-w-5xl flex-col gap-0 overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="shrink-0 px-6 py-5">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <FormProvider {...methods}>
          <form
            onSubmit={handleFormSubmit}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <Tabs defaultValue={tabs[0]?.id} className="flex flex-1 flex-col overflow-hidden">
              {/* Tab bar */}
              <div className="shrink-0 px-6 pt-3">
                <TabsList className="h-auto w-fit justify-start gap-1 rounded-lg bg-muted-foreground/10 p-0.5">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        "relative rounded-t-md rounded-b-none border border-b-0 border-transparent px-4 py-2.5 text-sm text-muted-foreground",
                        "data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none",
                        "data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:-bottom-px data-[state=active]:after:h-px data-[state=active]:after:bg-background",
                        "flex items-center gap-2 transition-colors"
                      )}
                    >
                      {tab.icon}
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {tabs.map((tab) => (
                  <TabsContent
                    key={tab.id}
                    value={tab.id}
                    className="mt-0 animate-in fade-in-0 slide-in-from-bottom-1 duration-200 focus-visible:outline-none"
                  >
                    {tab.content}
                  </TabsContent>
                ))}
              </div>
            </Tabs>

            {/* Footer */}
            <DialogFooter className="shrink-0 gap-2 border-t bg-background/95 px-6 py-4 backdrop-blur supports-backdrop-filter:bg-background/80">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {cancelLabel}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-28">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}