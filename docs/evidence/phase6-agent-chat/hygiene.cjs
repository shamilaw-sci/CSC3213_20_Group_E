
function inheritedWhitespace(file,line){let source;if(file.endsWith('/HDPhotosSection.jsx')){source=fs.readFileSync(__dirname+'/../phase6-hd-photos/hd-markup-before.snapshot','utf8');for(const [a,b] of [['images.length','imageCount'],['handleImageUpload','onUpload'],['removeImage','onRemove'],['currentHDSizeMB','currentSizeMB'],['MAX_HD_MB','maxSizeMB'],['hdProgress','progress']])source=source.replaceAll(a,b);}else if(file.endsWith('/VirtualToursSection.jsx')){source=fs.readFileSync(__dirname+'/../phase6-tour-shell/tour-markup-before.snapshot','utf8');for(const [a,b] of [['handleVirtualTourUpload','onUpload'],['current360SizeMB','currentSizeMB'],['MAX_360_MB','maxSizeMB'],['v360Progress','progress']])source=source.replaceAll(a,b);}else if(file.endsWith('/ReviewPublishStep.jsx')){source=fs.readFileSync(__dirname+'/../phase6-review-publish/AddProperty.before.jsx','utf8');}else if(file.endsWith('/AgentKpiCards.jsx')){source=fs.readFileSync(__dirname+'/../phase6-agent-kpi/Dashboard.before.jsx','utf8').replaceAll('properties.length','propertiesCount').replaceAll('pipeline.Closed || 0','closedDealsCount');}else if(file.endsWith('/AgentOverviewPanel.jsx')||file.endsWith('/AgentPropertiesPanel.jsx')){source=fs.readFileSync(__dirname+'/../phase6-agent-panels/Dashboard.before.jsx','utf8');}else if(file.endsWith('/AgentPipelinePanel.jsx')||file.endsWith('/AgentLeadDetailsModal.jsx')){source=fs.readFileSync(__dirname+'/../phase6-agent-crm/Dashboard.before.jsx','utf8');}else if(file.endsWith('/AgentMessagesPanel.jsx')){source=fs.readFileSync(__dirname+'/Dashboard.before.jsx','utf8');}else return false;return source.split('\n').some(old=>old.replace(/\r$/,'')===line.replace(/\r$/,''));}
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const git = (...args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
const list = text => text.split('\0').filter(Boolean);
const added = list(git('ls-files', '--others', '--exclude-standard', '-z')).filter(p => !p.startsWith('docs/evidence/'));
const changed = [...new Set([...list(git('diff', '--name-only', '--diff-filter=ACMR', '-z')), ...added])].filter(p => !p.startsWith('docs/evidence/'));
const problems = [];
const secrets = /AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{24,}|sk-(?:proj-)?[A-Za-z0-9_-]{24,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{12,}\.eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}/;
for (const file of changed) {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(file));
  if (secrets.test(text)) problems.push({ file, reason: 'credential-shaped content' });
  if (added.includes(file)) text.split('\n').forEach((line, index) => {
    if (/[\t ]+$/.test(line.replace(/\r$/, '')) && !inheritedWhitespace(file,line)) problems.push({ file, line: index + 1, reason: 'trailing whitespace' });
  });
  if (file.endsWith('.md')) for (const match of text.matchAll(/!?\[[^\]]*\]\(([^\n)]+)\)/g)) {
    const target = match[1].replace(/^<|>$/g, '').split('#')[0];
    if (!target || /^(?:https?:|mailto:|app:|plugin:|codex:)/.test(target)) continue;
    if (!fs.existsSync(path.resolve(path.dirname(file), decodeURIComponent(target)))) problems.push({ file, target, reason: 'missing local link target' });
  }
}
const index = git('diff', '--cached', '--name-only').trim();
if (index) problems.push({ reason: 'index is not empty', files: index.split('\n') });
git('diff', '--check');
const tests = JSON.parse(fs.readFileSync(__dirname + '/frontend.private.json', 'utf8'));
const report = { changedFiles: changed.length, newFiles: added.length, branch: git('branch', '--show-current').trim(), indexEmpty: !index, problems, tests: { success: tests.success, passed: tests.numPassedTests, failed: tests.numFailedTests, files: tests.testResults.length } };
fs.writeFileSync(__dirname + '/hygiene.private.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
if (problems.length || !tests.success || tests.numPassedTests !== 259 || tests.numFailedTests !== 0 || tests.testResults.length !== 39) process.exitCode = 1;
