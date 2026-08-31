export interface NgAddOptions {
  /** Workspace project to wire up. Defaults to the workspace's default project. */
  project?: string;
  /** Also register ScrollTrigger in the generated `provideGsap()` call. */
  plugins?: boolean;
  /** Pass `respectReducedMotion: true` in the generated `provideGsap()` call. */
  respectReducedMotion?: boolean;
  /** Skip the package-manager install step. */
  skipInstall?: boolean;
}
