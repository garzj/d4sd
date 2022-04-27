import defaultsDeep from 'defaults-deep-ts';

export interface DownloadOptions {
  concurrency?: number;
  mergePdfs?: boolean;
}

const defaultOptions: Required<DownloadOptions> = {
  concurrency: 10,
  mergePdfs: true,
};

export function defDownloadOptions(_options?: DownloadOptions) {
  const options = _options ?? {};
  return defaultsDeep(options, defaultOptions);
}
