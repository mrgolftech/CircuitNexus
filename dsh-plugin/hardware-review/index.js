/**
 * Host half of the Schematic Review workbench.
 *
 * Currently inert. A directory probe was attempted through
 * `connection.rpc.handle`, but a statically-loaded bundle's Client half has no
 * caller for that channel: `host.call` is injected by the dynamic plugin
 * runner (`dsh-cordis`), not by `dsh.client` module loading. The probe is
 * therefore not wired until a working Client-to-Host path exists.
 *
 * Read-only by construction: it starts no process and touches no file.
 */
export function apply() {}
