/**
 * Pinned "Ví dụ mẫu" entry — end-to-end behavior tests.
 *
 * Verifies, across the four AI feature pages:
 *   1. The PinnedDemoEntry component renders correctly (label, viewing badge,
 *      loading state, click handler).
 *   2. useDemoExample.fetchDemo() loads the right demo payload per feature
 *      (luan_giai / boi_kieu / boi_que / van_han_week|month|year) and
 *      exitDemo() clears it.
 *   3. Static audit on every page that owns a history list:
 *        a. The pinned entry is only rendered when `user && !isGuest`
 *           (guests must NOT see it).
 *        b. Its onClick fetches the correct DemoFeature key for that page /
 *           tab.
 *        c. Clicking a real history item exits demo mode (`exitDemo()` or
 *           equivalent state reset) so real history is preserved and shown
 *           instead of the demo.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, fireEvent, renderHook, act, waitFor } from "@testing-library/react";
import { PinnedDemoEntry } from "@/components/PinnedDemoEntry";

// ---------------------------------------------------------------------------
// Module mocks (must come before importing useDemoExample)
// ---------------------------------------------------------------------------
const invokeMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: invokeMock },
  },
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

beforeEach(() => {
  invokeMock.mockReset();
});

// ---------------------------------------------------------------------------
// Layer 1 — PinnedDemoEntry component rendering
// ---------------------------------------------------------------------------
describe("<PinnedDemoEntry />", () => {
  it("renders default demo label and MẪU badge", () => {
    render(<PinnedDemoEntry isViewing={false} onClick={() => {}} />);
    expect(screen.getByText(/Ví dụ mẫu \(Nguyễn Văn A\)/)).toBeInTheDocument();
    expect(screen.getByText(/MẪU/)).toBeInTheDocument();
    expect(screen.queryByText(/Đang xem/)).not.toBeInTheDocument();
  });

  it("shows 'Đang xem' badge when isViewing is true", () => {
    render(<PinnedDemoEntry isViewing onClick={() => {}} />);
    expect(screen.getByText(/Đang xem/)).toBeInTheDocument();
  });

  it("invokes onClick when clicked", () => {
    const onClick = vi.fn();
    render(<PinnedDemoEntry isViewing={false} onClick={onClick} />);
    fireEvent.click(screen.getByText(/Ví dụ mẫu/).closest("div")!.parentElement!);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does NOT invoke onClick while loading", () => {
    const onClick = vi.fn();
    render(<PinnedDemoEntry isViewing={false} loading onClick={onClick} />);
    fireEvent.click(screen.getByText(/Ví dụ mẫu/).closest("div")!.parentElement!);
    expect(onClick).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Layer 2 — useDemoExample integration: feature → payload mapping
// ---------------------------------------------------------------------------
describe("useDemoExample.fetchDemo per feature", () => {
  const FEATURES = [
    "luan_giai",
    "boi_kieu",
    "boi_que",
    "van_han_week",
    "van_han_month",
    "van_han_year",
  ] as const;

  it.each(FEATURES)("loads demo payload for feature=%s and exitDemo clears it", async (feature) => {
    const payload = {
      feature,
      demo_person_name: "Nguyễn Văn A",
      demo_birth_date: "1990-01-01",
      demo_birth_hour: "Dần",
      demo_gender: "Nam",
      demo_output: `# Demo for ${feature}`,
    };
    invokeMock.mockResolvedValueOnce({ data: payload, error: null });

    const { useDemoExample } = await import("@/hooks/useDemoExample");
    const { result } = renderHook(() => useDemoExample());

    await act(async () => {
      await result.current.fetchDemo(feature);
    });

    expect(invokeMock).toHaveBeenCalledWith("get-demo-example", { body: { feature } });
    expect(result.current.demoMode).toBe(true);
    expect(result.current.demoData?.feature).toBe(feature);
    expect(result.current.demoData?.demo_output).toContain(feature);

    act(() => result.current.exitDemo());
    expect(result.current.demoMode).toBe(false);
    expect(result.current.demoData).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Layer 3 — Static audit of every AI page that owns a pinned demo entry
// ---------------------------------------------------------------------------
interface PageSpec {
  path: string;
  /** DemoFeature key(s) the page must request when the pinned entry is clicked. */
  features: string[];
  /** Whether the page lists a history of real items the user can click. */
  hasHistoryList: boolean;
}

const PAGE_SPECS: PageSpec[] = [
  { path: "src/pages/TuViIztroPage.tsx", features: ["luan_giai"], hasHistoryList: true },
  { path: "src/pages/BoiKieu.tsx", features: ["boi_kieu"], hasHistoryList: true },
  { path: "src/pages/BoiQue.tsx", features: ["boi_que"], hasHistoryList: true },
  {
    path: "src/pages/VanHan.tsx",
    // VanHan computes its feature key dynamically: `van_han_${activeTab}`.
    features: ["van_han_${activeTab}"],
    hasHistoryList: true,
  },
];

function readPage(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

/** Find the JSX block for `<PinnedDemoEntry ... />` and return it as a string. */
function extractPinnedJsx(src: string): string {
  const idx = src.indexOf("<PinnedDemoEntry");
  expect(idx, "page must render <PinnedDemoEntry").toBeGreaterThan(-1);
  const end = src.indexOf("/>", idx);
  expect(end, "<PinnedDemoEntry must self-close").toBeGreaterThan(idx);
  return src.slice(idx, end + 2);
}

describe("Pinned demo entry — wiring per page", () => {
  for (const spec of PAGE_SPECS) {
    describe(spec.path, () => {
      const src = readPage(spec.path);

      it("only renders the pinned entry for logged-in non-guest users", () => {
        // The page must guard the pinned entry behind a `user && !isGuest`
        // check. Accept any of:
        //   (a) inline JSX guard `{user && !isGuest && <PinnedDemoEntry ...`
        //   (b) a `showPinned` flag derived from user + isGuest
        //   (c) the enclosing render function early-returns when guest
        //       (`if (!user || isGuest) return null;`)
        const idx = src.indexOf("<PinnedDemoEntry");
        const window = src.slice(Math.max(0, idx - 1500), idx);
        const inlineGuard = /user\s*&&\s*!isGuest\s*&&/.test(window);
        const flagGuard =
          /const\s+showPinned\s*=/.test(src) &&
          /\{\s*showPinned\s*&&/.test(window);
        const earlyReturnGuard =
          /if\s*\(\s*!user\s*\|\|\s*isGuest\s*\)\s*return/.test(window);
        expect(
          inlineGuard || flagGuard || earlyReturnGuard,
          "pinned entry must be gated by `user && !isGuest`",
        ).toBe(true);
      });

      it("calls fetchDemo with the correct feature key on click", () => {
        const block = extractPinnedJsx(src);
        for (const feature of spec.features) {
          // Allow either a literal "feature" string or a template using the
          // dynamic activeTab pattern declared by VanHan.
          if (feature.includes("${")) {
            expect(block).toMatch(/fetchDemo\(\s*feature\s*\)/);
            // And the feature variable nearby must be the templated key.
            expect(block).toMatch(/`van_han_\$\{activeTab\}`/);
          } else {
            expect(block).toMatch(new RegExp(`fetchDemo\\(\\s*["']${feature}["']\\s*\\)`));
          }
        }
      });

      if (spec.hasHistoryList) {
        it("clicking a real history item exits demo mode (preserves real history)", () => {
          // Look at every history.map / chartHistory.map / filtered.map block
          // and make sure each one's onClick either calls exitDemo() or
          // resets demo state via a setCurrentResult/setResult update that
          // unmounts the demo banner.
          const mapRegex = /(?:history|chartHistory|filtered)\.map\(\(?\s*item[\s\S]*?\)\s*=>/g;
          const matches = [...src.matchAll(mapRegex)];
          expect(matches.length, "page must iterate at least one history list").toBeGreaterThan(0);

          for (const m of matches) {
            // Grab roughly the next 1500 chars of the map body — enough to
            // include the onClick handler.
            const start = m.index ?? 0;
            const body = src.slice(start, start + 1500);
            // Either explicitly exits demo, or calls a loader that takes over
            // the result area (e.g. handleLoadFromHistory in TuViIztroPage).
            const exitsDemo =
              /exitDemo\(\)/.test(body) ||
              /handleLoadFromHistory\s*\(/.test(body);
            expect(exitsDemo, `history item onClick must clear demo mode in ${spec.path}`).toBe(true);
          }
        });
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Layer 4 — handleLoadFromHistory in TuViIztroPage must reset viewing state
// (it is the page that does NOT call exitDemo() inline in the .map())
// ---------------------------------------------------------------------------
describe("TuViIztroPage.handleLoadFromHistory clears demo state", () => {
  it("resets viewingHistoryId / clears demo so real chart shows", () => {
    const src = readPage("src/pages/TuViIztroPage.tsx");
    // Locate the function body.
    const fnIdx = src.indexOf("handleLoadFromHistory");
    expect(fnIdx).toBeGreaterThan(-1);
    const body = src.slice(fnIdx, fnIdx + 2000);
    // Must call setViewingHistoryId(item.id) (so the demo render guard turns
    // off — TuViIztroPage gates its demo banner on `!viewingHistoryId`).
    expect(body).toMatch(/setViewingHistoryId\(/);
    // And exit any active demo / cached analysis path. Either explicit
    // exitDemo() or restoring item state both qualify.
    expect(/exitDemo\(\)/.test(body) || /setCachedAnalysis\(/.test(body) || /setStreamedText\(""\)/.test(body)).toBe(true);
  });
});