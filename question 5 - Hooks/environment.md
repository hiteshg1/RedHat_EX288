# EX288 Practice Environment Setup

Prepare this environment before starting Question 5. Estimated setup time: **20–35 minutes**, excluding installation of CRC. This creates a running application with `mailer.py` present and **no post-commit hook**.

## Prerequisites

- A running CRC cluster with OpenShift 4.18, build capability, a working internal image registry, and sufficient resources for source builds.
- The OpenShift 4.18 `oc` client, Git, curl, and a Bash-compatible terminal. The client found during document review was 4.10.67; install or select the 4.18 client before this lab. [Official client instructions](https://docs.redhat.com/en/documentation/openshift_container_platform/4.18/html/cli_tools/openshift-cli-oc).
- A logged-in account allowed to create a project and its application/build resources.
- GitLab access to create a public practice repository in `hits.govind`. Use your configured Git credential helper for push authentication; do not put tokens into repository URLs.
- Cluster access to GitLab and `registry.access.redhat.com`, plus any package endpoints used by the builder. The workstation must resolve application hosts under `apps-crc.testing` and reach the CRC router.

## Verify OpenShift Access

```bash
oc version
oc whoami
oc cluster-info
oc get clusterversion version -o jsonpath='{.status.desired.version}{"\n"}'
```

Check that the server release is 4.18.x. If your account cannot read ClusterVersion, ask the lab administrator to verify it. A newer CRC bundle does not automatically provide a 4.18 lab.

## GitLab Repositories

Required repository: `https://gitlab.com/hits.govind/ex288-q5-blog`.

In GitLab, create a **blank public project** named `ex288-q5-blog` under `hits.govind`, without initializing a README. This is a new practice fixture; do not overwrite an existing repository with unrelated work. Public visibility avoids source authentication setup. If public projects are unavailable, private-repository authentication must be configured separately before proceeding.

From a study directory of your choice:

```bash
mkdir ex288-q5-blog
cd ex288-q5-blog
git init -b main
git remote add origin https://gitlab.com/hits.govind/ex288-q5-blog.git
mkdir -p .s2i
```

Create these files using the complete contents below:

```text
ex288-q5-blog/
├── .s2i/
│   └── environment
├── app.py
├── mailer.py
└── requirements.txt
```

### app.py

This intentionally small lab server needs no Flask or database. It preserves the original exercise's HTTP page and health endpoint.

```python
import os
from http.server import BaseHTTPRequestHandler, HTTPServer


class BlogHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            body = b"OK\n"
            content_type = "text/plain"
        elif self.path == "/":
            body = b"<h1>Blog Application</h1><p>EX288 Question 5 lab.</p>\n"
            content_type = "text/html"
        else:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    HTTPServer(("0.0.0.0", int(os.environ.get("PORT", "8080"))), BlogHandler).serve_forever()
```

### mailer.py

The task requires execution, not delivery. This fixture explicitly simulates notification and does not assume SMTP, a local mail client, recipients, or injected build metadata. It avoids the source script's misleading delivery claim. No executable bit is required when invoked through Python.

```python
from datetime import datetime, timezone


def main():
    print("Q5_MAILER_EXECUTED", flush=True)
    print(f"UTC time: {datetime.now(timezone.utc).isoformat()}", flush=True)
    print("Notification simulation only; no email sent.", flush=True)
    print("mailer.py script executed successfully", flush=True)


if __name__ == "__main__":
    main()
```

### requirements.txt

```text
# This fixture uses only the Python standard library.
```

### .s2i/environment

```text
APP_FILE=app.py
```

The chosen image supports `APP_FILE` and `.s2i/environment`. The fixture's server binds explicitly to port 8080. [Python 3.12 S2I image documentation](https://github.com/sclorg/s2i-python-container/blob/master/3.12/README.md).

Commit the prerequisite files:

```bash
git add app.py mailer.py requirements.txt .s2i/environment
git commit -m "Prepare EX288 Question 5 practice application"
git push -u origin main
git ls-remote https://gitlab.com/hits.govind/ex288-q5-blog.git refs/heads/main
```

Verify that GitLab displays all four files on `main`. Source changes end here; the timed task changes OpenShift configuration only.

## OpenShift Setup

Use a fresh project. Run blocks in order and stop on errors. The builder is selected explicitly instead of relying on source detection. Its `latest` tag is mutable; record the resolved input image from the Build for repeatability. If exact repetition is needed later, use that verified digest.

```bash
oc new-project ex288-q5

oc new-build \
  --name=blog \
  --strategy=source \
  --docker-image=registry.access.redhat.com/ubi9/python-312:latest \
  --code=https://gitlab.com/hits.govind/ex288-q5-blog.git \
  --to=blog:latest \
  --dry-run=client -o yaml > q5-build.yaml
```

Before applying `q5-build.yaml`, edit the BuildConfig entry in it: set `spec.source.git.ref` to `main` and replace its `spec.triggers` value with `[]`. Leave the generated ImageStreams and output reference intact. These are setup edits to a local manifest, not changes to application source. The resulting BuildConfig portions must include:

```yaml
spec:
  source:
    type: Git
    git:
      uri: https://gitlab.com/hits.govind/ex288-q5-blog.git
      ref: main
  triggers: []
```

This is a fragment to merge into the generated BuildConfig, not a complete manifest. Manual-only build triggering avoids an unexpected automatic build while configuring the fixture. Do not add `postCommit`.

```bash
oc apply -f q5-build.yaml
oc get bc/blog -o yaml
Q5_INITIAL_BUILD=$(oc start-build blog -o name)
oc logs -f "$Q5_INITIAL_BUILD"
oc wait --for=jsonpath='{.status.phase}'=Complete "$Q5_INITIAL_BUILD" --timeout=15m
oc get istag/blog:latest
```

Continue only after the Build is `Complete`. The output ImageStreamTag points to the image published in the internal registry. [Build output documentation](https://docs.redhat.com/en/documentation/openshift_container_platform/4.18/html/builds_using_buildconfig/managing-build-output).

Create an explicit Kubernetes Deployment from the built image, then wire future image changes to it:

```bash
Q5_IMAGE=$(oc get istag/blog:latest -o jsonpath='{.image.dockerImageReference}')
test -n "$Q5_IMAGE"
oc create deployment blog --image="$Q5_IMAGE"
Q5_CONTAINER=$(oc get deployment/blog -o jsonpath='{.spec.template.spec.containers[0].name}')
oc set triggers deployment/blog --from-image=blog:latest -c "$Q5_CONTAINER"
oc expose deployment/blog --port=8080 --target-port=8080 --name=blog
oc expose service/blog
oc rollout status deployment/blog --timeout=5m
```

The Deployment image trigger updates the container image when `blog:latest` changes. It is independent of BuildConfig build-start triggers. [OpenShift Deployment image triggers](https://docs.redhat.com/en/documentation/openshift_container_platform/4.18/html/images/triggering-updates-on-imagestream-changes).

No DeploymentConfig, PVC, custom ServiceAccount, additional RBAC, ConfigMap, or application Secret is needed. The standard project service accounts support this same-project build and image pull workflow.

## Validation

```bash
oc project ex288-q5
oc get bc/blog is/blog deployment/blog svc/blog route/blog
oc get "$Q5_INITIAL_BUILD" -o jsonpath='{.status.phase}{"\n"}'
oc get bc/blog -o jsonpath='{.spec.source.git.uri}{"\n"}{.spec.source.git.ref}{"\n"}{.spec.output.to.name}{"\n"}{.spec.postCommit}{"\n"}'
oc get pods -l app=blog
oc get svc/blog -o jsonpath='{.spec.selector}{"\n"}{.spec.ports}{"\n"}'
oc get endpointslices -l kubernetes.io/service-name=blog
oc set triggers deployment/blog
oc exec deployment/blog -- python3 -c 'import os,sys; print(sys.executable); print(os.getcwd()); assert os.path.isfile("mailer.py")'
Q5_HOST=$(oc get route/blog -o jsonpath='{.spec.host}')
printf '%s\n' "$Q5_HOST"
curl --fail --show-error "http://$Q5_HOST/"
curl --fail --show-error "http://$Q5_HOST/health"
```

Ready means: initial build `Complete`, source ref `main`, output `blog:latest`, empty/missing `postCommit`, Deployment available, Service selector matching `app=blog`, ready endpoints targeting port 8080, and HTTP responses containing `Blog Application` and `OK`.

The generated hostname should be `blog-ex288-q5.apps-crc.testing`. If its suffix differs, check the CRC ingress configuration before starting; a Route alone does not create workstation DNS. Inspect admission with `oc describe route/blog`.

Do not configure the hook during setup. Now begin the timed Scenario in [README.md](README.md).
