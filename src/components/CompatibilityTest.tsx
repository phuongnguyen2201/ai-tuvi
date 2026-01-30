import { calculateCompatibility, findBestMatches, findWorstMatches } from "@/lib/tuvi/compatibility";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";

interface TestCase {
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const CompatibilityTest = () => {
  const testCases: TestCase[] = [
    // Test 1: Tam Hợp (Thân-Tý-Thìn)
    (() => {
      const result = calculateCompatibility("Tý", "Thìn");
      const expectedLevel = "Hợp"; // Tam Hợp = Hợp, not Đại Hợp
      return {
        name: "calculateCompatibility('Tý', 'Thìn')",
        expected: `${expectedLevel} (Tam Hợp: Thân-Tý-Thìn), score >= 80`,
        actual: `${result.level} (score: ${result.score}), isTamHop: ${result.details.isTamHop}`,
        passed: result.level === expectedLevel && result.details.isTamHop && result.score >= 80,
      };
    })(),

    // Test 2: Lục Hợp (Tý-Sửu)
    (() => {
      const result = calculateCompatibility("Tý", "Sửu");
      const expectedLevel = "Đại Hợp";
      return {
        name: "calculateCompatibility('Tý', 'Sửu')",
        expected: `${expectedLevel} (Lục Hợp pair), score >= 90`,
        actual: `${result.level} (score: ${result.score}), isLucHop: ${result.details.isLucHop}`,
        passed: result.level === expectedLevel && result.details.isLucHop && result.score >= 90,
      };
    })(),

    // Test 3: Tương Xung (Tý-Ngọ)
    (() => {
      const result = calculateCompatibility("Tý", "Ngọ");
      const expectedLevel = "Đại Kỵ";
      return {
        name: "calculateCompatibility('Tý', 'Ngọ')",
        expected: `${expectedLevel} (Tương Xung), score <= 30`,
        actual: `${result.level} (score: ${result.score}), isTuongXung: ${result.details.isTuongXung}`,
        passed: result.level === expectedLevel && result.details.isTuongXung && result.score <= 30,
      };
    })(),

    // Test 4: Lục Hợp (Mão-Tuất)
    (() => {
      const result = calculateCompatibility("Mão", "Tuất");
      const expectedLevel = "Đại Hợp";
      return {
        name: "calculateCompatibility('Mão', 'Tuất')",
        expected: `${expectedLevel} (Lục Hợp pair), score >= 90`,
        actual: `${result.level} (score: ${result.score}), isLucHop: ${result.details.isLucHop}`,
        passed: result.level === expectedLevel && result.details.isLucHop && result.score >= 90,
      };
    })(),

    // Test 5: Tương Xung (Dần-Thân)
    (() => {
      const result = calculateCompatibility("Dần", "Thân");
      const expectedLevel = "Đại Kỵ";
      return {
        name: "calculateCompatibility('Dần', 'Thân')",
        expected: `${expectedLevel} (Tương Xung), score <= 30`,
        actual: `${result.level} (score: ${result.score}), isTuongXung: ${result.details.isTuongXung}`,
        passed: result.level === expectedLevel && result.details.isTuongXung && result.score <= 30,
      };
    })(),

    // Test 6: findBestMatches('Tý')
    (() => {
      const result = findBestMatches("Tý");
      const topChis = result.map(r => r.chi);
      // Sửu (Lục Hợp - 95), Thìn & Thân (Tam Hợp - 85)
      const hasLucHop = topChis.includes("Sửu");
      const hasTamHop = topChis.includes("Thìn") || topChis.includes("Thân");
      return {
        name: "findBestMatches('Tý')",
        expected: "Top 3 includes Sửu (Lục Hợp) + Thìn/Thân (Tam Hợp)",
        actual: `[${topChis.join(", ")}] - scores: [${result.map(r => r.score).join(", ")}]`,
        passed: hasLucHop && hasTamHop,
      };
    })(),

    // Test 7: findWorstMatches('Tý')
    (() => {
      const result = findWorstMatches("Tý");
      const worstChis = result.map(r => r.chi);
      // Ngọ should be first (Tương Xung - 25)
      const hasNgo = worstChis[0] === "Ngọ";
      return {
        name: "findWorstMatches('Tý')",
        expected: "Ngọ is the worst match (Tương Xung)",
        actual: `[${worstChis.join(", ")}] - scores: [${result.map(r => r.score).join(", ")}]`,
        passed: hasNgo,
      };
    })(),
  ];

  const allPassed = testCases.every((tc) => tc.passed);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gold mb-2">Compatibility Module Test</h1>
        <p className={cn(
          "text-lg font-medium",
          allPassed ? "text-green-500" : "text-red-500"
        )}>
          {allPassed ? "✅ All tests passed!" : "❌ Some tests failed"}
        </p>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-3">
              <th className="p-3 text-left text-sm font-medium text-muted-foreground border-b border-border">Status</th>
              <th className="p-3 text-left text-sm font-medium text-muted-foreground border-b border-border">Test Case</th>
              <th className="p-3 text-left text-sm font-medium text-muted-foreground border-b border-border">Expected</th>
              <th className="p-3 text-left text-sm font-medium text-muted-foreground border-b border-border">Actual</th>
            </tr>
          </thead>
          <tbody>
            {testCases.map((tc, index) => (
              <tr
                key={index}
                className={cn(
                  "border-b border-border",
                  tc.passed ? "bg-green-500/5" : "bg-red-500/5"
                )}
              >
                <td className="p-3">
                  {tc.passed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </td>
                <td className="p-3 font-mono text-xs text-gold">{tc.name}</td>
                <td className="p-3 text-sm text-muted-foreground">{tc.expected}</td>
                <td className={cn("p-3 text-sm", tc.passed ? "text-green-400" : "text-red-400")}>
                  {tc.actual}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Results */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gold">Detailed Test Results</h2>
        {testCases.map((tc, index) => (
          <div
            key={index}
            className={cn(
              "p-4 rounded-lg border",
              tc.passed
                ? "bg-green-500/10 border-green-500/30"
                : "bg-red-500/10 border-red-500/30"
            )}
          >
            <div className="flex items-start gap-3">
              {tc.passed ? (
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              )}
              <div className="space-y-2 flex-1 min-w-0">
                <p className="font-mono text-sm text-gold break-all">{tc.name}</p>
                <div className="grid gap-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Expected: </span>
                    <span className="text-foreground">{tc.expected}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Actual: </span>
                    <span className={tc.passed ? "text-green-400" : "text-red-400"}>
                      {tc.actual}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompatibilityTest;
