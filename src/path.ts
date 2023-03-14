/**
 * The path to the installation files for an app.
 *
 * Can either be a string if the app is a single file, or an object specifying a main file and additional files (for
 * split APKs on Android).
 */
export type AppPath = string | { main: string; additional?: string[] };

/** Utility function to get the main file from an {@link AppPath}. */
export const getAppPathMain = (appPath: AppPath) => (typeof appPath === 'string' ? appPath : appPath.main);
/** Utility function to get an array of all files from an {@link AppPath}. */
export const getAppPathAll = (appPath: AppPath) =>
    typeof appPath === 'string' ? [appPath] : [appPath.main, ...(appPath.additional ?? [])];
