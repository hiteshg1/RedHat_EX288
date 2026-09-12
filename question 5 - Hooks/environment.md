# Question 5 — Environment setup

Complete this before the timed exercise. It prepares the supplied application without configuring the answer's build hook.

## Prerequisites

- Running OpenShift 4.18 CRC, a 4.18 `oc` client, Git, and curl.
- Logged-in OpenShift access with permission to create the lab project.
- Working internal image registry, cluster access to GitLab, the builder registry, and Python package downloads.
- Workstation DNS and connectivity for `*.apps-crc.testing`.
- Permission to create a public `blog` repository under `hits.govind`.

```bash
oc version
oc whoami
oc cluster-info
```

Verify the server is OpenShift 4.18 before continuing.

## Prepare the source repository

In GitLab, create a **blank public repository** named `blog` under `hits.govind`. Do not initialize it with a README. Use a fresh repository; do not overwrite an existing application's source.

From your chosen lab directory:

```bash
mkdir blog
cd blog
git init -b main
git remote add origin https://gitlab.com/hits.govind/blog.git
```

From the supplied **question5.md → Environment Setup → Step 3**, run the three file-creation blocks for:

```text
blog/
├── app.py
├── requirements.txt
└── mailer.py
```

Keep their contents unchanged, including `Flask==2.3.0` and `Werkzeug==2.3.0`. Use only those file-creation blocks; the original GitLab and cluster setup values are superseded by this document. The optional `chmod +x` is unnecessary because the answer invokes Python directly.

The original mailer attempts to call the `mail` utility for recipient `capnhook`. It catches/report errors and can finish without delivery. No SMTP setup is required. Its optimistic message text is retained as supplied; it must not be used to prove actual delivery.

```bash
git add app.py requirements.txt mailer.py
git commit -m "Prepare blog application for EX288 Question 5"
git push -u origin main
```

Authenticate using your Git credential helper. Source preparation ends here; do not change the repository during the timed exercise.

## Create the application

Use a fresh `octane` project. The Python builder is selected explicitly; `APP_FILE` selects the supplied Flask startup file.

```bash
oc new-project octane

oc new-app --name=blog --strategy=source \
  'registry.access.redhat.com/ubi9/python-312:latest~https://gitlab.com/hits.govind/blog.git#main' \
  --env=APP_FILE=app.py

oc logs -f bc/blog
oc get builds
```

Wait for the initial build to show `Complete` before continuing. If it fails, resolve its logged error first.

```bash
oc rollout status deployment/blog --timeout=5m
oc expose service/blog
oc get route/blog
```

The expected generated hostname is `blog-octane.apps-crc.testing`. If it differs, check the CRC ingress domain before attempting the question.

## Confirm the starting state

```bash
oc get bc/blog -o yaml
oc get is/blog deployment/blog svc/blog route/blog
oc get pods -l app=blog
oc set triggers deployment/blog
oc exec deployment/blog -- sh -c 'command -v python3; pwd; ls -l mailer.py'
curl --fail --show-error "http://$(oc get route/blog -o jsonpath='{.spec.host}')"
```

Check the BuildConfig uses source ref `main`, the selected Source builder, and output `blog:latest`; `postCommit` must be absent or empty. The Deployment should have an active image trigger for `blog:latest`. The generated Service must select the application Pods and target port 8080. The page must contain **Blog Application**.

No application PVC, ConfigMap, or additional Secret is needed for this public-repository setup. Do not configure a post-commit hook yet. Continue with [question.md](question.md).
