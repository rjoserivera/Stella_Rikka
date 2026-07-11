# Security Analysis

The following document details the security posture of **Stella Rikka**, identifying known risks, implemented mitigations, and critical considerations for network environments.

## 1. Base Architecture (Local-First)
Stella Rikka was originally designed as a single-user *Local-First* application.
* **Backend:** Flask (Python) running locally.
* **Storage:** Flat JSON files in the `backend/data/` directory.
* **Network:** By default, Flask only binds to `127.0.0.1:5000` (`localhost`), making it inaccessible from other computers on the same LAN unless `host="0.0.0.0"` is explicitly configured.

### Local Security Posture: **HIGH**
In strictly local mode, the application inherits the operating system's security. There is no port exposure to the outside, and files are saved with the active user's permissions.

---

## 2. Prevention of Classic Vulnerabilities

### 2.1 Cross-Site Scripting (XSS)
- **Risk:** Injection of malicious scripts through inputs like project names, Kanban tasks, Hub descriptions, or Lean Canvas notes.
- **Mitigation:** The frontend uses secure DOM insertion methods. The utility function `escHtml()` is used in the vast majority of renderings (e.g., `String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')...`) to neutralize untrusted HTML tags.
- **Conclusion:** Low risk, although data escaping discipline must be maintained when adding new modules.

### 2.2 Path Traversal
- **Risk:** A malicious user requests files outside the frontend environment using `../../`.
- **Mitigation:** The backend API serves static files using Flask's native `send_from_directory()` function, which intrinsically sanitizes relative paths and prevents directory traversal outside the designated folder (`FRONTEND_DIR`).
- **Conclusion:** Natively protected by the framework.

### 2.3 Command Injection
- **Risk:** Command injection in `subprocess` calls.
- **Mitigation:** The only place where `subprocess` is used is in `host_manager.py` to start the SSH tunnel. Arguments are passed as a strict list (e.g., `["ssh", "-R", "80:127.0.0.1:5000", "serveo.net"]`), and there is no concatenation of user-provided strings.
- **Conclusion:** Secure.

---

## 3. Critical Risks: Collaboration Tunnel (Cloud Sharing)

Stella Rikka features a module for sharing the local environment over the Internet using a reverse SSH tunnel (`serveo.net`). **This is where the suite's biggest security risk lies.**

### 3.1 Lack of Authentication and Authorization (CWE-284)
- **Vulnerability:** The suite **completely lacks a login system, passwords, or session tokens**. If the tunnel is active, anyone in the world who has (or guesses) the generated URL (`https://[subdomain].serveo.net`) has full Read and Write access to the entire suite.
- **Impact:** **Critical.** An attacker could delete projects, modify databases, or inject code into the host user's local JSONs.
- **Current Mitigation:** 
  1. **Host Isolation:** Tunnel control endpoints (`/api/host/start` and `/stop`) are blocked for requests containing the `X-Forwarded-For` header.
  2. **Deletion Block (Partial Read-Only):** The middleware intercepts any `DELETE` request to `/proyectos` endpoints if the IP comes from a guest, throwing a 403 error. This protects the suite from malicious mass deletions.
  3. **Auto-Backups:** Right before opening the tunnel, the system clones the entire `data/` folder into `data_backups/auto_backup_[TIMESTAMP]`. If guests alter or damage the project, the host can manually revert changes using this snapshot.
  4. **Real-Time Monitoring:** The frontend polls the `/api/host/connections` endpoint every 5 seconds to inform the host how many active devices (unique `X-Forwarded-For`s) are inside the tunnel.
- **Recommended Mitigation (Future):** Implement *HTTP Basic Auth* in Flask, or a simple token mechanism requiring a key in the frontend before rendering the application when accessed from a non-local IP.

### 3.2 Denial of Service (DoS) on JSON Files
- **Vulnerability:** Since there is no length validation or quota control in the JSON payload received by the backend (`PUT` or `POST`), an attacker connected via the tunnel could repeatedly send a massive multi-Gigabyte payload.
- **Impact:** **Medium/High.** Disk Exhaustion on the host computer, or Out Of Memory (OOM) in the Python process when attempting `json.loads()`.
- **Recommended Mitigation (Future):** Limit the maximum request body size in Flask (`app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024` for 16MB).

---

## 4. Conclusion and Recommendations

Stella Rikka is a **very secure tool for personal use in offline or local network (localhost) modes**. Common injection and path traversal vulnerabilities are well covered.

However, the **Cloud Collaboration Mode is fundamentally insecure** in its current state for hostile or public environments due to the lack of authentication.

**Guide for the End User:**
1. Only activate the tunnel when you are explicitly sharing at the moment with a trusted colleague.
2. Close the tunnel as soon as you finish the collaborative session.
3. Do not share the tunnel link in public forums or chats.
