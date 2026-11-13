/**
 * Host half of the Schematic Design workbench.
 *
 * Inert by construction: the panel composes an instruction for a new Session's
 * Agent; the Agent owns Skill loading, KiCad MCP calls, process execution and
 * the approval model. The Host half starts no process and touches no file.
 *
 * The plugin keeps this half read-only so that installing the bundle cannot
 * modify a user's KiCad project behind their back.
 */
export function apply() {}
