// Single source of truth for fixed question/label lists shared between the
// interactive form (app/fire-alarm-form/page.tsx) and the PDF generator
// (lib/pdf-generator.ts). Keeping these here prevents the form and the
// generated report from drifting out of sync, which would otherwise attach a
// technician's Yes/No/N/A answer to the wrong question on the report.

// Section 3 — Control Panel Status.
// Order is significant: answers are keyed by position (a, b, c, ...).
export const controlPanelQuestions = [
  "A. Is panel monitored by outside agency?",
  "B. Is the power light on?",
  "C. Does the panel indicate normal conditions?",
  "D. Are all indicating lamp bulbs in operating order?",
  "E. Does the TROUBLE light operate?",
  "F. Does the SILENCE light operate?",
  "G. Does the panel have active zones?",
  "H. Does the panel have non-functioning zones?",
  "I. Does the panel have battery backup?",
  "J. Do the batteries indicate proper charge?",
  "K. Have Fire Dept. and Monitoring Agency been notified? Have equipment shutdowns been disabled?",
] as const

// Section 5 — Functional Test. Answers are keyed by position (a, b, c, ...).
export const functionalTestQuestions = [
  "A. Did all indicating circuits function normally?",
  "B. If tested, did air handlers shut down?",
  "C. If tested, did elevators recall?",
  "D. If tested, did suppression system solenoid energize?",
  "E. If tested, did panel send alarm signal to monitoring agency?",
  "F. If tested, did panel send trouble signal to monitoring agency?",
] as const

// Section 7 — Post-Test. Answers are keyed by position (a, b, c, ...).
export const postTestQuestions = [
  "A. All initiating circuits returned to normal?",
  "B. All indicating circuits returned to normal?",
  "C. All shut-down circuits returned to normal?",
  "D. All valves seals replaced?",
  "E. Have all authorities been notified?",
] as const
