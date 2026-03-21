import { getNguHanhFromYear, getNguHanhNapAm, checkElementRelation } from "@/lib/tuvi/nguHanh";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";

interface TestCase {
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const NguHanhTest = () => {
  const testCases: TestCase[] = [
    // Test 1: getNguHanhFromYear(1979)
    (() => {
      const result = getNguHanhFromYear(1979);
      const expected = "Thiên Thượng Hỏa";
      return {
        name: "getNguHanhFromYear(1979)",
        expected: `${expected} (mệnh Hỏa)`,
        actual: `${result.napAm} (mệnh ${result.name})`,
        passed: result.napAm === expected && result.name === "Hỏa",
      };
    })(),

    // Test 2: getNguHanhFromYear(1990)
    (() => {
      const result = getNguHanhFromYear(1990);
      const expected = "Lộ Bàng Thổ";
      return {
        name: "getNguHanhFromYear(1990)",
        expected: `${expected} (mệnh Thổ)`,
        actual: `${result.napAm} (mệnh ${result.name})`,
        passed: result.napAm === expected && result.name === "Thổ",
      };
    })(),

    // Test 3: getNguHanhFromYear(2000)
    (() => {
      const result = getNguHanhFromYear(2000);
      const expected = "Bạch Lạp Kim";
      return {
        name: "getNguHanhFromYear(2000)",
        expected: `${expected} (mệnh Kim)`,
        actual: `${result.napAm} (mệnh ${result.name})`,
        passed: result.napAm === expected && result.name === "Kim",
      };
    })(),

    // Test 4: getNguHanhNapAm('Kỷ', 'Mùi')
    (() => {
      const result = getNguHanhNapAm("Kỷ", "Mùi");
      const expected = "Thiên Thượng Hỏa";
      return {
        name: "getNguHanhNapAm('Kỷ', 'Mùi')",
        expected,
        actual: result.napAm,
        passed: result.napAm === expected,
      };
    })(),

    // Test 5: checkElementRelation('Hỏa', 'Thủy')
    (() => {
      const result = checkElementRelation("Hỏa", "Thủy");
      return {
        name: "checkElementRelation('Hỏa', 'Thủy')",
        expected: "tương khắc (Thủy khắc Hỏa)",
        actual: `${result.relation === "tuong_khac" ? "tương khắc" : result.relation} - ${result.description}`,
        passed: result.relation === "tuong_khac",
      };
    })(),

    // Test 6: checkElementRelation('Mộc', 'Hỏa')
    (() => {
      const result = checkElementRelation("Mộc", "Hỏa");
      return {
        name: "checkElementRelation('Mộc', 'Hỏa')",
        expected: "tương sinh (Mộc sinh Hỏa)",
        actual: `${result.relation === "tuong_sinh" ? "tương sinh" : result.relation} - ${result.description}`,
        passed: result.relation === "tuong_sinh",
      };
    })(),
  ];

  const allPassed = testCases.every((tc) => tc.passed);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gold mb-2">Ngũ Hành Module Test</h1>
        <p className={cn(
          "text-lg font-medium",
          allPassed ? "text-green-500" : "text-red-500"
        )}>
          {allPassed ? "All tests passed!" : "Some tests failed"}
        </p>
      </div>

      <div className="space-y-4">
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

export default NguHanhTest;
