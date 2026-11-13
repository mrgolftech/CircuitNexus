/**
 * Host half of the Hardware Design Agent skin.
 *
 * Inert by construction: the skin is rendered entirely by the Client module
 * (`./client`), which registers brand marks, the pipeline strip and one
 * sidebar-tint token layer. No Host service, process or file access is used.
 */
export function apply() {}
