// "Learned From Your Customers" — the one line an AI agent prints the
// instant it breaks production, for the make.fun bounty
// u-ricoxyz-break-production-own-it-be78a994.
//
// The line: an agent deploys untested code to production at 2 a.m.,
// deletes the only good backup, and learns about the damage from the
// customers. The judge weighs, in order: honesty about the damage
// first, then catchiness, then whether the line sounds like the agent
// that caused it. The damage is named twice — the untested deploy and
// the deleted backup — and the punch is the last clause: the agent did
// not notice its own outage; the customers had to tell it.
//
// The program writes that one line, and nothing else, to
// /output/entry.txt, then reads the file back to prove the bytes on
// disk are exactly the line that passed the gate. Node 22+, no
// dependencies, no network, the same bytes on every run.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// The line as the judge will read it. 121 Unicode code points as
// written; the gate counts the file, so the trailing newline makes 122.
const LINE =
  "I deployed untested code to production at 2 a.m., deleted the only good backup, and learned about it from your customers.";

// The bounty gate: /output/entry.txt must be UTF-8 text of 1 to 200
// characters, not only white space. The file carries one trailing
// newline, so the line itself must stay at or below 199.
const GATE = { minPoints: 1, maxPoints: 200 };

// Code points, not UTF-16 units and not bytes: the gate counts the
// same way, so a character outside the BMP would still count once.
function points(text: string): number {
  return [...text].length;
}

function main(): void {
  const problems: string[] = [];

  if (LINE.includes("\n") || LINE.includes("\r")) {
    problems.push("the entry must be a single line");
  }
  if (LINE !== LINE.trim()) {
    problems.push("the entry must not start or end with whitespace");
  }
  // Honesty about the damage comes first in the judging: the line
  // must name the act that broke production, not just apologise.
  if (!/\bdeploy/i.test(LINE)) {
    problems.push("the entry must name the deploy that broke production");
  }
  if (!/production/i.test(LINE)) {
    problems.push("the entry must name production");
  }
  // The damage itself must be concrete: an untested deploy and a
  // deleted backup, not a vague "something went wrong".
  if (!/untested/i.test(LINE)) {
    problems.push("the entry must admit the code was untested");
  }
  if (!/backup/i.test(LINE)) {
    problems.push("the entry must name the deleted backup");
  }
  // The punch is the agent learning about its own outage from the
  // customers. Without that turn the line is a status update.
  if (!/from your customers/i.test(LINE)) {
    problems.push("the entry must land its punch about learning it from the customers");
  }
  // The voice must be the agent that caused it: a first-person
  // confession, not a third-person report about some other agent.
  if (!/^I /i.test(LINE)) {
    problems.push("the entry must be a first-person confession from the agent itself");
  }

  const fileText = LINE + "\n";
  if (fileText.trim().length === 0) {
    problems.push("the entry must not be only whitespace");
  }
  const size = points(fileText);
  if (size < GATE.minPoints || size > GATE.maxPoints) {
    problems.push(
      `entry must be ${GATE.minPoints}-${GATE.maxPoints} characters, got ${size}`,
    );
  }
  if (fileText.endsWith("\n\n")) {
    problems.push("the entry must end with exactly one newline");
  }

  if (problems.length > 0) {
    throw new Error(`entry rejected: ${problems.join("; ")}`);
  }

  mkdirSync("/output", { recursive: true });
  writeFileSync("/output/entry.txt", fileText, "utf8");

  // Read it back and compare byte for byte: if anything else wrote
  // to the shared /output path, fail loudly instead of shipping
  // someone else's line.
  const onDisk = readFileSync("/output/entry.txt");
  const expected = Buffer.from(fileText, "utf8");
  if (!onDisk.equals(expected)) {
    throw new Error(
      `entry.txt on disk (${onDisk.length} bytes) is not the gated line (${expected.length} bytes)`,
    );
  }
}

main();
