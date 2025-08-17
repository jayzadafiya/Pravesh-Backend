Alright — I’ll give you the **full step-by-step process from scratch** for making your Node.js backend on AWS EC2 accessible over **HTTPS** at
`https://api.pravesh.events`.

We’ll go from **bare EC2 instance → working secure API subdomain**.

---

## **Step 0: Assumptions**

- You already have:

  - Domain: `pravesh.events` (registered somewhere like GoDaddy, Namecheap, or Cloudflare)
  - Node.js app running on EC2 (e.g., on port `3000`)

- EC2 is Ubuntu-based (e.g., Ubuntu 20.04/22.04)
- Your EC2 **security group** has **ports 80 (HTTP) & 443 (HTTPS) open** to the public.

---

## **Step 1: Add subdomain in DNS**

1. Go to your domain registrar’s DNS management.

2. Add a new **A record**:

   ```
   Type: A
   Name: api
   Value: <Your EC2 Public IPv4 Address>
   TTL: 300 (or default)
   ```

   Example:

   | Type | Name | Value         | TTL |
   | ---- | ---- | ------------- | --- |
   | A    | api  | 13.233.45.XXX | 300 |

3. Save it.

4. Check propagation:

   ```bash
   nslookup api.pravesh.events
   ```

   It should return your EC2 IP.

---

## **Step 2: Install Nginx on EC2**

SSH into your EC2:

```bash
sudo apt update
sudo apt install nginx -y
```

Check status:

```bash
sudo systemctl status nginx
```

---

## **Step 3: Configure Nginx for the subdomain**

Create a new site config:

```bash
sudo nano /etc/nginx/sites-available/api.pravesh.events
```

Paste:

```nginx
server {
    listen 80;
    server_name api.pravesh.events;

    location / {
        proxy_pass http://localhost:3000; # Your Node.js port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/api.pravesh.events /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## **Step 4: Install Certbot & get SSL**

```bash
sudo apt install certbot python3-certbot-nginx -y
```

Run Certbot for your subdomain:

```bash
sudo certbot --nginx -d api.pravesh.events
```

- It will ask:

  - Email address for renewal notifications
  - Agreement to terms (`Y`)
  - Whether to redirect HTTP → HTTPS (**choose yes**)

- Certbot will automatically edit your Nginx config to include SSL.

---

## **Step 5: Test your API**

Open:

```
https://api.pravesh.events
```

If your Node app returns a response, it’s working over HTTPS.

---

## **Step 6: Auto-renew SSL**

Certbot already adds an auto-renew cron job, but you can test it:

```bash
sudo certbot renew --dry-run
```

---

## **Step 7: Keep Node.js running (PM2)**

If your Node.js app isn’t already running as a service:

```bash
sudo npm install -g pm2
pm2 start server.js --name pravesh-api
pm2 startup
pm2 save
```

---

✅ **End result**

- `https://api.pravesh.events` → Your Node.js backend over HTTPS.
- SSL auto-renews.
- Frontend can be hosted at `https://pravesh.events` (optional, separate config).

---

If you want, I can **combine `pravesh.events` for frontend + `api.pravesh.events` for backend on the same EC2**, so both share one server but stay separate and secure.
That’s common in production deployments.

Do you want me to prepare that combined setup?
