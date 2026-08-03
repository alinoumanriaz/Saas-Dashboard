/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useLazyQuery } from "@apollo/client/react";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import dynamic from "next/dynamic";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Pencil,
  FileText,
  Search,
  Eye,
  Clock,
} from "lucide-react";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { gql } from "@apollo/client";
import { removeTypename } from "@/helpers/removetypename";

const TiptopEditor = dynamic(() => import("@/components/TiptopTextEditor"), {
  ssr: false,
});

// --------------------- GraphQL Queries & Mutations ---------------------

export const GET_DELIVERY_INFO_PAGE = gql`
  query GetDeliveryInfoPage {
    getPage(slug: "delivery-info") {
      id
      slug
      content
      h1Tag
      metaTitle
      metaDescription
      shortDescription
      author
      updatedAt
    }
  }
`;

const UPDATE_DELIVERY_INFO_PAGE = gql`
  mutation UpdateDeliveryInfoPage($id: ID!, $input: UpdatePageInput!) {
    updatePage(id: $id, input: $input) {
      success
      message
      page {
        id
        slug
        content
        h1Tag
        metaTitle
        metaDescription
        shortDescription
        author
        updatedAt
      }
    }
  }
`;

const CHECK_UNIQUE = gql`
  query CheckUnique($input: CheckUniqueInput!) {
    checkUnique(input: $input) {
      isUnique
      success
      message
    }
  }
`;

// --------------------- Types ---------------------

type CheckStatus = "idle" | "checking" | "available" | "taken";
type LengthStatus = "idle" | "good" | "short" | "long";

// --------------------- Presentational Helpers ---------------------

const FieldStatusBadge = ({
  status,
}: {
  status: CheckStatus | LengthStatus;
}) => {
  if (status === "idle") return null;
  const map: Record<
    string,
    {
      variant: "default" | "destructive" | "secondary";
      icon: React.ReactNode;
      label: string;
    }
  > = {
    checking: {
      variant: "secondary",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      label: "Checking…",
    },
    available: {
      variant: "default",
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: "Available",
    },
    good: {
      variant: "default",
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: "Good length",
    },
    taken: {
      variant: "destructive",
      icon: <XCircle className="h-3 w-3" />,
      label: "Already in use",
    },
    short: {
      variant: "secondary",
      icon: <AlertCircle className="h-3 w-3" />,
      label: "Too short",
    },
    long: {
      variant: "destructive",
      icon: <XCircle className="h-3 w-3" />,
      label: "Too long",
    },
  };
  const cfg = map[status];
  if (!cfg) return null;
  return (
    <Badge variant={cfg.variant} className="gap-1 font-normal">
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
};

const CharCountBadge = ({
  length,
  min,
  max,
}: {
  length: number;
  min?: number;
  max: number;
}) => {
  let variant: "default" | "destructive" | "secondary" = "secondary";
  if (length > max) variant = "destructive";
  else if (min && length > 0 && length < min) variant = "secondary";
  else if (length > 0) variant = "default";
  return (
    <Badge variant={variant} className="font-normal tabular-nums">
      {length}/{max}
    </Badge>
  );
};

// --------------------- Main Component ---------------------

const DeliveryInfoPage = () => {
  // Editing mode & local editable state
  const [isEditing, setIsEditing] = useState(false);
  const [tempContent, setTempContent] = useState<string>("");
  const [h1Tag, setH1Tag] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [pageId, setPageId] = useState<string | undefined>();

  // Unique / validation check states
  const [h1CheckStatus, setH1CheckStatus] = useState<CheckStatus>("idle");
  const [metaTitleCheckStatus, setMetaTitleCheckStatus] =
    useState<CheckStatus>("idle");
  const [metaDescCheckStatus, setMetaDescCheckStatus] =
    useState<LengthStatus>("idle");

  // Tracks whether the form has unsaved edits
  const [isDirty, setIsDirty] = useState(false);

  const currentcompanyMember = useAppSelector(
    (state) => state.currentCompanyMember.companyMember
  );

  // -------------- GraphQL hooks --------------
  const {
    loading: pageLoading,
    error: pageError,
    data,
    refetch,
  } = useQuery<any>(GET_DELIVERY_INFO_PAGE, {
    skip: !currentcompanyMember?.id,
    fetchPolicy: "network-only",
  });

  const [updatePage, { loading: updating }] = useMutation<any>(
    UPDATE_DELIVERY_INFO_PAGE,
    {
      onCompleted: (data) => {
        if (data.updatePage.success) {
          toast.success("Page updated successfully", { position: "top-center" });
          setIsEditing(false);
          setIsDirty(false);
          setH1CheckStatus("idle");
          setMetaTitleCheckStatus("idle");
          setMetaDescCheckStatus("idle");
          refetch();
        } else {
          toast.error(data.updatePage.message || "Couldn't update the page", {
            position: "top-center",
          });
        }
      },
      onError: (error) => {
        toast.error(error.message || "Couldn't update the page", {
          position: "top-center",
        });
      },
    }
  );

  const [checkUnique, { loading: uniqueLoading }] = useLazyQuery<any>(
    CHECK_UNIQUE,
    {
      fetchPolicy: "network-only",
    }
  );

  // -------------- Sync fetched data to local state (only when not editing) --------------
  useEffect(() => {
    if (data?.getPage && !isEditing) {
      const page = data.getPage;
      setPageId(page.id);
      setTempContent(page.content || "");
      setH1Tag(page.h1Tag || "");
      setMetaTitle(page.metaTitle || "");
      setMetaDescription(page.metaDescription || "");
      setShortDescription(page.shortDescription || "");
    }
  }, [data, isEditing]);

  // Auto-extract H1 from content while editing
  useEffect(() => {
    if (isEditing && tempContent) {
      const h1Match = tempContent.match(/^#\s+(.+)$/m);
      if (h1Match && !h1Tag.trim()) {
        setH1Tag(h1Match[1].trim());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempContent, isEditing]);

  // -------------- Helpers --------------
  const extractH1FromContent = (content: string) => {
    if (!content) return "";
    const h1Markdown = content.match(/^#\s+(.+)$/m);
    if (h1Markdown) return h1Markdown[1].trim();
    const h1Html = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Html) return h1Html[1].replace(/<[^>]*>/g, "").trim();
    return "";
  };

  const checkH1InContent = () => !!extractH1FromContent(tempContent);

  const checkMetaDescLength = (desc: string): LengthStatus | "empty" => {
    const len = desc.length;
    if (len === 0) return "empty";
    if (len < 120) return "short";
    if (len > 160) return "long";
    return "good";
  };

  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  // -------------- Event handlers --------------
  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Discard them and exit editing?"
      );
      if (!confirmed) return;
    }
    if (data?.getPage) {
      const page = data.getPage;
      setTempContent(page.content || "");
      setH1Tag(page.h1Tag || "");
      setMetaTitle(page.metaTitle || "");
      setMetaDescription(page.metaDescription || "");
      setShortDescription(page.shortDescription || "");
    }
    setH1CheckStatus("idle");
    setMetaTitleCheckStatus("idle");
    setMetaDescCheckStatus("idle");
    setIsDirty(false);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!pageId) {
      return toast.error("No page ID available", { position: "top-center" });
    }
    if (!currentcompanyMember?.id) {
      return toast.error("You must be signed in to save changes", {
        position: "top-center",
      });
    }

    const h1InContent = checkH1InContent();
    if (!h1Tag.trim() && !h1InContent) {
      return toast.warning(
        "Add an H1 tag, either in the content or in the H1 field",
        { position: "top-center" }
      );
    }
    if (!metaTitle.trim()) {
      return toast.warning("Meta title is required", { position: "top-center" });
    }
    if (h1CheckStatus === "taken") {
      return toast.warning("Choose a unique H1 tag before saving", {
        position: "top-center",
      });
    }
    if (metaTitleCheckStatus === "taken") {
      return toast.warning("Choose a unique meta title before saving", {
        position: "top-center",
      });
    }
    const descStatus = checkMetaDescLength(metaDescription);
    if (descStatus === "long") {
      return toast.warning(
        "Meta description is too long (160 characters max)",
        { position: "top-center" }
      );
    }

    const inputData: any = {
      slug: "delivery-info",
      content: tempContent,
      h1Tag: h1Tag.trim(),
      metaTitle: metaTitle.trim(),
      metaDescription: metaDescription.trim(),
      shortDescription: shortDescription.trim(),
      author: currentcompanyMember.id,
    };

    const input = removeTypename(inputData);

    updatePage({ variables: { id: pageId, input } });
  };

  const handleContentChange = (newContent: string) => {
    setTempContent(newContent);
    markDirty();
  };

  // ---------- Unique checks ----------
  const checkH1TagUnique = async () => {
    if (!h1Tag.trim()) {
      toast.warning("Enter an H1 tag first", { position: "top-center" });
      return;
    }
    setH1CheckStatus("checking");
    try {
      const { data } = await checkUnique({
        variables: {
          input: {
            field: "h1Tag",
            value: h1Tag,
            model: "pages",
            excludeId: pageId || undefined,
          },
        },
      });
      if (data?.checkUnique?.isUnique) {
        setH1CheckStatus("available");
        toast.success("H1 tag is available", { position: "top-center" });
      } else {
        setH1CheckStatus("taken");
        toast.warning("That H1 tag is already in use", { position: "top-center" });
      }
    } catch (err: any) {
      setH1CheckStatus("idle");
      toast.error(err.message || "Couldn't check the H1 tag", {
        position: "top-center",
      });
    }
  };

  const checkMetaTitleUnique = async () => {
    if (!metaTitle.trim()) {
      toast.warning("Enter a meta title first", { position: "top-center" });
      return;
    }
    setMetaTitleCheckStatus("checking");
    try {
      const { data } = await checkUnique({
        variables: {
          input: {
            field: "metaTitle",
            value: metaTitle,
            model: "pages",
            excludeId: pageId || undefined,
          },
        },
      });
      if (data?.checkUnique?.isUnique) {
        setMetaTitleCheckStatus("available");
        toast.success("Meta title is available", { position: "top-center" });
      } else {
        setMetaTitleCheckStatus("taken");
        toast.warning("That meta title is already in use", {
          position: "top-center",
        });
      }
    } catch (err: any) {
      setMetaTitleCheckStatus("idle");
      toast.error(err.message || "Couldn't check the meta title", {
        position: "top-center",
      });
    }
  };

  const checkMetaDescriptionStatus = () => {
    const status = checkMetaDescLength(metaDescription);
    if (status === "empty") {
      toast.info("Meta description is empty", { position: "top-center" });
      return;
    }
    setMetaDescCheckStatus(status);
    if (status === "short")
      toast.warning(
        "A little short — aim for 120–160 characters",
        { position: "top-center" }
      );
    else if (status === "long")
      toast.warning("Too long — keep it under 160 characters", {
        position: "top-center",
      });
    else
      toast.success("Meta description length looks good", {
        position: "top-center",
      });
  };

  // ---------- Loading / Error / No data states ----------
  if (pageLoading && !data) {
    return (
      <div className="min-w-6xl p-6 space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-10 w-1/2" />
        </div>
        <Skeleton className="h-[65vh] w-full rounded-xl" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">
                Couldn&apos;t load the Delivery Info page
              </h3>
              <p className="text-sm text-muted-foreground">
                Something went wrong while fetching this page. Check your
                connection and try again.
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()} className="mt-2">
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data?.getPage) {
    return (
      <div className="mx-auto min-w-2xl p-6">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">No Delivery Info page yet</h3>
            <p className="text-sm text-muted-foreground">
              Once a Delivery Info page is created, it will appear here for editing.
            </p>
          </div>
        </CardContent>
      </div>
    );
  }

  const page = data.getPage;
  const metaDescStatusForCount = checkMetaDescLength(metaDescription);

  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl">Delivery Info</CardTitle>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {page.updatedAt
              ? `Last updated ${new Date(page.updatedAt).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}`
              : "Never updated"}
          </p>
        </div>

        {!isEditing ? (
          <Button onClick={handleEdit} className="gap-2 sm:self-auto self-start">
            <Pencil className="h-4 w-4" />
            Edit content
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
              </span>
              Editing
              {isDirty && (
                <span className="text-blue-500">· unsaved changes</span>
              )}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={updating}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updating || !tempContent.trim()}
                className="gap-2"
              >
                {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                {updating ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Card className="overflow-hidden border bg-card">
        <CardContent className="p-0">
          {isEditing ? (
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="space-y-8 p-6">
                {/* SEO readiness checklist */}
                <section aria-labelledby="seo-status-heading">
                  <div className="mb-3 flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <h2
                      id="seo-status-heading"
                      className="text-sm font-semibold text-muted-foreground"
                    >
                      SEO readiness
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[
                      {
                        label: "H1 tag",
                        ok: !!(checkH1InContent() || h1Tag.trim()),
                        msg: checkH1InContent()
                          ? "Found in content"
                          : h1Tag.trim()
                          ? "Set manually"
                          : "Missing — required",
                      },
                      {
                        label: "Meta title",
                        ok: !!metaTitle.trim(),
                        msg: metaTitle.trim()
                          ? `${metaTitle.length}/60 characters`
                          : "Missing — required",
                      },
                      {
                        label: "Meta description",
                        ok:
                          metaDescCheckStatus === "good" ||
                          metaDescStatusForCount === "good",
                        msg:
                          metaDescription.length === 0
                            ? "Optional, but recommended"
                            : `${metaDescription.length}/160 characters`,
                      },
                      {
                        label: "Short description",
                        ok: !!shortDescription.trim(),
                        msg: shortDescription.trim()
                          ? `${shortDescription.length}/300 characters`
                          : "Optional",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-lg border bg-muted/30 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{item.label}</span>
                          {item.ok ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.msg}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* SEO Fields */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* H1 Tag */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="h1-tag" className="text-sm font-medium">
                        H1 tag <span className="text-destructive">*</span>
                      </Label>
                      {checkH1InContent() && (
                        <Badge variant="secondary" className="font-normal">
                          Auto-detected from content
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id="h1-tag"
                        value={h1Tag}
                        onChange={(e) => {
                          setH1Tag(e.target.value);
                          setH1CheckStatus("idle");
                          markDirty();
                        }}
                        placeholder="e.g. Delivery Info – Get in Touch"
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={checkH1TagUnique}
                              disabled={uniqueLoading || !h1Tag.trim()}
                              aria-label="Check H1 tag uniqueness"
                            >
                              {uniqueLoading && h1CheckStatus === "checking" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Search className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Check uniqueness</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <FieldStatusBadge status={h1CheckStatus} />
                      {checkH1InContent() && (
                        <span className="text-xs text-muted-foreground">
                          In content: &quot;{extractH1FromContent(tempContent)}
                          &quot;
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta Title */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="meta-title" className="text-sm font-medium">
                        Meta title <span className="text-destructive">*</span>
                      </Label>
                      <CharCountBadge length={metaTitle.length} max={60} />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id="meta-title"
                        value={metaTitle}
                        onChange={(e) => {
                          setMetaTitle(e.target.value);
                          setMetaTitleCheckStatus("idle");
                          markDirty();
                        }}
                        placeholder="Shown as the clickable title in search results"
                        maxLength={60}
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={checkMetaTitleUnique}
                              disabled={uniqueLoading || !metaTitle.trim()}
                              aria-label="Check meta title uniqueness"
                            >
                              {uniqueLoading &&
                              metaTitleCheckStatus === "checking" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Search className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Check uniqueness</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FieldStatusBadge status={metaTitleCheckStatus} />
                  </div>
                </div>

                {/* Meta Description & Short Description */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="meta-desc" className="text-sm font-medium">
                        Meta description
                      </Label>
                      <CharCountBadge
                        length={metaDescription.length}
                        min={120}
                        max={160}
                      />
                    </div>
                    <Textarea
                      id="meta-desc"
                      value={metaDescription}
                      onChange={(e) => {
                        setMetaDescription(e.target.value);
                        setMetaDescCheckStatus("idle");
                        markDirty();
                      }}
                      placeholder="Shown under the title in search results (120–160 characters works best)"
                      rows={3}
                      maxLength={160}
                    />
                    <div className="flex items-center justify-between">
                      <FieldStatusBadge status={metaDescCheckStatus} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground"
                        onClick={checkMetaDescriptionStatus}
                        disabled={!metaDescription.trim()}
                      >
                        <Search className="h-3.5 w-3.5" />
                        Check length
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="short-desc" className="text-sm font-medium">
                        Short description
                      </Label>
                      <CharCountBadge length={shortDescription.length} max={300} />
                    </div>
                    <Textarea
                      id="short-desc"
                      value={shortDescription}
                      onChange={(e) => {
                        setShortDescription(e.target.value);
                        markDirty();
                      }}
                      placeholder="Internal summary used elsewhere on the site (optional)"
                      rows={3}
                      maxLength={300}
                    />
                    <p className="text-xs text-muted-foreground">
                      Not shown in search results — used for internal previews and
                      listings.
                    </p>
                  </div>
                </div>

                {/* Content Editor */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold text-muted-foreground">
                      Page content
                    </h2>
                  </div>
                  <div className="overflow-hidden rounded-lg border">
                    <TiptopEditor
                      initialValue={tempContent}
                      onChange={handleContentChange}
                      height="h-[400px]"
                    />
                  </div>
                </section>
              </div>
            </ScrollArea>
          ) : (
            /* Non-editing view */
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="mx-6 mt-6 grid grid-cols-2">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="seo">SEO preview</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="p-6 pt-4">
                <ScrollArea className="h-[calc(100vh-320px)] rounded-lg border">
                  {page.content ? (
                    <div
                      className="prose max-w-none p-6"
                      dangerouslySetInnerHTML={{ __html: page.content }}
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 p-12 text-center text-muted-foreground">
                      <FileText className="h-8 w-8" />
                      <p className="text-sm">
                        No content yet. Click &quot;Edit content&quot; to get
                        started.
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="seo" className="space-y-6 p-6 pt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Eye className="h-4 w-4" />
                      Google search preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 rounded-lg border bg-muted/20 p-4">
                      <p className="truncate text-sm text-muted-foreground">
                        https://yourdomain.com › delivery-info
                      </p>
                      <h3 className="text-xl font-medium text-blue-800 hover:underline dark:text-blue-400">
                        {page.metaTitle || "Delivery Info — Your Company"}
                      </h3>
                      <p className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
                        {page.metaDescription ||
                          "No meta description provided."}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[
                    {
                      title: "H1 heading",
                      value: page.h1Tag || extractH1FromContent(page.content),
                      extra:
                        !page.h1Tag && extractH1FromContent(page.content) ? (
                          <Badge variant="outline" className="font-normal">
                            auto-detected
                          </Badge>
                        ) : null,
                    },
                    {
                      title: "Meta title",
                      value: page.metaTitle,
                      badge: (
                        <CharCountBadge
                          length={page.metaTitle?.length || 0}
                          max={60}
                        />
                      ),
                    },
                    {
                      title: "Meta description",
                      value: page.metaDescription,
                      badge: (
                        <CharCountBadge
                          length={page.metaDescription?.length || 0}
                          min={120}
                          max={160}
                        />
                      ),
                    },
                    {
                      title: "Short description",
                      value: page.shortDescription,
                      badge: (
                        <CharCountBadge
                          length={page.shortDescription?.length || 0}
                          max={300}
                        />
                      ),
                    },
                  ].map((item) => (
                    <Card key={item.title}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          {item.title}
                        </CardTitle>
                        {item.badge}
                      </CardHeader>
                      <CardContent>
                        <p
                          className={
                            item.value
                              ? "text-sm text-foreground"
                              : "text-sm italic text-muted-foreground"
                          }
                        >
                          {item.value || "Not set"}
                        </p>
                        {item.extra && <div className="mt-2">{item.extra}</div>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryInfoPage;