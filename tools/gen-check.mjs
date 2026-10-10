// 题目生成器采样自检（只读，不产出任何题目文件）
//   node tools/gen-check.mjs [采样次数，默认 20000]
// 目的：证明「难度类型固定、题目随机多样」——
//   ① 每类的唯一题目数（多不多样）
//   ② 结构断言（题型骨架是否真的固定）
//   ③ 巧算五个子类的实际占比（是否与教学加权一致）

// 在 Node 里跑需要一个极简的 localStorage 占位（js/store.js 会读它）
globalThis.localStorage = {
  _s: {},
  getItem(k) { return k in this._s ? this._s[k] : null; },
  setItem(k, v) { this._s[k] = String(v); },
  removeItem(k) { delete this._s[k]; },
};

const { GENERATORS } = await import("../js/questions/types.js");
const { QUESTION_TYPES } = await import("../js/config.js");

const N = Number(process.argv[2] || 20000);

/* ---------------- 求值工具 ---------------- */
const DASH = "\u2212";
function toJS(text) {
  return text
    .replace(new RegExp(DASH, "g"), "-")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/\s+/g, "");
}
function evalExpr(text) {
  // 题目里的数字都是有限小数，除法也保证除得尽，直接用 JS 求值即可
  return Function(`"use strict";return (${toJS(text)});`)();
}
function evalWithX(text, x) {
  // 题目里有三类隐式乘号 / 变量写法需要处理：
  //   5x（数字接 x）、裸 x（系数为 1 时写成 x）、5(7x + 80)（数字接括号）
  const s = text
    .replace(/(\d)x/g, "$1*X")   // 5x → 5*X
    .replace(/x/g, "X")           // 裸 x → X
    .replace(/(\d)\(/g, "$1*(")   // 数字接括号 → 补乘号
    .replace(/X/g, `(${x})`);
  return evalExpr(s);
}
const near = (a, b) => Math.abs(a - b) < 1e-6;
const countOf = (s, ch) => s.split(ch).length - 1;

/* ---------------- 断言框架 ---------------- */
const problems = [];
function expect(cond, msg, sample) {
  if (!cond) problems.push(`${msg}${sample ? `　例：${sample}` : ""}`);
}

/* ---------------- 巧算子类识别 ---------------- */
const T3_SUBS = ["凑整(两项)", "凑整(三项)", "分配律", "提公因数", "小数互补", "加减凑整"];
function classifyT3(text) {
  const times = countOf(text, "×");
  const hasPlus = text.includes("+");
  // 提公因数一定是两项乘法相加：a × c + b × c
  if (times >= 2 && hasPlus) return "提公因数";
  if (times === 2) return "凑整(三项)";
  if (times === 1 && hasPlus) return "提公因数";
  if (/[.]/.test(text)) return "小数互补";
  if (times === 0) return "加减凑整";
  // 单个 ×：看有没有「接近整百/整千」的因数（恰好 100/1000 不算，那是凑整出来的）
  const nums = text.match(/\d+(?:\.\d+)?/g).map(Number);
  const nearRound = nums.some(
    (n) => (n >= 95 && n <= 99) || (n >= 101 && n <= 105) || (n >= 995 && n <= 999) || (n >= 1001 && n <= 1005)
  );
  return nearRound ? "分配律" : "凑整(两项)";
}

/* ---------------- 逐类采样 ---------------- */
const report = [];
for (const t of QUESTION_TYPES) {
  const gen = GENERATORS[t.id];
  const seen = new Set();
  const answers = [];
  let parenOk = true;
  let subCounter = null;
  if (t.id === 3) subCounter = Object.fromEntries(T3_SUBS.map((k) => [k, 0]));

  for (let i = 0; i < N; i++) {
    let r;
    try {
      r = gen();
    } catch (e) {
      problems.push(`T${t.id} 抛异常：${e.message}`);
      break;
    }
    expect(r && r.type === t.id, `T${t.id} 返回的 type 不对`, r && r.text);
    if (!r) continue;
    seen.add(r.text);
    answers.push(r.answer);

    // ---- 结构断言 ----
    if (t.id === 1) {
      const [a, b] = r.text.split(/ [+−−] /).map(Number);
      const isAdd = r.text.includes(" + ");
      expect(near(r.answer, isAdd ? a + b : a - b), "T1 答案与算式不符", r.text);
      expect(r.answer >= 0, "T1 出现负数", r.text);
      if (!isAdd) expect(a >= b, "T1 出现小数减大数", r.text);
      expect(a >= 10 && a <= 99 && b >= 10 && b <= 99, "T1 操作数超出两位数", r.text);
    }
    if (t.id === 2) {
      const isMul = r.text.includes(" × ");
      const [a, b] = r.text.split(isMul ? " × " : " ÷ ").map(Number);
      expect(near(r.answer, isMul ? a * b : a / b), "T2 答案与算式不符", r.text);
      if (!isMul) {
        expect(Number.isInteger(r.answer), "T2 除法结果不是整数", r.text);
        expect(near(a, b * r.answer), "T2 除法不整除", r.text);
      }
      expect(b >= 2 && b <= 9, "T2 乘数/除数不在 2–9", r.text);
      expect(a >= 10 && a <= 99, "T2 两位数超范围", r.text);
    }
    if (t.id === 3) {
      expect(near(evalExpr(r.text), r.answer), "T3 答案与算式不符", r.text);
      subCounter[classifyT3(r.text)]++;
      // 防退化：单项乘法的题里不应该出现整百数（如 1000 × 8），那就不需要巧算了
      if (/^\d+ × \d+$/.test(r.text)) {
        const nums = r.text.split(" × ").map(Number);
        expect(!nums.some((n) => n % 100 === 0), "T3 出现退化题（因数本身就是整百）", r.text);
      }
    }
    if (t.id === 4) {
      expect(near(evalExpr(r.text), r.answer), "T4 答案与算式不符", r.text);
      if (r.text.includes(" ÷ ")) {
        const [a, b] = r.text.split(" ÷ ").map(Number);
        expect(Number.isInteger(r.answer), "T4 除法结果不是整数", r.text);
        expect(near(a, b * r.answer), "T4 除法不整除", r.text);
      }
      if (r.text.includes(" − ")) {
        const [a, b] = r.text.split(" − ").map(Number);
        expect(a >= b, "T4 出现小减大", r.text);
      }
    }
    if (t.id === 5) {
      // 逐步求值，确认中间结果恒为正
      const toks = r.text.split(" ");
      let acc = Number(toks[0]);
      expect(acc > 0, "T5 首项不为正", r.text);
      for (let k = 1; k < toks.length; k += 2) {
        acc = toks[k] === "+" ? acc + Number(toks[k + 1]) : acc - Number(toks[k + 1]);
        expect(acc > 0, "T5 中间结果 <= 0", r.text);
      }
      expect(near(acc, r.answer), "T5 答案与逐步计算不符", r.text);
      const terms = (r.text.match(/[+\u2212]/g) || []).length + 1;
      expect(terms === 3 || terms === 4, "T5 项数不是 3–4", r.text);
    }
    if (t.id === 6) {
      expect(near(evalExpr(r.text), r.answer), "T6 答案与算式不符", r.text);
    }
    if (t.id === 7) {
      const p = countOf(r.text, "(");
      if (p !== 1) parenOk = false;
      expect(p === 1 && countOf(r.text, ")") === 1, "T7 括号数不是 1", r.text);
      const [lhs, rhs] = r.text.split(" = ");
      expect(near(evalWithX(lhs, r.answer), Number(rhs)), "T7 解代回不成立", r.text);
      expect(Number.isInteger(r.answer) && r.answer >= 1 && r.answer <= 12, "T7 解不是 1–12 的整数", r.text);
    }
    if (t.id === 8) {
      const p = countOf(r.text, "(");
      if (p !== 2) parenOk = false;
      expect(p === 2 && countOf(r.text, ")") === 2, "T8 括号数不是 2", r.text);
      const [lhs, rhs] = r.text.split(" = ");
      expect(near(evalWithX(lhs, r.answer), evalWithX(rhs, r.answer)), "T8 解代回不成立", r.text);
      expect(r.answer >= 0 && r.answer <= 100, "T8 解不在 0–100", r.text);
      expect(near(r.answer * 10, Math.round(r.answer * 10)), "T8 解不是整数或一位小数", r.text);
      expect(/^\d+ \u2212 /.test(rhs), "T8 右边不是「整数 − 括号」", r.text);
    }
  }

  report.push({
    id: t.id,
    name: t.name,
    unique: seen.size,
    ansMin: Math.min(...answers),
    ansMax: Math.max(...answers),
    sample: [...seen].slice(0, 3),
    subCounter,
    parenOk,
  });
}

/* ---------------- 输出 ---------------- */
console.log(`采样次数：${N} / 类\n`);
console.log("【题目多样性】");
for (const r of report) {
  const pct = ((r.unique / N) * 100).toFixed(1);
  console.log(`  T${r.id} ${r.name.padEnd(10, "　")} 唯一题目 ${String(r.unique).padStart(5)} 种（占 ${pct}%）　答案范围 ${r.ansMin} ~ ${r.ansMax}`);
  console.log(`      例：${r.sample.join("　|　")}`);
}

console.log("\n【巧算五子类实际占比】（目标 25 / 25 / 25 / 12.5 / 12.5）");
const t3 = report.find((r) => r.id === 3);
if (t3 && t3.subCounter) {
  const total = Object.values(t3.subCounter).reduce((a, b) => a + b, 0);
  for (const [k, v] of Object.entries(t3.subCounter)) {
    console.log(`  ${k.padEnd(12, "　")} ${((v / total) * 100).toFixed(1)}%`);
  }
}

console.log("\n【结构断言】");
const t7 = report.find((r) => r.id === 7);
const t8 = report.find((r) => r.id === 8);
console.log(`  T7 括号恒为 1：${t7.parenOk ? "✅" : "❌"}`);
console.log(`  T8 括号恒为 2：${t8.parenOk ? "✅" : "❌"}`);
console.log(`  T1 非负 / T2·T4 整除 / T5 中间结果为正：${problems.length === 0 ? "✅" : "见下方问题"}`);
console.log(`  T7 解为 1–12 正整数 / T8 解为 0–100 整数或一位小数：${problems.length === 0 ? "✅" : "见下方问题"}`);

if (problems.length) {
  console.log(`\n【❌ 发现 ${problems.length} 个问题】`);
  const uniq = [...new Set(problems)];
  for (const p of uniq.slice(0, 20)) console.log("  " + p);
} else {
  console.log("\n=== ✅ 全部断言通过 ===");
}
process.exit(problems.length ? 1 : 0);
