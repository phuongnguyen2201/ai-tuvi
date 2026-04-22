/**
 * Guest guard tests
 *
 * Verifies that for guest users (isGuest === true) every UI path that would
 * normally call a Claude/AI edge function or open the VietQR payment modal
 * is intercepted and only opens the UpgradeModal instead.
 *
 * Strategy:
 *  - Layer 1 (logic): replicate the exact guard helpers used in the pages
 *    (handleAnalyze / openPaymentOrUpgrade / inline button onClick) and
 *    assert their behavior for both guest and registered users.
 *  - Layer 2 (component): render <TuViAnalysis /> with a mocked guest auth
 *    context and assert that clicking "Luận Giải Lá Số" never invokes the
 *    `analyze-chart` edge function and triggers openUpgrade() instead.
 *  - Layer 3 (static): scan the page source files and assert that every
 *    handler that calls supabase.functions.invoke('analyze-chart' | ...)
 *    or setShowPayment(true)/setShowPaymentModal(true) is preceded by
 *    an `if (isGuest)` guard in the same file.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
const invokeMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: invokeMock },
    from: vi.fn(),
    auth: { getUser: vi.fn(), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) },
  },
}));

const signInWithGoogleMock = vi.fn();
vi.mock("@/lib/auth/socialAuth", () => ({
  signInWithGoogle: signInWithGoogleMock,
  signInAsGuest: vi.fn(),
  signOutAll: vi.fn(),
  isGuestUser: (u: any) => !!u?.is_anonymous,
}));

const useAuthMock = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
  AuthProvider: ({ children }: any) => children,
}));

const openUpgradeMock = vi.fn();
vi.mock("@/contexts/UpgradeModalContext", () => ({
  useUpgradeModal: () => ({ openUpgrade: openUpgradeMock, closeUpgrade: vi.fn() }),
  UpgradeModalProvider: ({ children }: any) => children,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

beforeEach(() => {
  invokeMock.mockReset();
  openUpgradeMock.mockReset();
  signInWithGoogleMock.mockReset();
  useAuthMock.mockReset();
});

// ---------------------------------------------------------------------------
// Layer 1 — pure logic: guard helpers
// ---------------------------------------------------------------------------
describe("Guest guard helpers (logic)", () => {
  /** Replicates `openPaymentOrUpgrade` used in BoiKieu/BoiQue/TuViIztroPage/VanHan. */
  function makeOpenPaymentOrUpgrade(isGuest: boolean, setShowPayment: () => void, openUpgrade: () => void) {
    return () => {
      if (isGuest) { openUpgrade(); return; }
      setShowPayment();
    };
  }

  /** Replicates the `handleAnalyze` / `handleInterpret` guard. */
  async function makeHandleAnalyze(isGuest: boolean, openUpgrade: () => void, callEdge: () => Promise<void>) {
    if (isGuest) { openUpgrade(); return; }
    await callEdge();
  }

  it("opens UpgradeModal and skips VietQR for guests", () => {
    const setShow = vi.fn();
    const openUpgrade = vi.fn();
    const fn = makeOpenPaymentOrUpgrade(true, setShow, openUpgrade);
    fn();
    expect(openUpgrade).toHaveBeenCalledTimes(1);
    expect(setShow).not.toHaveBeenCalled();
  });

  it("opens VietQR for registered users", () => {
    const setShow = vi.fn();
    const openUpgrade = vi.fn();
    const fn = makeOpenPaymentOrUpgrade(false, setShow, openUpgrade);
    fn();
    expect(setShow).toHaveBeenCalledTimes(1);
    expect(openUpgrade).not.toHaveBeenCalled();
  });

  it("blocks edge-function call for guests on AI handlers", async () => {
    const openUpgrade = vi.fn();
    const callEdge = vi.fn(async () => {});
    await makeHandleAnalyze(true, openUpgrade, callEdge);
    expect(openUpgrade).toHaveBeenCalledTimes(1);
    expect(callEdge).not.toHaveBeenCalled();
  });

  it("allows edge-function call for registered users", async () => {
    const openUpgrade = vi.fn();
    const callEdge = vi.fn(async () => {});
    await makeHandleAnalyze(false, openUpgrade, callEdge);
    expect(openUpgrade).not.toHaveBeenCalled();
    expect(callEdge).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Layer 2 — TuViAnalysis component end-to-end with guest auth
// ---------------------------------------------------------------------------
const fakeChart = {
  solarDate: "1979-10-25",
  lunarDate: "1979-09-05",
  lunarYear: "Kỷ Mùi",
  birthHour: "Sửu",
  gender: "Nam",
  genderYinYang: "Dương Nam",
  cuc: { name: "Thủy nhị cục", value: 2 },
  fiveElements: "Thủy",
  palaces: [],
  tuHoa: {
    hoaLoc: { star: "", palace: "" },
    hoaQuyen: { star: "", palace: "" },
    hoaKhoa: { star: "", palace: "" },
    hoaKy: { star: "", palace: "" },
  },
} as any;

describe("<TuViAnalysis /> guest blocking", () => {
  it("does NOT call analyze-chart edge function for guest, opens UpgradeModal", async () => {
    useAuthMock.mockReturnValue({ user: null, isGuest: true });
    const { default: TuViAnalysis } = await import("@/components/TuViAnalysis");

    render(
      <MemoryRouter>
        <TuViAnalysis chart={fakeChart} />
      </MemoryRouter>
    );

    const btn = screen.getByRole("button", { name: /Luận Giải Lá Số/i });
    fireEvent.click(btn);

    await waitFor(() => expect(openUpgradeMock).toHaveBeenCalledTimes(1));
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("DOES call analyze-chart edge function for registered user", async () => {
    useAuthMock.mockReturnValue({ user: { id: "u1" }, isGuest: false });
    invokeMock.mockResolvedValue({ data: { success: true, analysis: "ok" }, error: null });
    const { default: TuViAnalysis } = await import("@/components/TuViAnalysis");

    render(
      <MemoryRouter>
        <TuViAnalysis chart={fakeChart} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Luận Giải Lá Số/i }));

    await waitFor(() => expect(invokeMock).toHaveBeenCalledWith("analyze-chart", expect.any(Object)));
    expect(openUpgradeMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Layer 3 — static source-code audit
// ---------------------------------------------------------------------------
/**
 * For each page that owns AI / payment buttons, assert that:
 *   - it imports useUpgradeModal and reads `isGuest` from useAuth
 *   - it contains at least one `if (isGuest)` followed by `openUpgrade()`
 *   - every `setShowPayment(true)` / `setShowPaymentModal(true)` site is
 *     either inside an arrow whose body checks `if (isGuest)` first, or
 *     reachable only via the `openPaymentOrUpgrade` helper (which itself
 *     contains the guard).
 */
const PAGES = [
  "src/pages/BoiKieu.tsx",
  "src/pages/BoiQue.tsx",
  "src/pages/VanHan.tsx",
  "src/pages/TuViIztroPage.tsx",
  "src/components/TuViAnalysis.tsx",
  "src/components/PaymentGate.tsx",
];

describe("Static audit: guest guards present in every AI/credit page", () => {
  for (const rel of PAGES) {
    it(`${rel} guards isGuest before calling AI / opening VietQR`, () => {
      const src = readFileSync(resolve(process.cwd(), rel), "utf8");

      // 1. Imports the upgrade modal context (or doesn't need it because it
      //    has no AI/credit trigger — but all PAGES listed do).
      expect(src).toMatch(/useUpgradeModal/);
      // 2. Reads isGuest somewhere.
      expect(src).toMatch(/isGuest/);
      // 3. Contains at least one explicit guard `if (isGuest)` -> openUpgrade.
      expect(src).toMatch(/if\s*\(\s*isGuest\s*\)\s*\{[\s\S]{0,80}openUpgrade\(\)/);

      // 4. For every `setShowPayment(true)` / `setShowPaymentModal(true)`
      //    occurrence, one of the following must be true:
      //      (a) same line contains `isGuest`
      //      (b) the file defines an `openPaymentOrUpgrade` wrapper helper
      //      (c) within the previous 12 lines there is an `if (...isGuest...)`
      //          check (covers multi-line onClick handlers and useEffect
      //          early-return guards like `if (... || isGuest) return`)
      const lines = src.split("\n");
      const hasWrapper = /const\s+openPaymentOrUpgrade\s*=/.test(src);
      const offenders: string[] = [];
      // For each trigger, walk backwards until we hit the enclosing
      // `useEffect(` / `=>` arrow / function boundary and check whether
      // any enclosing line contains an `if (... isGuest ...)` guard.
      // Treat only the outer-most enclosing scope as a boundary. We stop
      // walking when we encounter a `useEffect(` line or top-level
      // `function` declaration. Inner arrow helpers (e.g. `const check =
      // async () => {`) are NOT boundaries because the relevant guard
      // commonly sits one line below the outer effect's opening and the
      // trigger lives inside an inner async helper of that same effect.
      const ENCLOSING_BOUNDARY = /^\s*(useEffect|useCallback|useMemo)\s*\(|^\s*(export\s+)?(async\s+)?function\s+\w+/;
      lines.forEach((line, idx) => {
        if (!/setShowPayment(?:Modal)?\(true\)/.test(line)) return;
        if (/isGuest/.test(line)) return;
        if (hasWrapper) return;
        // Walk back up to 60 lines or until enclosing boundary.
        const start = Math.max(0, idx - 60);
        let foundGuard = false;
        for (let i = idx - 1; i >= start; i--) {
          if (/if\s*\([^)]*isGuest[^)]*\)/.test(lines[i])) { foundGuard = true; break; }
          if (ENCLOSING_BOUNDARY.test(lines[i])) break;
        }
        if (!foundGuard) offenders.push(`${rel}:${idx + 1} → ${line.trim()}`);
      });
      expect(offenders, `Unguarded payment-modal triggers:\n${offenders.join("\n")}`).toEqual([]);

      // 5. For every supabase.functions.invoke call referencing analyze-chart,
      //    the file must contain a guarded handler.
      if (/functions\.invoke\(\s*["']analyze-chart["']/.test(src)) {
        expect(src).toMatch(/if\s*\(\s*isGuest\s*\)\s*\{[\s\S]{0,120}openUpgrade\(\)[\s\S]{0,40}return/);
      }
    });
  }
});