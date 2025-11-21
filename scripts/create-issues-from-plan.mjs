#!/usr/bin/env node
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import YAML from 'yaml';

function run(cmd, args, options = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...options });
  return res.status ?? 0;
}

function ghExists() {
  const res = spawnSync('gh', ['--version'], { stdio: 'ignore', shell: true });
  return (res.status ?? 1) === 0;
}

function getRepo() {
  const res = spawnSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], { encoding: 'utf8', shell: true });
  if ((res.status ?? 1) === 0) return res.stdout.trim();
  return process.env.GITHUB_REPOSITORY || '';
}

function getOwnerFromRepo(repo) {
  if (!repo) return '';
  const [owner] = repo.split('/');
  return owner || '';
}

function ensureProject(owner, title) {
  let projNum = '';
  let projId = '';
  let out = spawnSync('gh', ['project', 'view', title, '--owner', owner, '--format', 'json'], { encoding: 'utf8', shell: true });
  if ((out.status ?? 1) !== 0) {
    console.log(`Creating project '${title}' under ${owner}...`);
    spawnSync('gh', ['project', 'create', '--title', title, '--owner', owner], { stdio: 'inherit', shell: true });
    out = spawnSync('gh', ['project', 'view', title, '--owner', owner, '--format', 'json'], { encoding: 'utf8', shell: true });
  }
  if ((out.status ?? 1) === 0) {
    try {
      const pj = JSON.parse(out.stdout);
      projNum = pj.number?.toString() || '';
      projId = pj.id || '';
    } catch {}
  }
  return { projNum, projId };
}

function addIssueToProject(owner, projNum, issueUrl) {
  if (!owner || !projNum || !issueUrl) return { itemId: '' };
  const args = ['project', 'item-add', '--owner', owner, '--number', projNum, '--url', issueUrl, '--format', 'json'];
  const res = spawnSync('gh', args, { encoding: 'utf8', shell: true });
  let itemId = '';
  if ((res.status ?? 1) === 0 && res.stdout) {
    try { const obj = JSON.parse(res.stdout); itemId = obj.id || ''; } catch {}
  } else {
    // Fallback without JSON
    spawnSync('gh', ['project', 'item-add', '--owner', owner, '--number', projNum, '--url', issueUrl], { stdio: 'inherit', shell: true });
  }
  return { itemId };
}

function getProjectFields(projectId) {
  const q = `query($projectId:ID!){ node(id:$projectId){ ... on ProjectV2 { fields(first:50){ nodes{ id name __typename ... on ProjectV2SingleSelectField { options { id name } } } } } } }`;
  const res = spawnSync('gh', ['api', 'graphql', '-f', `query=${q}`, '-F', `projectId=${projectId}`], { encoding: 'utf8', shell: true });
  if ((res.status ?? 1) !== 0) return {};
  try { return JSON.parse(res.stdout); } catch { return {}; }
}

function setSingleSelect(projectId, itemId, fieldId, optionId) {
  const m = `mutation($projectId:ID!,$itemId:ID!,$fieldId:ID!,$optionId:ID!){ updateProjectV2ItemFieldValue(input:{projectId:$projectId,itemId:$itemId,fieldId:$fieldId,value:{singleSelectOptionId:$optionId}}){ clientMutationId } }`;
  return spawnSync('gh', ['api', 'graphql', '-f', `query=${m}`, '-F', `projectId=${projectId}`, '-F', `itemId=${itemId}`, '-F', `fieldId=${fieldId}`, '-F', `optionId=${optionId}`], { stdio: 'ignore', shell: true }).status ?? 0;
}

function setNumberField(projectId, itemId, fieldId, number) {
  const m = `mutation($projectId:ID!,$itemId:ID!,$fieldId:ID!,$num:Float!){ updateProjectV2ItemFieldValue(input:{projectId:$projectId,itemId:$itemId,fieldId:$fieldId,value:{ number:$num }}){ clientMutationId } }`;
  return spawnSync('gh', ['api', 'graphql', '-f', `query=${m}`, '-F', `projectId=${projectId}`, '-F', `itemId=${itemId}`, '-F', `fieldId=${fieldId}`, '-F', `num=${number}`], { stdio: 'ignore', shell: true }).status ?? 0;
}

function setDateField(projectId, itemId, fieldId, dateStr) {
  const m = `mutation($projectId:ID!,$itemId:ID!,$fieldId:ID!,$date:String!){ updateProjectV2ItemFieldValue(input:{projectId:$projectId,itemId:$itemId,fieldId:$fieldId,value:{ date:$date }}){ clientMutationId } }`;
  return spawnSync('gh', ['api', 'graphql', '-f', `query=${m}`, '-F', `projectId=${projectId}`, '-F', `itemId=${itemId}`, '-F', `fieldId=${fieldId}`, '-F', `date=${dateStr}`], { stdio: 'ignore', shell: true }).status ?? 0;
}

function main() {
  const file = process.argv[2] || 'planning/p1-plan.yml';
  if (!fs.existsSync(file)) {
    console.error(`Plan file not found: ${file}`);
    process.exit(2);
  }
  const plan = YAML.parse(fs.readFileSync(file, 'utf8'));
  const hasGh = ghExists();
  const repo = getRepo();
  console.log(`Repo: ${repo || '(not detected)'}`);
  const repoOwner = getOwnerFromRepo(repo);

  // Optional project creation
  const wantProject = true;
  const projectOwner = (plan.project?.owner || repoOwner);
  const projectTitle = plan.project?.title || '';
  let projectNumber = '';
  let projectId = '';
  if (hasGh && wantProject && projectTitle && projectOwner) {
    const { projNum, projId } = ensureProject(projectOwner, projectTitle);
    projectNumber = projNum;
    projectId = projId;
    // Ensure default fields exist (Status, Story Points, ETA)
    ensureProjectFields(projectOwner, projectNumber, plan.project?.statuses || []);
  }

  // Create milestone
  const milestone = plan.milestone || 'P1 (MVP)';
  if (hasGh) {
    console.log(`Creating milestone: ${milestone}`);
    run('gh', ['milestone', 'create', milestone]);
  } else {
    console.log(`# gh milestone create '${milestone}'`);
  }

  for (const epic of plan.epics || []) {
    const epicLabel = `epic/${epic.key}`;
    const labels = new Set([epicLabel, ...(epic.labels || []), ...(plan.labels?.default || [])]);
    // Ensure labels exist
    for (const lab of labels) {
      if (hasGh) run('gh', ['label', 'create', lab, '--force']);
      else console.log(`# gh label create '${lab}' --force`);
    }
    // Create epic meta issue
    let epicIssueUrl = '';
    let epicIssueNumber = '';
    if (hasGh) {
      const epicTitle = `[EPIC ${epic.key}] ${epic.title}`;
      const epicBody = (epic.description || `Epic ${epic.key}: ${epic.title}\n\n## Children\n`).trim();
      const argsEpic = ['issue', 'create', '--title', epicTitle, '--body', epicBody, '--milestone', milestone, '--label', epicLabel, '--json', 'url,number'];
      const resEpic = spawnSync('gh', argsEpic, { encoding: 'utf8', shell: true });
      if ((resEpic.status ?? 1) === 0 && resEpic.stdout) {
        try { const created = JSON.parse(resEpic.stdout); epicIssueUrl = created.url; epicIssueNumber = String(created.number); } catch {}
      }
      if (projectNumber && projectOwner && epicIssueUrl) addIssueToProject(projectOwner, projectNumber, epicIssueUrl);
    } else {
      console.log(`# gh issue create --title "[EPIC ${epic.key}] ${epic.title}" --body "..." --milestone "${milestone}" --label ${epicLabel}`);
    }
    for (const issue of epic.issues || []) {
      const title = `[${epic.key}] ${issue.title}`;
      let body = (issue.body || '').trim();
      if (epicIssueNumber) body += `\n\nParent Epic: #${epicIssueNumber}`;
      const issueLabels = [...labels, ...(issue.labels || []), (issue.area ? `area/${issue.area}` : '')].filter(Boolean);
      const args = ['issue', 'create', '--title', title, '--body', body, '--milestone', milestone, '--json', 'url,number'];
      for (const lab of issueLabels) args.push('--label', lab);
      if (issue.assignees && issue.assignees.length) args.push('--assignee', issue.assignees.join(','));
      if (hasGh) {
        const res = spawnSync('gh', args, { encoding: 'utf8', shell: true });
        if ((res.status ?? 1) === 0 && res.stdout) {
          try {
            const created = JSON.parse(res.stdout);
            const url = created.url;
            let itemId = '';
            if (projectNumber && projectOwner && url) {
              const { itemId: iid } = addIssueToProject(projectOwner, projectNumber, url);
              itemId = iid;
              // Attempt to set Status/Story Points/ETA via GraphQL if fields known
              if (itemId && projectId) {
                const fieldsRes = getProjectFields(projectId);
                const nodes = fieldsRes?.data?.node?.fields?.nodes || [];
                const statusField = nodes.find(n => n.name === 'Status');
                if (statusField && plan.project?.defaultStatus) {
                  const opt = (statusField.options || []).find(o => o.name === plan.project.defaultStatus);
                  if (opt) setSingleSelect(projectId, itemId, statusField.id, opt.id);
                }
                if (issue.storyPoints) {
                  const spField = nodes.find(n => n.name === 'Story Points');
                  if (spField) setNumberField(projectId, itemId, spField.id, issue.storyPoints);
                }
                if (issue.eta) {
                  const etaField = nodes.find(n => n.name === 'ETA');
                  if (etaField) setDateField(projectId, itemId, etaField.id, issue.eta);
                }
              }
              // Fallback / simple field sets via gh cli
              if (itemId) {
                if (plan.project?.defaultStatus) spawnSync('gh', ['project', 'item-edit', '--id', itemId, '--field', 'Status', '--value', plan.project.defaultStatus], { stdio: 'ignore', shell: true });
                if (issue.storyPoints) spawnSync('gh', ['project', 'item-edit', '--id', itemId, '--field', 'Story Points', '--value', String(issue.storyPoints)], { stdio: 'ignore', shell: true });
                if (issue.eta) spawnSync('gh', ['project', 'item-edit', '--id', itemId, '--field', 'ETA', '--value', issue.eta], { stdio: 'ignore', shell: true });
                if (epicIssueNumber) spawnSync('gh', ['project', 'item-edit', '--id', itemId, '--field', 'Parent Epic', '--value', `#${epicIssueNumber}`], { stdio: 'ignore', shell: true });
              }
            }
            if (epicIssueNumber && epicIssueUrl) {
              spawnSync('gh', ['issue', 'comment', epicIssueNumber, '--body', `- [ ] ${title} (${url})`], { stdio: 'ignore', shell: true });
            }
          } catch {}
        } else {
          console.error('Issue create failed');
        }
      } else {
        console.log(`# gh ${args.join(' ')}`);
        if (projectNumber && projectOwner) console.log(`# gh project item-add --owner '${projectOwner}' --number '${projectNumber}' --url <ISSUE_URL>`);
      }
    }
  }
}

main();
