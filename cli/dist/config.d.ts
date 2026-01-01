export declare const config: {
    projectRoot: string;
    backendSrc: string;
    frontendSrc: string;
    infrastructurePath: string;
    dockerComposePath: string;
    outputDir: string;
    tempDir: string;
    commonModule: string;
    repomixDefaults: {
        style: "xml";
        removeComments: boolean;
        removeEmptyLines: boolean;
        topFilesLength: number;
        showLineNumbers: boolean;
        copyToClipboard: boolean;
    };
    backendIgnorePatterns: string[];
    frontendIgnorePatterns: string[];
    infrastructureIgnorePatterns: string[];
    infrastructureServiceMappings: Record<string, {
        displayName?: string;
        folders?: string[];
        patterns?: string[];
        skip?: boolean;
    }>;
};
export type Config = typeof config;
