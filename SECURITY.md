# Security Policy

## Privacy & Security Guarantee 🔒

**Vinzor Compress Tool** is built as a 100% client-side web application.

* **Zero Server Uploads:** All image compression, resizing, cropping, stamp generation, and PDF conversions happen locally inside your web browser.
* **Complete Data Privacy:** Your uploaded passport photos, signatures, and personal documents are **never transmitted to any external server or database**.
* **Automatic Memory Clearance:** Once you close or refresh your browser tab, all uploaded and processed files are completely removed from system memory.

---

## Supported Versions

We actively maintain and provide security updates for the primary production version hosted on GitHub Pages:

| Version | Supported | Status |
| :--- | :--- | :--- |
| **1.0.x (Live)** | :white_check_mark: | Active Support |
| **< 1.0.0** | :x: | Deprecated |

---

## Security Architecture & Dependencies

* **HTTPS Encryption:** Hosted via GitHub Pages with forced SSL/TLS encryption.
* **Audited External CDNs:** We only load trusted, industry-standard open-source JavaScript libraries over secure CDN connections:
  * `jsPDF` (For PDF merging)
  * `JSZip` (For batch file archiving)
  * `CropperJS` (For image editing)

---

## Reporting a Vulnerability

If you discover a security vulnerability or bug within **Vinzor Compress Tool**, we appreciate your help in responsibly disclosing it to us.

### How to Report:
1. **GitHub Private Report:** Go to the **Security** tab of this repository and click **"Report a vulnerability"**.
2. **Instagram Direct Message:** Reach out to [@vinzorgaming](https://www.instagram.com/vinzorgaming/).
3. **YouTube Channel:** Contact via [VINZOR GAMING](https://www.youtube.com/channel/UCotcUt8NMCHFjfeDc646Tsg).

### Please Include:
* A description of the security bug or unexpected behavior.
* Steps to reproduce the issue (including your browser name and operating system).
* Screenshots or browser console log details if applicable.

### Expected Response Timeline:
* **Initial Acknowledgment:** Within 24–48 hours.
* **Patch Release / Resolution:** Within 3–5 business days depending on complexity.

---

## Responsible Disclosure Guidelines

* Please refrain from publicly disclosing any vulnerability before giving us reasonable time to patch the issue.
* Do not attempt to disrupt service availability or compromise end-user security.
