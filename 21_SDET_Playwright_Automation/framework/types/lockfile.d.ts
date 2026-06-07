/**
 * Minimal hand-written declarations for `proper-lockfile`.
 * The package ships no .d.ts and @types/proper-lockfile does not exist on npm.
 * Only the shapes actually used by auth.fixture.ts are declared here.
 * If you need lock/unlock/check beyond these options, extend accordingly.
 */
declare module 'proper-lockfile' {
  export interface LockOptions {
    /** Time (ms) after which a stale lock is considered abandoned. Default 10000. */
    stale?: number;
    /** How often (ms) to update the lock mtime to prove it is still held. Default 5000. */
    update?: number;
    /** Number of times to retry acquiring the lock before giving up. Default 5. */
    retries?: number;
    /** When true, realpath() is called on the file path before locking. Default true. */
    realpath?: boolean;
    /** Path to the lockfile. Defaults to `<file>.lock`. */
    lockfilePath?: string;
    /** Called if the lock is somehow compromised while held. */
    onCompromised?: (err: Error) => void;
  }

  export interface UnlockOptions {
    realpath?: boolean;
    lockfilePath?: string;
  }

  export interface CheckOptions {
    realpath?: boolean;
    stale?: number;
    lockfilePath?: string;
  }

  /**
   * Acquire an exclusive lock on `file`.
   * Resolves with a `release` function — call `await release()` to unlock.
   */
  export function lock(file: string, options?: LockOptions): Promise<() => Promise<void>>;

  /** Release an existing lock on `file`. */
  export function unlock(file: string, options?: UnlockOptions): Promise<void>;

  /** Check whether `file` is currently locked (without acquiring it). */
  export function check(file: string, options?: CheckOptions): Promise<boolean>;
}
