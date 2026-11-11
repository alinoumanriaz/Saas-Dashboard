/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useLazyQuery } from "@apollo/client/react";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import Image from "next/image";
import {
  FiX,
  FiEdit2,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiLoader,
  FiFileText,
  FiSearch,
  FiEye,
  FiImage,
  FiClock,
  FiInfo,
  FiUploadCloud,
} from "react-icons/fi";
import { Box, Check, LoaderCircle } from "lucide-react";
import dynamic from "next/dynamic";
import GalleryModel from "@/components/popup/models/GalleryModel";
import { gql } from "@apollo/client";
import { removeTypename } from "@/helpers/removetypename";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FieldLabel } from "@/components/ui/field";

const TiptopEditor = dynamic(() => import("@/components/TiptopTextEditor"), {
  ssr: false,
});

/* ============================================================
 * GraphQL
 * ============================================================ */
export const GET_PAGE = gql`
  query GetPage {
    getPage(slug: "home") {
      id
      slug
      content
      h1Tag
      metaTitle
      metaDescription
      shortDescription
      bannerImages {
        mobilebannerImage {
          url
          alt
        }
        desktopbannerImage {
          url
          alt
        }
      }
      author
      updatedAt
    }
  }
`;

const UPDATE_PAGE = gql`
  mutation UpdatePage($id: ID!, $input: UpdatePageInput!) {
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
        bannerImages {
          mobilebannerImage {
            url
            alt
          }
          desktopbannerImage {
            url
            alt
          }
        }
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

/* ============================================================
 * Types
 * ============================================================ */
type BannerKey = "mobilebannerImage" | "desktopbannerImage";
type CheckStatus = "idle" | "checking" | "available" | "taken";
type LengthStatus = "idle" | "good" | "short" | "long";

/* ============================================================
 * Shared inline UI helpers (mirrors AddProduct/AddIndustry)
 * ============================================================ */
const Section = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    {children}
  </div>
);

const SectionHeader = ({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-primary/90 ring-1 ring-indigo-100">
      {icon}
    </div>
    <div>
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
    </div>
  </div>
);

const FieldErrorMsg = ({ message }: { message?: string }) =>
  message ? (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600">
      <FiXCircle className="size-3.5 shrink-0" />
      {message}
    </p>
  ) : null;

const Hint = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
    <FiInfo className="size-3" /> {children}
  </p>
);

const UniquenessResult = ({ status }: { status: CheckStatus }) => {
  if (status === "idle") return null;
  const ok = status === "available";
  return (
    <p
      className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium ${
        ok ? "text-emerald-600" : status === "checking" ? "text-slate-500" : "text-rose-600"
      }`}
    >
      {status === "checking" ? (
        <FiLoader className="size-3.5 shrink-0 animate-spin" />
      ) : ok ? (
        <FiCheckCircle className="size-3.5 shrink-0" />
      ) : (
        <FiXCircle className="size-3.5 shrink-0" />
      )}
      {status === "checking"
        ? "Checking…"
        : ok
          ? "Available"
          : "Already in use"}
    </p>
  );
};

const CharCount = ({
  length,
  max,
  min,
}: {
  length: number;
  max: number;
  min?: number;
}) => {
  const tone =
    length > max
      ? "text-rose-500"
      : min && length > 0 && length < min
        ? "text-amber-500"
        : "text-emerald-600";
  return (
    <span className={`text-xs font-medium tabular-nums ${tone}`}>
      {length}/{max}
    </span>
  );
};

/* ============================================================
 * Component
 * ============================================================ */
const Page = () => {
  /* ---------- Local editable state ---------- */
  const [isEditing, setIsEditing] = useState(false);
  const [tempContent, setTempContent] = useState<string>("");
  const [h1Tag, setH1Tag] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [pageId, setPageId] = useState<any>();

  const companyCurrentWebsite = useAppSelector(
    (state) => state.companyCurrentWebsite.companyWebsite
  );
  const currentWebsiteId = companyCurrentWebsite?.id;

  /* ---------- Banner images ---------- */
  const [bannerImages, setBannerImages] = useState<{
    mobilebannerImage: any;
    desktopbannerImage: any;
  }>({
    mobilebannerImage: { url: "", alt: "" },
    desktopbannerImage: { url: "", alt: "" },
  });

  /* ---------- Gallery ---------- */
  const [showGalleryOpen, setShowGalleryOpen] = useState(false);
  const [galleryMode, setGalleryMode] = useState<BannerKey>("desktopbannerImage");

  /* ---------- Validation status ---------- */
  const [h1CheckStatus, setH1CheckStatus] = useState<CheckStatus>("idle");
  const [metaTitleCheckStatus, setMetaTitleCheckStatus] = useState<CheckStatus>("idle");
  const [metaDescCheckStatus, setMetaDescCheckStatus] = useState<LengthStatus>("idle");

  const [isDirty, setIsDirty] = useState(false);
  const currentcompanyMember = useAppSelector(
    (state) => state.currentCompanyMember.companyMember
  );

  /* ---------- GraphQL ---------- */
  const {
    loading: pageLoading,
    error: pageError,
    data,
    refetch,
  } = useQuery<any>(GET_PAGE, {
    skip: !currentcompanyMember?.id,
    fetchPolicy: "network-only",
  });

  const [updatePage, { loading: updating }] = useMutation<any>(UPDATE_PAGE, {
    onCompleted: (data) => {
      if (data.updatePage.success) {
        toast.success("Page updated successfully");
        setIsEditing(false);
        setIsDirty(false);
        setH1CheckStatus("idle");
        setMetaTitleCheckStatus("idle");
        setMetaDescCheckStatus("idle");
        refetch();
      } else {
        toast.error(data.updatePage.message || "Couldn't update the page");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Couldn't update the page");
    },
  });

  const [checkUnique, { loading: uniqueLoading }] = useLazyQuery<any>(CHECK_UNIQUE, {
    fetchPolicy: "network-only",
  });

  /* ---------- Sync fetched data to local state ---------- */
  useEffect(() => {
    if (data?.getPage && !isEditing) {
      const page = data.getPage;
      setPageId(page.id);
      setTempContent(page.content || "");
      setH1Tag(page.h1Tag || "");
      setMetaTitle(page.metaTitle || "");
      setMetaDescription(page.metaDescription || "");
      setShortDescription(page.shortDescription || "");
      setBannerImages({
        mobilebannerImage: page.bannerImages?.mobilebannerImage || { url: "", alt: "" },
        desktopbannerImage: page.bannerImages?.desktopbannerImage || { url: "", alt: "" },
      });
    }
  }, [data, isEditing]);

  /* ---------- Auto-extract H1 ---------- */
  useEffect(() => {
    if (isEditing && tempContent) {
      const h1Match = tempContent.match(/^#\s+(.+)$/m);
      if (h1Match && !h1Tag.trim()) setH1Tag(h1Match[1].trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempContent, isEditing]);

  /* ---------- Helpers ---------- */
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

  /* ---------- Handlers ---------- */
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
      setBannerImages({
        mobilebannerImage: page.bannerImages?.mobilebannerImage || { url: "", alt: "" },
        desktopbannerImage: page.bannerImages?.desktopbannerImage || { url: "", alt: "" },
      });
    }
    setH1CheckStatus("idle");
    setMetaTitleCheckStatus("idle");
    setMetaDescCheckStatus("idle");
    setIsDirty(false);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!pageId) return toast.error("No page ID available");
    if (!currentcompanyMember?.id)
      return toast.error("You must be signed in to save changes");

    const h1InContent = checkH1InContent();
    if (!h1Tag.trim() && !h1InContent)
      return toast.warning("Add an H1 tag, either in the content or in the H1 field");
    if (!metaTitle.trim()) return toast.warning("Meta title is required");
    if (h1CheckStatus === "taken")
      return toast.warning("Choose a unique H1 tag before saving");
    if (metaTitleCheckStatus === "taken")
      return toast.warning("Choose a unique meta title before saving");
    if (checkMetaDescLength(metaDescription) === "long")
      return toast.warning("Meta description is too long (160 characters max)");

    const inputData: any = {
      slug: "home",
      content: tempContent,
      h1Tag: h1Tag.trim(),
      metaTitle: metaTitle.trim(),
      metaDescription: metaDescription.trim(),
      shortDescription: shortDescription.trim(),
      bannerImages,
      author: currentcompanyMember.id,
    };

    updatePage({ variables: { id: pageId, input: removeTypename(inputData) } });
  };

  const handleContentChange = (newContent: string) => {
    setTempContent(newContent);
    markDirty();
  };

  /* ---------- Unique checks ---------- */
  const checkH1TagUnique = async () => {
    if (!h1Tag.trim()) {
      toast.warning("Enter an H1 tag first");
      return;
    }
    setH1CheckStatus("checking");
    try {
      const { data } = await checkUnique({
        variables: {
          input: { field: "h1Tag", value: h1Tag, model: "pages", excludeId: pageId || undefined },
        },
      });
      if (data?.checkUnique?.isUnique) {
        setH1CheckStatus("available");
        toast.success("H1 tag is available");
      } else {
        setH1CheckStatus("taken");
        toast.warning("That H1 tag is already in use");
      }
    } catch (err: any) {
      setH1CheckStatus("idle");
      toast.error(err.message || "Couldn't check the H1 tag");
    }
  };

  const checkMetaTitleUnique = async () => {
    if (!metaTitle.trim()) {
      toast.warning("Enter a meta title first");
      return;
    }
    setMetaTitleCheckStatus("checking");
    try {
      const { data } = await checkUnique({
        variables: {
          input: { field: "metaTitle", value: metaTitle, model: "pages", excludeId: pageId || undefined },
        },
      });
      if (data?.checkUnique?.isUnique) {
        setMetaTitleCheckStatus("available");
        toast.success("Meta title is available");
      } else {
        setMetaTitleCheckStatus("taken");
        toast.warning("That meta title is already in use");
      }
    } catch (err: any) {
      setMetaTitleCheckStatus("idle");
      toast.error(err.message || "Couldn't check the meta title");
    }
  };

  const checkMetaDescriptionStatus = () => {
    const status = checkMetaDescLength(metaDescription);
    if (status === "empty") {
      toast.info("Meta description is empty");
      return;
    }
    setMetaDescCheckStatus(status);
    if (status === "short") toast.warning("A little short — aim for 120–160 characters");
    else if (status === "long") toast.warning("Too long — keep it under 160 characters");
    else toast.success("Meta description length looks good");
  };

  /* ---------- Banner ---------- */
  const handleSelectedImage = (images: any[]) => {
    if (images.length > 0) {
      setBannerImages((prev) => ({ ...prev, [galleryMode]: images[0] }));
      markDirty();
    }
    setShowGalleryOpen(false);
  };
  const openGallery = (mode: BannerKey) => {
    setGalleryMode(mode);
    setShowGalleryOpen(true);
  };
  const removeImage = (mode: BannerKey) => {
    setBannerImages((prev) => ({ ...prev, [mode]: { url: "", alt: "" } }));
    markDirty();
  };
  const updateImageAlt = (mode: BannerKey, alt: string) => {
    setBannerImages((prev) => ({ ...prev, [mode]: { ...prev[mode], alt } }));
    markDirty();
  };

  useEffect(() => {
    if (currentWebsiteId) refetch();
  }, [currentWebsiteId, refetch]);

  /* ============================================================
   * Loading / Error / No data
   * ============================================================ */
  if (pageLoading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="space-y-4">
          <div className="h-12 w-1/2 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-[65vh] animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-2xl">
          <Section>
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <FiAlertCircle className="size-10 text-rose-500" />
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  Couldn&apos;t load the home page
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Something went wrong while fetching this page.
                </p>
              </div>
              <Button variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          </Section>
        </div>
      </div>
    );
  }

  if (!data?.getPage) {
    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-2xl">
          <Section>
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <FiFileText className="size-10 text-slate-400" />
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  No home page yet
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Once a home page is created, it will appear here for editing.
                </p>
              </div>
            </div>
          </Section>
        </div>
      </div>
    );
  }

  const page = data.getPage;
  const metaDescStatusForCount = checkMetaDescLength(metaDescription);

  /* ============================================================
   * Main render
   * ============================================================ */
  return (
    <div className="min-h-screen p-4 md:p-6 space-y-5">
      {/* ============ Header ============ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-indigo-500/30">
            <FiFileText size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Home page</h1>
            <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <FiClock className="size-3" />
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
        </div>

        {!isEditing ? (
          <Button
            onClick={handleEdit}
            className="gap-2 bg-primary/90 hover:bg-primary sm:self-auto self-start"
          >
            <FiEdit2 className="size-4" />
            Edit content
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-primary">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-indigo-500" />
              </span>
              Editing{isDirty && " · unsaved"}
            </span>
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={updating}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updating || !tempContent.trim()}
              className="gap-2 bg-primary/90 hover:bg-primary min-w-32.5"
            >
              {updating ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>Save changes</>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* ============ Body ============ */}
      {isEditing ? (
        <ScrollArea className="h-[calc(100vh-190px)]">
          <div className="space-y-5 pb-6">
            {/* SEO readiness */}
            <Section>
              <SectionHeader
                title="SEO readiness"
                desc="Quick health check for your on-page SEO."
                icon={<FiSearch className="size-4" />}
              />
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
                    className={`rounded-lg border p-3 transition ${
                      item.ok
                        ? "border-emerald-100 bg-emerald-50/50"
                        : "border-slate-200 bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-700">
                        {item.label}
                      </span>
                      {item.ok ? (
                        <FiCheckCircle className="size-3.5 shrink-0 text-emerald-500" />
                      ) : (
                        <FiAlertCircle className="size-3.5 shrink-0 text-amber-500" />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">{item.msg}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* SEO fields */}
            <Section>
              <SectionHeader
                title="Search Engine Optimization"
                desc="How this page appears in search engine results."
                icon={<FiSearch className="size-4" />}
              />
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                {/* H1 */}
                <div>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="h1-tag">H1 tag</FieldLabel>
                    {checkH1InContent() && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                        auto-detected
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="h1-tag"
                      value={h1Tag}
                      onChange={(e) => {
                        setH1Tag(e.target.value);
                        setH1CheckStatus("idle");
                        markDirty();
                      }}
                      placeholder="e.g. Build better software, faster"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={checkH1TagUnique}
                      disabled={uniqueLoading || !h1Tag.trim()}
                      className="shrink-0 bg-primary/90 text-white hover:bg-primary"
                    >
                      {uniqueLoading && h1CheckStatus === "checking" ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        "Check"
                      )}
                    </Button>
                  </div>
                  <UniquenessResult status={h1CheckStatus} />
                  {checkH1InContent() && (
                    <Hint>
                      In content: “{extractH1FromContent(tempContent)}”
                    </Hint>
                  )}
                </div>

                {/* Meta title */}
                <div>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="meta-title">
                      Meta title <span className="text-destructive">*</span>
                    </FieldLabel>
                    <CharCount length={metaTitle.length} max={60} />
                  </div>
                  <div className="flex gap-2 mt-1">
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
                    <Button
                      type="button"
                      size="sm"
                      onClick={checkMetaTitleUnique}
                      disabled={uniqueLoading || !metaTitle.trim()}
                      className="shrink-0 bg-primary/90 text-white hover:bg-primary"
                    >
                      {uniqueLoading && metaTitleCheckStatus === "checking" ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        "Check"
                      )}
                    </Button>
                  </div>
                  <UniquenessResult status={metaTitleCheckStatus} />
                </div>

                {/* Meta description */}
                <div>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="meta-desc">
                      Meta description
                    </FieldLabel>
                    <CharCount
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
                    className="mt-1"
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    <UniquenessResult
                      status={
                        metaDescCheckStatus === "good"
                          ? "available"
                          : metaDescCheckStatus === "idle"
                            ? "idle"
                            : "taken"
                      }
                    />
                    <button
                      type="button"
                      onClick={checkMetaDescriptionStatus}
                      disabled={!metaDescription.trim()}
                      className="text-[11px] font-medium text-primary/90 hover:underline disabled:opacity-40"
                    >
                      Check length
                    </button>
                  </div>
                </div>

                {/* Short description */}
                <div>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="short-desc">
                      Short description
                    </FieldLabel>
                    <CharCount length={shortDescription.length} max={300} />
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
                    className="mt-1"
                  />
                  <Hint>
                    Not shown in search results — used for internal previews.
                  </Hint>
                </div>
              </div>
            </Section>

            {/* Banner images */}
            <Section>
              <SectionHeader
                title="Banner images"
                desc="Two fixed slots — one for mobile, one for desktop."
                icon={<FiImage className="size-4" />}
              />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {(
                  [
                    {
                      key: "mobilebannerImage" as const,
                      label: "Mobile banner",
                      aspect: "aspect-[9/16] max-h-72",
                    },
                    {
                      key: "desktopbannerImage" as const,
                      label: "Desktop banner",
                      aspect: "aspect-video",
                    },
                  ]
                ).map(({ key, label, aspect }) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-medium text-slate-600">
                        {label}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {key === "mobilebannerImage" ? "9:16" : "16:9"}
                      </span>
                    </div>

                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => openGallery(key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") openGallery(key);
                      }}
                      className={`group relative w-full ${aspect} cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 transition hover:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30`}
                    >
                      {bannerImages[key].url ? (
                        <>
                          <Image
                            src={bannerImages[key].url}
                            alt={bannerImages[key].alt || label}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-800 shadow">
                              Change
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(key);
                              }}
                              aria-label={`Remove ${label.toLowerCase()}`}
                              className="rounded-full bg-rose-500/90 px-3 py-1 text-[11px] font-medium text-white shadow hover:bg-rose-600"
                            >
                              Remove
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-400 transition hover:text-primary/90">
                          <FiUploadCloud className="size-7" />
                          <span className="text-xs font-medium">
                            Add image
                          </span>
                        </div>
                      )}
                    </div>

                    <Input
                      value={bannerImages[key].alt || ""}
                      onChange={(e) => updateImageAlt(key, e.target.value)}
                      placeholder="Alt text (for accessibility & SEO)"
                      disabled={!bannerImages[key].url}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </Section>

            {/* Content editor */}
            <Section>
              <SectionHeader
                title="Page content"
                desc="Rich text content shown on the public home page."
                icon={<FiFileText className="size-4" />}
              />
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <TiptopEditor
                  initialValue={tempContent}
                  onChange={handleContentChange}
                  height={`h-[400px]`}
                />
              </div>
            </Section>
          </div>
        </ScrollArea>
      ) : (
        /* ============ Read view ============ */
        <ReadView
          page={page}
          extractH1FromContent={extractH1FromContent}
        />
      )}

      {/* Gallery Modal */}
      {showGalleryOpen && (
        <GalleryModel
          onCancel={() => setShowGalleryOpen(false)}
          onSentSelected={handleSelectedImage}
          mode="single"
        />
      )}
    </div>
  );
};

/* ============================================================
 * Read-only view (three tabs, same look)
 * ============================================================ */
const ReadView = ({
  page,
  extractH1FromContent,
}: {
  page: any;
  extractH1FromContent: (s: string) => string;
}) => {
  const [tab, setTab] = useState<"content" | "seo" | "banner">("content");

  const tabs: { id: typeof tab; label: string; icon: React.ReactNode }[] = [
    { id: "content", label: "Content", icon: <FiFileText className="size-3.5" /> },
    { id: "seo", label: "SEO preview", icon: <FiEye className="size-3.5" /> },
    { id: "banner", label: "Banner images", icon: <FiImage className="size-3.5" /> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-white px-2 shadow-sm ring-1 ring-slate-200">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-medium transition ${
                active
                  ? "border-indigo-500 text-primary/90"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "content" && (
        <Section>
          {page.content ? (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-400">
              <FiFileText className="size-7" />
              <p className="text-xs">
                No content yet. Click &quot;Edit content&quot; to get started.
              </p>
            </div>
          )}
        </Section>
      )}

      {tab === "seo" && (
        <div className="space-y-5">
          <Section>
            <SectionHeader
              title="Google search preview"
              desc="How this page appears in search results."
              icon={<FiEye className="size-4" />}
            />
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <p className="truncate text-xs text-slate-500">
                https://yourdomain.com › home
              </p>
              <h3 className="mt-1 line-clamp-2 text-[17px] font-normal leading-snug text-[#1a0dab] hover:underline cursor-pointer">
                {page.metaTitle || "Home — Your Company"}
              </h3>
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                {page.metaDescription || "No meta description provided."}
              </p>
            </div>
          </Section>

          <Section>
            <SectionHeader
              title="SEO fields"
              desc="Current metadata set for this page."
              icon={<FiSearch className="size-4" />}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                {
                  title: "H1 heading",
                  value:
                    page.h1Tag || extractH1FromContent(page.content),
                  extra:
                    !page.h1Tag && extractH1FromContent(page.content)
                      ? "auto-detected"
                      : undefined,
                },
                {
                  title: "Meta title",
                  value: page.metaTitle,
                  count: { length: page.metaTitle?.length || 0, max: 60 },
                },
                {
                  title: "Meta description",
                  value: page.metaDescription,
                  count: {
                    length: page.metaDescription?.length || 0,
                    min: 120,
                    max: 160,
                  },
                },
                {
                  title: "Short description",
                  value: page.shortDescription,
                  count: { length: page.shortDescription?.length || 0, max: 300 },
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-slate-200 bg-white p-3.5"
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">
                      {item.title}
                    </span>
                    {item.count ? (
                      <CharCount {...item.count} />
                    ) : item.extra ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                        {item.extra}
                      </span>
                    ) : null}
                  </div>
                  <p
                    className={
                      item.value
                        ? "text-sm text-slate-800"
                        : "text-sm italic text-slate-400"
                    }
                  >
                    {item.value || "Not set"}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {tab === "banner" && (
        <Section>
          <SectionHeader
            title="Banner images"
            desc="Mobile and desktop variants currently in use."
            icon={<FiImage className="size-4" />}
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {(["mobilebannerImage", "desktopbannerImage"] as const).map(
              (key) => {
                const img = page.bannerImages?.[key];
                const label =
                  key === "mobilebannerImage" ? "Mobile banner" : "Desktop banner";
                return (
                  <div
                    key={key}
                    className="overflow-hidden rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-3.5 py-2">
                      <span className="text-xs font-medium text-slate-700">
                        {label}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          img?.url
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {img?.url ? "Set" : "Not set"}
                      </span>
                    </div>
                    <div className="p-3.5">
                      {img?.url ? (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-100">
                          <Image
                            src={img.url}
                            alt={img.alt || label}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-40 flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400">
                          <FiImage className="size-6" />
                          <p className="text-xs">No image set</p>
                        </div>
                      )}
                      {img?.alt && (
                        <p className="mt-2 text-xs text-slate-500">
                          <span className="font-medium text-slate-700">
                            Alt text:
                          </span>{" "}
                          {img.alt}
                        </p>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </Section>
      )}
    </div>
  );
};

export default Page;