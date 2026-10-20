// Editable additions to the recovered Base44 application.
export function createEnhancements({ React, useWorkspace, useSession, git, changes, head, api, notify }) {
  const h = React.createElement;
  const quote = value => '"' + String(value).replace(/["\r\n]/g, ' ').trim() + '"';

  function nextStep(workspace, name = 'yourname') {
    if (!workspace?.cloned) return { label: '1. Clone the team repository', command: 'git clone https://github.com/Team467/RobotCode.git' };
    if (workspace.current_branch === 'main') return { label: '2. Create your feature branch', command: `git switch -c feature/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-topic` };
    const dirty = changes(workspace);
    if (dirty.some(file => !file.staged)) return { label: '3. Stage your changes', command: 'git add .' };
    if (dirty.length) return { label: '4. Save a commit (replace the message with your change)', command: 'git commit -m "Describe your change"' };
    const local = head(workspace)?.hash;
    if (local === head(workspace, 'main')?.hash) return { label: '3. Edit a file in Explorer, then check your changes', command: 'git status' };
    const remote = (workspace.remote_heads || []).find(branch => branch.branch === workspace.current_branch)?.head;
    if (!remote || local !== remote) return { label: '5. Push your feature branch', command: `git push -u origin ${workspace.current_branch}` };
    return { label: '6. Open a pull request (edit the title and description)', command: 'gh pr create --base main --title "Describe your change" --body "What changed, why, and how you tested it"' };
  }

  function fillTerminal(command) {
    window.dispatchEvent(new CustomEvent('team467:terminal-input', { detail: command }));
  }

  async function runCommand(workspace, command, context) {
    if (!/^gh(?:\s|$)/.test(command.trim())) return git(workspace, command, context);
    const lines = [`${context.prompt || 'student@team467$'} ${command}`];
    const result = () => ({ ws: workspace, lines });
    const tokens = command.match(/"[^"\n]*"|'[^'\n]*'|\S+/g)?.map(token => token.replace(/^(["'])(.*)\1$/, '$2')) || [];
    const fail = message => { lines.push(`error: ${message}`); return result(); };
    if (tokens[1] !== 'pr' || tokens[2] !== 'create') return fail('Use gh pr create --base main --title "Your title" --body "What changed and how you tested it" [--reviewer "Classmate name"].');
    const options = {};
    for (let i = 3; i < tokens.length; i += 2) {
      if (!['--base', '--title', '--body', '--reviewer'].includes(tokens[i]) || !tokens[i + 1] || tokens[i + 1].startsWith('--')) return fail(`Invalid or missing option: ${tokens[i]}. Use --title "Your title" --body "Description".`);
      options[tokens[i]] = tokens[i + 1];
    }
    if (!workspace.cloned) return fail('Clone first: git clone https://github.com/Team467/RobotCode.git');
    if (workspace.current_branch === 'main') return fail('Create a feature branch first: git switch -c feature/yourname-topic');
    if (changes(workspace).length) return fail('Commit your changes first. Type git add . then git commit -m "Describe your change".');
    if ((options['--base'] || 'main') !== 'main') return fail('This classroom uses main as the base branch. Use --base main.');
    if (!options['--title']?.trim() || !options['--body']?.trim()) return fail('Include --title "Your title" and --body "What changed, why, and how you tested it".');
    try {
      const remote = await context.loadRemote();
      const branch = remote.branches.find(branch => branch.name === workspace.current_branch);
      if (!branch || branch.head !== head(workspace)?.hash) return fail(`Push your latest commits first: git push -u origin ${workspace.current_branch}`);
      const main = remote.branches.find(branch => branch.name === 'main');
      if (!main || main.head === branch.head) return fail('Your branch has no new commits compared with main. Edit a file, stage, commit, and push first.');
      const pulls = (await api.entities.PullRequest.filter({}, { limit: 500 })).items;
      const existing = pulls.find(pr => pr.compare_branch === branch.name && pr.status === 'open');
      if (existing) { lines.push(`Pull request #${existing.number} already exists. Push new commits to update it.`, `/github/pulls/${existing.id}`); return result(); }
      let reviewers = [];
      if (options['--reviewer']) {
        const members = (await api.entities.ClassroomMember.filter({}, { limit: 200 })).items;
        for (const name of options['--reviewer'].split(',').map(value => value.trim())) {
          const member = members.find(member => member.student_id === name || member.student_name.toLowerCase() === name.toLowerCase());
          if (!member || member.student_id === context.author.id) return fail(`Choose a classmate as reviewer: "${name}" is unavailable. Use their full classroom name.`);
          reviewers.push(member.student_id);
        }
        reviewers = [...new Set(reviewers)];
      }
      const number = pulls.reduce((max, pr) => Math.max(max, pr.number || 0), 0) + 1;
      const pr = await api.entities.PullRequest.create({ number, title: options['--title'].trim(), description: options['--body'].trim(), testing: '', base_branch: 'main', compare_branch: branch.name, author_id: context.author.id, author_name: context.author.name, reviewers, head_hash: branch.head, status: 'open', review_state: 'open', approved_by: [], changes_requested_by: [], has_conflict: false });
      // Once creation succeeds, never report a failed creation because a follow-up failed.
      lines.push(`Created pull request #${number}: ${pr.title}`, `/github/pulls/${pr.id}`);
      try { await context.progress?.({ first_pr: true, pr_count: 1 }); } catch { lines.push('Pull request saved; progress could not refresh.'); }
      const notifications = await Promise.allSettled(reviewers.map(user_id => notify({ user_id, title: `Review requested: PR #${number}`, body: `${context.author.name} asked you to review "${pr.title}".`, pr_id: pr.id, pr_number: number, kind: 'review_request' })));
      if (notifications.some(result => result.status === 'rejected')) lines.push('Pull request saved; some reviewer notifications could not be delivered.');
      lines.push(reviewers.length ? 'Ask your classmate to review it in the GitHub tab.' : 'Next: open it in the GitHub tab and ask a classmate to review. You can also add --reviewer "Classmate full name" when creating a PR.');
      return result();
    } catch (error) { return fail(error.message || 'Could not create the pull request. Try again.'); }
  }

  function TerminalGuide({ workspace }) {
    const { displayName } = useSession();
    const step = nextStep(workspace, displayName?.split(' ')[0]);
    return h('div', { className: 'pr-terminal-guide', 'aria-live': 'polite' },
      h('span', null, step.label),
      h('button', { type: 'button', onClick: () => fillTerminal(step.command), title: 'Put this command in the terminal so you can edit and run it' }, h('code', null, step.command)));
  }

  function PullRequestSidebar({ onGuide, onCommand, busy }) {
    const { workspace } = useWorkspace();
    const { displayName, members, user } = useSession();
    const [title, setTitle] = React.useState('');
    const [body, setBody] = React.useState('');
    const [reviewer, setReviewer] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const step = nextStep(workspace, displayName?.split(' ')[0]);
    return h('div', { className: 'pr-sidebar' },
      h('h2', null, 'Pull requests'),
      h('p', null, 'Propose your feature branch for main and ask a teammate to review.'),
      h('div', { className: 'pr-recommendation' },
        h('strong', null, 'Recommended: use the terminal'),
        h('p', null, 'Learn the commands one step at a time. Click a suggested command to edit it, then press Enter to run it.'),
        h('button', { type: 'button', disabled: busy, onClick: () => { onGuide(); setTimeout(() => fillTerminal(step.command), 0); } }, 'Guide me in the terminal')),
      h('details', null, h('summary', null, 'Or create from the sidebar'),
        h('form', { onSubmit: async event => {
          event.preventDefault(); if (busy || submitting) return; setMessage(''); setSubmitting(true);
          const command = `gh pr create --base main --title ${quote(title)} --body ${quote(body)}${reviewer ? ` --reviewer ${quote(reviewer)}` : ''}`;
          try {
            const result = await onCommand(command);
            setMessage(result?.lines?.slice(1).join('\n') || 'See terminal output for the result.');
          } catch (error) { setMessage(error.message || 'Could not create the pull request.'); }
          finally { setSubmitting(false); }
        } },
        h('p', { className: 'pr-branch' }, `${workspace.current_branch} → main`),
        h('label', null, 'Title', h('input', { required: true, value: title, onChange: event => setTitle(event.target.value), placeholder: 'Describe your change' })),
        h('label', null, 'Description and testing', h('textarea', { required: true, value: body, onChange: event => setBody(event.target.value), placeholder: 'What changed, why, and how you tested it' })),
        h('label', null, 'Reviewer', h('select', { value: reviewer, onChange: event => setReviewer(event.target.value) }, h('option', { value: '' }, 'Choose a classmate (optional)'), ...(members || []).filter(member => member.student_id !== user?.id).map(member => h('option', { key: member.student_id, value: member.student_id }, member.student_name)))),
        h('button', { type: 'submit', disabled: busy || submitting }, busy || submitting ? 'Working…' : 'Create pull request'),
        h('p', { role: 'status', className: 'pr-result' }, message))));
  }

  return { runCommand, TerminalGuide, PullRequestSidebar, nextStep };
}
