/**
 * Generate buildInfo.js with current build timestamp
 * This script runs before the build to capture the deployment date
 */
const fs = require('fs');
const path = require('path');

const buildDate = new Date().toISOString();
const buildInfoContent = `// This file is auto-generated during build
// It contains the build/deployment timestamp
// Generated at: ${buildDate}
export const BUILD_DATE = '${buildDate}';
`;

const outputPath = path.join(__dirname, '../src/buildInfo.js');
fs.writeFileSync(outputPath, buildInfoContent, 'utf8');

console.log(`✅ Generated buildInfo.js with build date: ${buildDate}`);

