import { ensurePythonDependencies } from './common/python.js';

(async () => {
    await ensurePythonDependencies({ updateMitmproxyAddons: true });
})();
