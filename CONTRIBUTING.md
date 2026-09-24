# Student branch workflow

Use `main` to get the course's published code. Do assignment work on your own branch. Changes enter the shared `main` through a pull request on GitHub.

## Start an assignment

Open the repository's root folder in VS Code. Before editing any files, check the current branch and working directory:

```bash
git status
```

If you have unfinished changes, commit them on your work branch before continuing. Once Git reports a clean working tree, run:

```bash
git switch main
git pull --ff-only origin main
git switch -c yourname/lab-6
```

Replace `yourname/lab-6` with your own name and assignment. Use a new branch name for each assignment. Confirm that VS Code's bottom-left branch indicator shows your branch before editing.

If the pull fails, stop and ask the instructor to help preserve your work. Do not force-push or reset away changes.

## Save and submit your work

1. In VS Code's Source Control view, review and stage the assignment files you intend to submit.
2. Commit them on your personal branch. Saving a file in the editor does not create a Git commit.
3. Publish your branch using **Publish Branch**, or run:

   ```bash
   git push -u origin yourname/lab-6
   ```

4. On GitHub, open a pull request with **base: main** and **compare: yourname/lab-6**.

Push later commits to the same branch to update that pull request. Do not merge your branch into local `main`; use the pull request on GitHub.

## Return to main

Commit your work and check `git status` before switching. Continue only when Git reports a clean working tree:

```bash
git switch main
git pull --ff-only origin main
```

Your assignment commits stay on your personal branch. They appear on `main` only after the pull request is merged on GitHub and you pull the updated `main`. If the pull request remains open or is rejected, your work remains available on your branch:

```bash
git switch yourname/lab-6
```

Uncommitted changes belong to the working directory and can follow you when you switch branches. Creating a branch alone does not save those changes on it; committing does.

## If you started editing on main by mistake

If the changes have not been committed, create your personal branch immediately:

```bash
git switch -c yourname/lab-6
```

Your edits stay in place. Review and commit them on that branch before switching back to `main`. If you already committed on local `main`, ask the instructor to help move the commits safely.

## What the protections do

GitHub requires pull requests into the shared `main`, with no configured bypasses. It also blocks force pushes and deletion of `main`.

The shared [VS Code settings](.vscode/settings.json) redirect VS Code commits on `main` to a new branch. Open the repository root to load these settings. Existing clones receive them when this change is merged and they pull `main`.

These editor settings do not make files read-only, control terminal Git commands, or prevent users from changing their settings. GitHub cannot control edits on a student's computer. Follow the branch and commit steps above to keep local `main` clean.

## Optional: keep main and assignment files in separate folders

A Git worktree gives your assignment branch its own working folder. Edits in that folder do not alter the original main folder, even before you commit.

Starting from the clean repository root on `main`, use this instead of `git switch -c`:

```bash
git pull --ff-only origin main
git worktree add -b yourname/lab-6 ../csc425-yourname-lab6 main
```

Open `../csc425-yourname-lab6` in a new VS Code window and do all assignment work there. Install dependencies in that folder using `npm run install:all`; copy or configure any local `.env` files there as needed. Keep the original folder for pulling `main`. Each folder has its own working files, while both share the repository's Git history.

See [VS Code's branch and worktree guide](https://code.visualstudio.com/docs/sourcecontrol/branches-worktrees).
