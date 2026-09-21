
---
# Question 3: Customize S2I Builder Image Scripts
### Part 1 — Build the application

1. Create a project named `s2i-builds`.
2. Build an application named `oxy` using Source-to-Image (S2I).
3. Use branch `main` of this Git repository:

   `http://git.ocp4.example.com/developer/oxy.git`

4. In the repository, modify `.s2i/bin/assemble` so that, during the image build, it:
   - Copies all `*.html` files directly under `/tmp/src` into the builder’s application working directory.
   - Creates `info.html` in that directory with two lines:

     ```text
     <image build date in YYYY-MM-DD format>
     This is the application oxy. If you see this its working.
     ```

5. Make the assemble script executable, then commit and push the changes to `main`.
6. Use the S2I-compatible `httpd:2.4-ubi9` builder image from the namespace or registry specified by the exam.
7. Ensure `index.html` displays:

   ```text
   Amor vincit omnia
   ```

8. Complete the build and make the resulting application image available as `oxy:latest` in `s2i-builds`.

### Part 2 — Deploy the application

1. Create a project named `tocin`.
2. Deploy an application named `oxy` using the image built in Part 1.
3. Configure the necessary permissions for the deployment to pull the image from `s2i-builds`.
4. Create a Service and expose the application at:

   `http://oxy-tocin.apps.ocp4.example.com`

5. Verify that `/` displays:

   ```text
   Amor vincit omnia
   ```

6. Verify that `/info.html` displays the image build date followed by:

   ```text
   DATE
   This is the application oxy. If you see this its working.
   ```


---

## Environment Setup

### Step 1: Create Empty Repository in GitLab First

**Create the repo in GitLab UI:**

1. Go to `https://gitlab.com`
2. Login as `hits.govind@gmail.com` / `********`
3. Click **"New project"** → **"Create blank project"**
4. Project name: **oxy**
5. **IMPORTANT:** 
   - Set visibility to **Public** or **Internal**
   - **Check** "Initialize repository with a README"
6. Click **"Create project"**

---

### Step 2: Clone the Empty Repository

```bash
cd ~
git clone https://gitlab.com/hits.govind/oxy.git
cd oxy
```

You should see:
```
oxy/
└── README.md
```

---

### Step 3: Create Application Files

**Create the main HTML file:**

```bash
cat > index.html <<'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>Oxy Application</title>
</head>
<body>
  <h1>This is the application oxy. If you see this its working.</h1>
</body>
</html>
EOF
```

---

### Step 4: Create S2I Scripts Directory

**Create S2I scripts directory:**

```bash
mkdir -p .s2i/bin
```

**Create a basic (unmodified) assemble script:**

```bash
cat > .s2i/bin/assemble <<'EOF'
#!/bin/bash
# This is the default assemble script
# It does NOT copy HTML files or generate info.html yet

echo "Running default assemble script..."

# Source the default assemble from the builder image
if [ -f /usr/libexec/s2i/assemble ]; then
  /usr/libexec/s2i/assemble
fi
EOF

chmod +x .s2i/bin/assemble
```

---

### Step 5: Commit and Push Initial Setup

```bash
git add .
git commit -m "Initial oxy app without custom assemble modifications"
git push origin main
```

**Verify in GitLab:**

Go to `https://git.ocp4.example.com/developer/oxy` and verify you see:

```
oxy/
├── README.md
├── index.html
└── .s2i/
    └── bin/
        └── assemble
```

---

### Step 6: Create the Build Namespace

```bash
oc new-project s2i-builds
```

This namespace will hold the S2I image build.

---

**Setup complete.** The basic S2I structure is ready for customization, and the build namespace exists.

