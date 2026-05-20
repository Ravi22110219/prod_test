# prod_test Production Deployment

This app should deploy as one production service. Docker builds React, copies the built frontend into FastAPI, and FastAPI serves both the UI and `/api` routes on port `8000`.

## Production Shape

```text
GitHub push to main
  -> GitHub Actions
  -> SSH to production server
  -> git pull/reset in /home/production/apps/prod_test
  -> restart prod_test.service
  -> Docker Compose rebuilds and runs app
  -> Cloudflare Tunnel/Nginx exposes localhost:8000
```

## One-Time Server Setup

Run these commands on the production server.

```bash
sudo apt update
sudo apt install -y git docker.io docker-compose-plugin
sudo usermod -aG docker production
```

Log out and back in after adding the `production` user to the `docker` group.

Clone the repo:

```bash
mkdir -p /home/production/apps
cd /home/production/apps
git clone https://github.com/Ravi22110219/prod_test.git
cd prod_test
```

Install the systemd service:

```bash
sudo cp deploy/prod_test.service /etc/systemd/system/prod_test.service
sudo systemctl daemon-reload
sudo systemctl enable --now prod_test.service
```

Verify:

```bash
sudo systemctl status prod_test.service --no-pager
sudo ss -tulpn | grep 8000
curl http://127.0.0.1:8000/api/health
```

## GitHub Actions Secrets

Add these in GitHub:

```text
Settings -> Secrets and variables -> Actions -> New repository secret
```

Required secrets:

```text
PROD_HOST       server IP or SSH hostname
PROD_USER       production
PROD_SSH_KEY    private SSH key allowed to SSH into the server
```

Optional:

```text
PROD_SSH_PORT   default is 22
```

The public key matching `PROD_SSH_KEY` must exist on the server in:

```text
/home/production/.ssh/authorized_keys
```

## Sudo Permission For CI/CD

GitHub Actions restarts only this service. Allow the `production` user to do that without a password:

```bash
sudo visudo
```

Add:

```text
production ALL=(root) NOPASSWD: /bin/systemctl daemon-reload, /bin/systemctl restart prod_test.service, /bin/systemctl status prod_test.service
```

If your server uses `/usr/bin/systemctl`, check with:

```bash
which systemctl
```

and use that path in `visudo`.

## Deploy Flow

Developer machine:

```bash
git add .
git commit -m "Update prod_test"
git push origin main
```

GitHub Actions will deploy automatically after the push.

Manual deploy is also available from:

```text
GitHub -> Actions -> Deploy production -> Run workflow
```

## Cloudflare Tunnel Ingress

Add this to your tunnel ingress config when you want public access:

```yaml
- hostname: prod-test.airesqclimsols.com
  service: http://localhost:8000
```

Then run:

```bash
cloudflared tunnel route dns airesq prod-test.airesqclimsols.com
sudo systemctl restart cloudflare
sudo journalctl -u cloudflare -n 50 --no-pager
```

## Production Checklist

- Correct branch pushed to GitHub.
- GitHub Actions deploy job passed.
- `prod_test.service` is active.
- `curl http://127.0.0.1:8000/api/health` returns `status: ok`.
- `sudo ss -tulpn | grep 8000` shows the app listening.
- Cloudflare ingress points to `http://localhost:8000`.
- Public hostname opens the React UI.
