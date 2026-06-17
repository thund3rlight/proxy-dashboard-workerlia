# Proxy Dashboard Worker

One-click deployable Cloudflare Worker for generating expiring proxy URLs for `.m3u` / `.m3u8` stream URLs.

> Replace `YOUR_GITHUB_USERNAME/YOUR_REPO_NAME` below after you push this folder to GitHub.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/smokindope/proxy-with-tokens-and-no-pass-1-click)

## Deploy

1. Create a new public GitHub repo.
2. Upload these files.
3. Edit the deploy button URL above so it points to your repo.
4. Click **Deploy to Cloudflare**.

Cloudflare's Deploy to Cloudflare button clones the source repository into the deployer's GitHub/GitLab account and configures a Worker project from it.

## Local development

```bash
npm install
npm run dev
```

## Manual deploy

```bash
npm run deploy
```
