# Environment Setup

----

### Step 1: Create Empty Repository in GitLab First

**Create the repo in GitLab UI:**

The repo should already be created at https://gitlab.com/hits.govind/oxy.git

---

### Step 2: Clone the Empty Repository

```bash
cd ~
git -c http.proxy=http://10.10.152.62:3128 clone https://gitlab.com/hits.govind/oxy.git
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
  <h1>Amor vincit omnia</h1>
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